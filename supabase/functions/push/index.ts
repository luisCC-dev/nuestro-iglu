// Edge Function "push" (Supabase). Desplegada con "Verify JWT" desactivado:
// no confía en lo que recibe; vuelve a mirar la base de datos antes de enviar nada.
// Modos (POST JSON { mode }):
//   key   -> { publicKey }                      (la app la usa para suscribirse)
//   event -> aviso a la pareja cuando alguien guarda algo (lo llama un trigger de la BD)
//   daily -> recordatorio diario a la hora elegida (lo llama pg_cron cada hora)
//   test  -> aviso de prueba a un móvil ya suscrito
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_URL = "https://luiscc-dev.github.io/nuestro-iglu/";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

let ready: Promise<string> | null = null;
async function keys(): Promise<string> {
  let { data } = await sb.from("push_config").select("public_key, private_key").eq("id", 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await sb.from("push_config").upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: "id", ignoreDuplicates: true });
    ({ data } = await sb.from("push_config").select("public_key, private_key").eq("id", 1).single());
  }
  webpush.setVapidDetails(APP_URL, data!.public_key, data!.private_key);
  return data!.public_key;
}

type Sub = { endpoint: string; p256dh: string; auth: string };
async function send(subs: Sub[], payload: Record<string, unknown>) {
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ url: APP_URL, ...payload }), { TTL: 60 * 60 * 6 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      else console.error("push error", code, String(e));
    }
  }
  return sent;
}

const HUG_TEXT: Record<string, string> = {
  abrazo: "te manda un abrazo 🤗", beso: "te manda un beso 😘", choca: "quiere chocar esa aleta 🙌",
  pienso: "está pensando en ti 💭", "extraño": "te echa de menos 🥺", siesta: "quiere una siesta contigo 😴",
  baile: "te saca a bailar 💃", cosquillas: "te hace cosquillas 😆",
};

async function onEvent(b: { couple_id: string; kind: string; day: string; slot: string }) {
  // Comprobar que la entrada existe y es reciente (evita avisos falsos).
  const { data: e } = await sb.from("entries").select("data, updated_at")
    .eq("couple_id", b.couple_id).eq("kind", b.kind).eq("day", b.day).eq("slot", b.slot).maybeSingle();
  if (!e || Date.now() - Date.parse(e.updated_at) > 120_000) return 0;
  const { data: m } = await sb.from("members").select("name").eq("couple_id", b.couple_id).eq("slot", b.slot).maybeSingle();
  const who = m?.name || "Tu pareja";
  let title = "", body = "", tag = `${b.kind}-${b.day}`;
  const d = e.data as Record<string, any>;
  switch (b.kind) {
    case "answer": title = `${who} ha respondido 🐧`; body = "Responde tú también para ver su respuesta."; break;
    case "mood": title = `${who} ha escrito su día`; body = "Mira cómo se siente hoy."; break;
    case "game": title = `${who} ha jugado a Esto o aquello`; body = "¿Te toca? ¿Quién conoce mejor a quién?"; break;
    case "likely": title = `${who} ha votado en ¿Quién es más probable?`; body = "Vota tú para ver en qué coincidís."; break;
    case "word": title = `${who} te ha puesto una palabra secreta 🧊`; body = "Adivínala antes de que se derrita el hielo."; break;
    case "wordplay":
      if (!d.result) return 0;
      title = d.result === "win" ? `${who} adivinó tu palabra 🎉` : `${who} se cayó al agua 💦`;
      body = d.result === "win" ? "¡Salvó a su pingüino!" : "No adivinó tu palabra secreta."; break;
    case "draw": title = `${who} te ha dejado un dibujo ✏️`; body = "¿Adivinas qué es?"; break;
    case "drawguess":
      if (!d.result) return 0;
      title = d.result === "win" ? `${who} adivinó tu dibujo 🎨` : `${who} no adivinó tu dibujo`;
      body = d.result === "win" ? "+5 monedas extra para ti." : "Mira qué dijo en Dibuja y adivina."; break;
    case "hug": {
      const last = (d.items || []).at(-1);
      if (!last || Date.now() - last.at > 120_000) return 0;
      title = `${who} ${HUG_TEXT[last.type] || "te manda un mimo 💗"}`; body = last.msg || "Abre el iglú para devolverle el mimo."; tag = `hug-${last.at}`;
      break;
    }
    default: return 0;
  }
  const { data: subs } = await sb.from("push_subs").select("endpoint, p256dh, auth")
    .eq("couple_id", b.couple_id).neq("slot", b.slot);
  return send(subs || [], { title, body, tag });
}

function localParts(tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

async function onDaily() {
  const { data: subs } = await sb.from("push_subs").select("*");
  let sent = 0;
  for (const s of subs || []) {
    let lp;
    try { lp = localParts(s.tz); } catch { lp = localParts("Europe/Madrid"); }
    if (lp.hour !== s.remind_hour || s.last_daily === lp.date) continue;
    await sb.from("push_subs").update({ last_daily: lp.date }).eq("endpoint", s.endpoint);
    const { data: done } = await sb.from("entries").select("slot")
      .eq("couple_id", s.couple_id).eq("kind", "answer").eq("day", lp.date).eq("slot", s.slot).maybeSingle();
    if (done) continue;
    sent += await send([s], { title: "La pregunta de hoy te espera 🐧", body: "Responde y descubre lo que ha contestado tu pareja.", tag: `daily-${lp.date}` });
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    ready ??= keys();
    const publicKey = await ready;
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    switch (b.mode) {
      case "key": return json({ publicKey });
      case "event": return json({ sent: await onEvent(b) });
      case "daily": return json({ sent: await onDaily() });
      case "test": {
        const { data: s } = await sb.from("push_subs").select("endpoint, p256dh, auth").eq("endpoint", String(b.endpoint || "")).maybeSingle();
        if (!s) return json({ error: "not subscribed" }, 404);
        return json({ sent: await send([s], { title: "¡Avisos activados! 🐧", body: "Así te llegarán los avisos del iglú.", tag: "test" }) });
      }
      default: return json({ error: "unknown mode" }, 400);
    }
  } catch (e) {
    console.error(e);
    ready = null;
    return json({ error: String(e) }, 500);
  }
});
