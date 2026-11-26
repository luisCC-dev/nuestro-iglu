// Escena del iglú (portada de "Hoy" y vista previa de la Tienda).
// bg: id de fondo de la tienda ('bg:aurora') o null; night: si es de noche y no hay fondo.
// duo: HTML de los pingüinos; top: HTML encima (saludo, monedas…); cls: clases extra.
export function scene({ bg = null, night = false, duo = '', top = '', cls = '' } = {}) {
  const bgCls = bg ? 'bg-' + bg.split(':')[1] : night ? 'night' : '';
  return `<section class="hero ${cls} ${bgCls}">
    ${top}
    <div class="floe"><div class="duo">${duo}</div><div class="ice"></div></div>
  </section>`;
}

// Muestra pequeña de un fondo para la tienda.
export function bgSwatch(bg) {
  return `<span class="bg-swatch bg-${bg.split(':')[1]}"></span>`;
}
