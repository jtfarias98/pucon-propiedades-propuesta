/* Pucón Propiedades — interacciones (sin librerías, ~8 KB) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- MODO DEMO ----------
     true  = versión de prueba para la propuesta: solo abren/cierran Menú y Reservar, nada más funciona.
     false = versión final: todos los botones funcionan y Buscar lleva al catálogo del cliente (CATALOG). */
  const DEMO = true;

  /* ---------- Demo: solo funcionan Menú y Reservar (abrir y cerrar paneles) ---------- */
  const ALLOWED = '#burger, .header__book, [data-close-panel], #veil';
  const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [data-full], [data-filter], [data-i], #masonry figure, .carousel, [tabindex]';
  const block = e => {
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el.closest(ALLOWED)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  if (DEMO) ['click', 'mousedown', 'keydown', 'submit'].forEach(t => addEventListener(t, e => {
    if (t === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    block(e);
  }, true));

  /* ---------- Header: siempre fijo arriba; se vuelve sólido al bajar ---------- */
  const header = $('#header');
  // la barra de secciones queda justo bajo el header
  const placeSubnav = () => document.documentElement.style.setProperty('--subnav-top', header.offsetHeight + 'px');
  const onScroll = () => { header.classList.toggle('is-solid', scrollY > 60); placeSubnav(); };
  addEventListener('scroll', onScroll, { passive: true });
  header.addEventListener('transitionend', placeSubnav);
  addEventListener('resize', placeSubnav);
  onScroll();

  /* ---------- Paneles laterales: menú y reservas ---------- */
  const burger = $('#burger'), veil = $('#veil'), heroText = $('.hero__content');
  const panels = { menu: $('#menu'), book: $('#reservas') };
  let current = null;

  // cascada: cada elemento del panel entra un poco después del anterior
  $$('#menu .menu__list li, #menu .menu__foot').forEach((el, i) => { el.dataset.stagger = ''; el.style.setProperty('--i', i); });
  $$('#reservas .panel__body > *').forEach((el, i) => { el.dataset.stagger = ''; el.style.setProperty('--i', i); });

  // la portada se corre a la izquierda (y se achica un poco si no cabe) para dar espacio al panel
  const shiftHero = on => {
    if (!on || innerWidth <= 720) { heroText.style.transform = ''; return; }
    const pw = panels.menu.getBoundingClientRect().width;
    const avail = innerWidth - pw - 96;
    const w = Math.max(heroText.offsetWidth, ...[...heroText.children].map(c => c.scrollWidth));
    const s = Math.min(1, avail / w);
    heroText.style.transform = `translateX(${-pw / 2}px) scale(${s.toFixed(3)})`;
  };

  const openPanel = name => {
    if (current === name) return closePanel();
    if (current) { panels[current].classList.remove('is-open'); panels[current].setAttribute('aria-hidden', 'true'); }
    current = name;
    const el = panels[name];
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    body.classList.add('panel-open', 'is-locked');
    burger.setAttribute('aria-expanded', name === 'menu');
    shiftHero(true);
    setTimeout(() => (el.querySelector('.menu__list a, input, select') || el).focus({ preventScroll: true }), 650);
  };
  const closePanel = () => {
    if (!current) return;
    const el = panels[current];
    el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
    body.classList.remove('panel-open', 'is-locked');
    burger.setAttribute('aria-expanded', 'false');
    shiftHero(false);
    const was = current; current = null;
    (was === 'menu' ? burger : $('.header__book')).focus({ preventScroll: true });
  };

  burger.addEventListener('click', () => openPanel('menu'));
  veil.addEventListener('click', closePanel);
  $$('[data-close-panel]').forEach(b => b.addEventListener('click', closePanel));
  addEventListener('keydown', e => { if (e.key === 'Escape' && current) closePanel(); });
  addEventListener('resize', () => { if (current) shiftHero(true); });

  // Todo botón o link "Buscar" / "Agendar visita" abre el panel de búsqueda (sin recorrer la página)
  // data-op y data-type dejan preseleccionada la operación y el tipo de propiedad
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#reservas"]');
    if (!a) return;
    e.preventDefault();
    ['op', 'type'].forEach(name => {
      const sel = $(`#reservas select[name=${name}]`);
      if (sel && a.dataset[name] !== undefined) { sel.value = a.dataset[name]; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    openPanel('book');
  });

  // Demo: los links de secciones del menú lateral no hacen nada
  $$('#menu a[href^="#"]:not([href="#reservas"])').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (DEMO) return;
    const target = a.hash && a.hash.length > 1 ? $(a.hash) : null;
    if (!target) return;
    closePanel();
    setTimeout(() => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 450);
  }));

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Contadores ---------- */
  const countIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = reduce ? 1 : 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e).toLocaleString('es-CL') + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Subnav: sección actual ---------- */
  const subLinks = $$('.subnav a');
  const secIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) subLinks.forEach(a => a.classList.toggle('is-current', a.hash === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  subLinks.forEach(a => { const s = $(a.hash); if (s) secIO.observe(s); });

  /* ---------- Carrusel con fundido ---------- */
  $$('[data-carousel]').forEach(c => {
    const slides = $$('.carousel__slide', c), cur = $('[data-current]', c);
    $('[data-total]', c).textContent = slides.length;
    let i = 0, timer;
    const go = n => {
      slides[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      cur.textContent = i + 1;
    };
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 6000); };
    $('[data-prev]', c).addEventListener('click', () => { go(i - 1); auto(); });
    $('[data-next]', c).addEventListener('click', () => { go(i + 1); auto(); });
    // swipe
    let x0 = null;
    c.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    c.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
    auto();
  });

  /* ---------- Riel de habitaciones ---------- */
  const rail = $('[data-rail]');
  if (rail) {
    const bar = $('.rail__progress span');
    const step = () => rail.querySelector('.room').getBoundingClientRect().width + 28;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const vis = rail.clientWidth / rail.scrollWidth;
      bar.style.width = (vis * 100) + '%';
      bar.style.transform = `translateX(${max ? (rail.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0}%)`;
    };
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    $('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  /* ---------- Galería ---------- */
  const photos = [
    ['home6', 'entorno', 'Volcán Villarrica y lagos'],
    ['prop_1881_foto_44389', 'casas', 'Casa en Loteo La Candelaria'],
    ['prop_1211_foto_30375', 'departamentos', 'Condominio Parque Pinares'],
    ['prop_1343_foto_24891', 'parcelas', 'Loteo Altos de Liucura'],
    ['home2', 'entorno', 'Bosque nativo en otoño'],
    ['prop_1654_foto_31370', 'casas', 'Casa en parcela, sector Los Riscos'],
    ['prop_1514_foto_28189', 'departamentos', 'Condominio La Puntilla, Villarrica'],
    ['prop_1105_foto_20497', 'parcelas', 'Propiedad con vista al volcán'],
    ['home5', 'entorno', 'Atardecer en el Lago Villarrica'],
    ['prop_1992_foto_41105', 'casas', 'Condominio Jardines de Quelhue'],
    ['prop_2208_foto_47018', 'departamentos', 'Condominio Parque Payllahue'],
    ['prop_1466_foto_26936', 'parcelas', 'Casa en parcela, Candelaria'],
    ['home7', 'entorno', 'Volcán Villarrica'],
    ['prop_414_foto_25220', 'casas', 'Condominio Portal Pucón'],
    ['prop_1806_foto_36082', 'departamentos', 'Edificio Rukamahuida'],
    ['prop_2151_foto_45165', 'parcelas', 'Tiny house en Mirador del Lago'],
    ['home3', 'entorno', 'Trekking con vista al volcán'],
    ['prop_164_foto_32640', 'casas', 'Condominio Parque Foresta'],
    ['prop_1759_foto_34986', 'departamentos', 'Los Castaños de Alicura'],
    ['home1', 'entorno', 'Golf entre bosques'],
  ];
  const masonry = $('#masonry');
  // Fotos locales optimizadas: -800.webp en la grilla, -1600.webp en el lightbox
  const stem = src => 'img/' + src;
  masonry.innerHTML = photos.map(([src, cat, cap], k) =>
    `<figure class="ph" data-cat="${cat}" data-i="${k}"><img src="${stem(src)}-800.webp" data-full="${stem(src)}-1600.webp" alt="${cap}" loading="lazy" decoding="async"></figure>`).join('');
  $$('.ph img', masonry).forEach(img => {
    const done = () => img.classList.add('is-loaded');
    img.complete ? done() : img.addEventListener('load', done, { once: true });
  });

  const applyFilter = f => {
    $$('.filter').forEach(b => b.classList.toggle('is-active', b.dataset.filter === f));
    $$('.ph', masonry).forEach((ph, k) => {
      const show = f === 'all' || ph.dataset.cat === f;
      if (show && ph.classList.contains('is-hidden')) {
        ph.classList.remove('is-hidden'); ph.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => { ph.style.transitionDelay = (k % 6) * 40 + 'ms'; ph.classList.remove('is-entering'); }));
      } else if (!show) { ph.classList.add('is-hidden'); ph.style.transitionDelay = ''; }
    });
  };
  $$('.filter').forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  $$('[data-filter-link]').forEach(a => a.addEventListener('click', () => applyFilter(a.dataset.filterLink)));

  /* Lightbox */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let lbList = [], lbI = 0;
  const show = n => {
    lbI = (n + lbList.length) % lbList.length;
    const ph = lbList[lbI], im = $('img', ph);
    lbImg.classList.remove('is-loaded');
    setTimeout(() => {
      lbImg.src = im.dataset.full || im.src; lbImg.alt = im.alt; lbCap.textContent = im.alt;
      lbImg.decode ? lbImg.decode().then(() => lbImg.classList.add('is-loaded')).catch(() => lbImg.classList.add('is-loaded')) : lbImg.classList.add('is-loaded');
    }, 180);
  };
  const openLb = ph => {
    lbList = $$('.ph:not(.is-hidden)', masonry);
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); body.classList.add('is-locked');
    show(lbList.indexOf(ph));
  };
  const closeLb = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); body.classList.remove('is-locked'); };
  masonry.addEventListener('click', e => { const ph = e.target.closest('.ph'); if (ph) openLb(ph); });
  $('[data-lb-close]').addEventListener('click', closeLb);
  $('[data-lb-prev]').addEventListener('click', () => show(lbI - 1));
  $('[data-lb-next]').addEventListener('click', () => show(lbI + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(lbI - 1);
    if (e.key === 'ArrowRight') show(lbI + 1);
  });
  let lx = null;
  lb.addEventListener('touchstart', e => lx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (lx === null) return; const dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 40) show(lbI + (dx < 0 ? 1 : -1)); lx = null; });

  /* ---------- Buscador de propiedades ---------- */
  $$('form[data-search]').forEach(form => {
    const summary = $('[data-summary]', form);
    const fmt = n => Number(n).toLocaleString('es-CL');
    const update = () => {
      const f = form.elements, cur = f.currency.value === 'CLP' ? '$' : f.currency.value;
      const parts = [f.op.value, f.type.value || 'todas las propiedades'];
      if (f.place.value) parts.push(f.place.value);
      if (f.min.value && f.max.value) parts.push(`${cur} ${fmt(f.min.value)} a ${fmt(f.max.value)}`);
      else if (f.max.value) parts.push(`hasta ${cur} ${fmt(f.max.value)}`);
      else if (f.min.value) parts.push(`desde ${cur} ${fmt(f.min.value)}`);
      summary.parentElement.classList.remove('is-error');
      summary.textContent = parts.join(' · ');
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      if (f.min.value && f.max.value && +f.max.value < +f.min.value) {
        summary.parentElement.classList.add('is-error'); summary.textContent = 'El máximo debe ser mayor que el mínimo';
        return;
      }
      if (DEMO) return; // demo: sin conexión al catálogo
      // Versión final: abre el listado del sitio del cliente con los filtros cargados.
      // Ajusta CATALOG y los nombres de parámetros al buscador real.
      const CATALOG = 'https://www.puconpropiedades.com/es/buscar/';
      const p = new URLSearchParams({ operacion: f.op.value, tipo: f.type.value, lugar: f.place.value, moneda: f.currency.value, desde: f.min.value, hasta: f.max.value });
      location.href = `${CATALOG}?${p}`;
    });
  });

  /* ---------- Reseñas en vivo desde Google (Places API) ----------
     Para activarlas al publicar: crear una API key de Google Places (New),
     restringida al dominio puconpropiedades.com, y completar estos dos datos.
     Google entrega hasta 5 reseñas recientes, con autor y atribución. */
  const GOOGLE = { key: '', placeId: '' };
  const live = $('#reviews-live');
  if (live && GOOGLE.key && GOOGLE.placeId) {
    const loadReviews = async () => {
      try {
        const r = await fetch(`https://places.googleapis.com/v1/places/${GOOGLE.placeId}?languageCode=es`, {
          headers: { 'X-Goog-Api-Key': GOOGLE.key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' }
        });
        if (!r.ok) return;
        const d = await r.json();
        if (d.rating) $('[data-g-rating]').textContent = d.rating.toLocaleString('es-CL', { minimumFractionDigits: 1 });
        if (d.userRatingCount) $('[data-g-count]').textContent = d.userRatingCount;
        const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const items = (d.reviews || []).filter(v => v.rating >= 4 && v.text?.text).slice(0, 3);
        if (!items.length) return;
        live.innerHTML = items.map(v => `
          <article class="rcard">
            <div class="rcard__head">
              ${v.authorAttribution?.photoUri ? `<img src="${esc(v.authorAttribution.photoUri)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
              <div><p class="rcard__name"><a href="${esc(v.authorAttribution?.uri)}" target="_blank" rel="noopener">${esc(v.authorAttribution?.displayName)}</a></p>
              <p class="rcard__when">${esc(v.relativePublishTimeDescription)} · Google</p></div>
            </div>
            <span class="stars stars--sm" aria-label="${v.rating} de 5 estrellas"><span style="--r:${v.rating}"></span></span>
            <p class="rcard__text">${esc(v.text.text)}</p>
          </article>`).join('');
        live.hidden = false;
      } catch (_) { /* sin conexión: se mantiene la nota estática */ }
    };
    // se piden sólo cuando el visitante se acerca a la sección
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { o.disconnect(); loadReviews(); } }, { rootMargin: '400px' }).observe(live.parentElement);
  }

  /* ---------- Mapa bajo demanda ---------- */
  const mapBtn = $('[data-map]');
  mapBtn?.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=Pucon+Propiedades,+Av.+Bernardo+O%27Higgins+774,+Puc%C3%B3n&output=embed';
    f.loading = 'lazy'; f.title = 'Mapa Pucón Propiedades'; f.referrerPolicy = 'no-referrer-when-downgrade';
    mapBtn.replaceWith(f);
  });
})();
