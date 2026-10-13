'use strict';
(() => {
  const email = 'santiago_alejo_calderon@hotmail.com';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const projects = JSON.parse(document.getElementById('projectData').textContent);
  const dialog = document.getElementById('projectDialog');
  const animate = (targets, options) => {
    if (reduceMotion.matches) return;
    if (window.anime?.animate) {
      window.anime.animate(targets, options);
      return;
    }
    const nodes = typeof targets === 'string' ? document.querySelectorAll(targets) : targets instanceof Element ? [targets] : targets;
    Array.from(nodes).forEach((node, index) => node.animate(
      [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: options.duration || 650, delay: index * 65, easing: 'cubic-bezier(.2,.7,.2,1)' }
    ));
  };
  document.getElementById('year').textContent = new Date().getFullYear();
  const closeMenu = () => {
    nav.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('menu-open')) { closeMenu(); toggle.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  let scrollPending = false;
  const updateScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    const total = document.documentElement.scrollHeight - window.innerHeight;
    document.querySelector('.scroll-progress').style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
    scrollPending = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  animate('.hero-line', { y: [28, 0], opacity: [0, 1], duration: 950, delay: window.anime?.stagger ? window.anime.stagger(100) : 0, ease: 'outExpo' });
  animate('.system-art', { y: [25, 0], opacity: [0, 1], duration: 1100, ease: 'outExpo' });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target, { y: [24, 0], opacity: [0, 1], duration: 750, ease: 'outExpo' });
      const bars = entry.target.querySelectorAll('.bars i');
      if (bars.length && !reduceMotion.matches && window.anime?.animate) {
        window.anime.animate(bars, { scaleY: [.1, 1], duration: 900, delay: window.anime.stagger(55), ease: 'outExpo' });
      }
      observer.unobserve(entry.target);
    }), { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('.project').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    document.getElementById('filterStatus').textContent = `${count} proyectos`;
    animate(document.querySelectorAll('.project:not([hidden])'), { y: [18, 0], opacity: [0, 1], duration: 450, delay: window.anime?.stagger ? window.anime.stagger(60) : 0, ease: 'outQuad' });
    updateScroll();
  }));
  let opener;
  const createLink = (label, href, primary = false) => {
    const link = document.createElement('a');
    link.textContent = `${label} ↗`;
    link.href = href;
    link.className = primary ? 'button primary' : 'text-link';
    if (href.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    return link;
  };
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects.find(item => item.id === button.dataset.project);
    if (!project) return;
    opener = button;
    const visual = document.getElementById('dialogVisual');
    const preview = button.closest('.project').querySelector('.project-visual');
    const fallback = preview.querySelector('.video-fallback').cloneNode(true);
    visual.replaceChildren(fallback);
    document.getElementById('dialogTitle').textContent = project.title;
    document.getElementById('dialogKind').textContent = project.kind;
    document.getElementById('dialogText').textContent = project.text;
    document.getElementById('dialogNote').textContent = project.note;
    document.getElementById('dialogStack').replaceChildren(...project.stack.map(item => {
      const li = document.createElement('li'); li.textContent = item; return li;
    }));
    const actions = document.getElementById('dialogActions');
    actions.replaceChildren(...project.links.map(([label, href]) => createLink(label, href, true)));
    const contactLink = createLink('Quiero algo así', '#contacto', !project.links.length);
    contactLink.addEventListener('click', () => {
      document.getElementById('leadService').value = project.category === 'web' ? 'Sitio web o solución digital' : project.category === 'datos' ? 'Reportes / Power BI / Excel' : 'Automatización de procesos';
      dialog.close();
    });
    actions.append(contactLink);
    document.querySelectorAll('.video-preview video').forEach(video => video.pause());
    dialog.showModal();
    document.body.classList.add('no-scroll');
    if (project.video) {
      const video = document.createElement('video');
      video.controls = true; video.preload = 'metadata'; video.playsInline = true;
      video.setAttribute('aria-label', `Grabación de ${project.title}`);
      video.addEventListener('loadedmetadata', () => {
        if (!dialog.open || document.getElementById('dialogTitle').textContent !== project.title) return;
        visual.replaceChildren(video);
      }, { once: true });
      video.addEventListener('error', () => video.remove(), { once: true });
      video.src = `videos/${encodeURIComponent(project.video)}`;
    }
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.querySelector('video')?.pause();
    document.body.classList.remove('no-scroll');
    opener?.focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => {
    document.getElementById('leadService').value = { 'BI y dashboards': 'Reportes / Power BI / Excel', 'Automatización e IA': 'Automatización de procesos', 'Desarrollo web': 'Sitio web o solución digital' }[link.dataset.interest];
  }));
  document.getElementById('copyEmail').addEventListener('click', async () => {
    const status = document.getElementById('copyStatus');
    try { await navigator.clipboard.writeText(email); status.textContent = 'Email copiado.'; }
    catch { status.textContent = `Podés copiarlo manualmente: ${email}`; }
  });
  const form = document.getElementById('leadForm');
  const submit = document.getElementById('leadSubmit');
  const status = document.getElementById('formMessage');
  let sending = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending || !form.reportValidity() || form.elements.website.value.trim()) return;
    const data = new FormData(form);
    const payload = Object.fromEntries(['nombre', 'email', 'telefono', 'servicio', 'mensaje'].map(key => [key, String(data.get(key) || '').trim()]));
    Object.assign(payload, { origen: 'Web Alejo Calderón', pagina: window.location.href, fechaEnvio: new Date().toISOString() });
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    status.textContent = '';
    try {
      const response = await fetch(form.dataset.webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('Lead submission failed');
      document.getElementById('successCard').hidden = false;
      submit.hidden = true;
      status.textContent = 'Consulta enviada correctamente.';
    } catch {
      status.textContent = 'No pudimos confirmar el envío. Escribime por WhatsApp o email para continuar.';
    } finally {
      sending = false;
      submit.disabled = false;
      submit.textContent = 'Enviar consulta';
    }
  });
  document.getElementById('newMessageBtn').addEventListener('click', () => {
    form.reset();
    document.getElementById('successCard').hidden = true;
    submit.hidden = false;
    status.textContent = '';
    document.getElementById('leadName').focus();
  });
  const previews = [...document.querySelectorAll('.video-preview video')];
  const setPlayback = (video, playing) => {
    const control = video.closest('.project-visual').querySelector('.preview-motion');
    control.setAttribute('aria-pressed', String(playing));
    control.textContent = playing ? 'Ⅱ' : '▶';
    control.setAttribute('aria-label', `${playing ? 'Pausar' : 'Reproducir'} vista previa`);
  };
  previews.forEach(video => {
    const container = video.closest('.project-visual');
    video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(.1, video.duration || .1); }, { once: true });
    video.addEventListener('loadeddata', () => container.classList.add('has-video'));
    video.addEventListener('error', () => {
      container.classList.remove('has-video');
      container.querySelector('.preview-motion').hidden = true;
    });
    video.addEventListener('play', () => setPlayback(video, true));
    video.addEventListener('pause', () => setPlayback(video, false));
    container.querySelector('.preview-motion').addEventListener('click', async () => {
      if (!video.src) { video.src = video.dataset.src; video.load(); }
      if (!video.paused) { video.pause(); return; }
      previews.forEach(other => { if (other !== video) other.pause(); });
      try { await video.play(); } catch { setPlayback(video, false); }
    });
  });
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && !video.src) {
        video.preload = 'metadata'; video.src = video.dataset.src; video.load();
      }
      if (!entry.isIntersecting) video.pause();
    }), { rootMargin: '150px 0px' });
    previews.forEach(video => videoObserver.observe(video));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) previews.forEach(video => video.pause());
  });
})();
