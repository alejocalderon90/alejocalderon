'use strict';
(() => {
  const field = document.querySelector('.motion-field');
  if (!field) return;
  const pieces = [...field.querySelectorAll('.motion-piece')];
  const choices = [...document.querySelectorAll('[data-motion]')];
  const pause = document.getElementById('motionPause');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const modes = {
    datos: { title: 'DATOS QUE SE ENTIENDEN', text: 'De fuentes dispersas a una lectura clara del negocio.', interest: 'BI y dashboards', label: 'Piezas que se ordenan en un gráfico de barras.' },
    procesos: { title: 'PROCESOS QUE SE CONECTAN', text: 'De tareas aisladas a un flujo que avanza por sí solo.', interest: 'Automatización e IA', label: 'Piezas que forman tres circuitos conectados.' },
    web: { title: 'IDEAS QUE TOMAN FORMA', text: 'De una idea a una interfaz que invita a interactuar.', interest: 'Desarrollo web', label: 'Piezas que construyen la estructura de una interfaz web.' }
  };
  let mode = 'datos';
  let timeline;
  let userPaused = false;
  let motionEnabled = false;
  let visible = true;
  const position = (index, shape) => {
    const width = Math.min(field.clientWidth * .76, 420);
    const height = Math.min(field.clientHeight * .66, 240);
    const col = index % 8;
    const row = Math.floor(index / 8);
    if (shape === 'scatter') {
      return { x: (Math.sin(index * 127.1 + 3) * .47) * width, y: (Math.cos(index * 311.7) * .46) * height, rotate: (index % 7 - 3) * 30, scale: .7 + (index % 4) * .15 };
    }
    if (shape === 'grid') return { x: (col - 3.5) * width / 11, y: (row - 3.5) * height / 10, rotate: 0, scale: 1 };
    if (shape === 'datos') {
      const spacing = height / 12;
      return { x: (col - 3.5) * width / 9, y: height * .4 - row * spacing * (.4 + col * .13), rotate: 0, scale: 1.2 };
    }
    if (shape === 'procesos') {
      const group = index % 3;
      const angle = Math.floor(index / 3) / 22 * Math.PI * 2;
      return { x: (group - 1) * width * .3 + Math.cos(angle) * width * .13, y: Math.sin(angle) * height * .29, rotate: angle * 180 / Math.PI, scale: .9 };
    }
    return { x: (col - 3.5) * width / 9, y: (row - 3.5) * height / 9, rotate: 0, scale: row === 0 || col === 0 || row === 7 ? 1.35 : .7 };
  };
  const sync = () => {
    if (!timeline) return;
    if (userPaused || (reduced.matches && !motionEnabled) || !visible || document.hidden) timeline.pause();
    else timeline.resume();
  };
  const parameters = (shape, duration) => ({
    x: (_, i) => position(i, shape).x,
    y: (_, i) => position(i, shape).y,
    rotate: (_, i) => position(i, shape).rotate,
    scale: (_, i) => position(i, shape).scale,
    duration, delay: window.anime.stagger(12, { from: 'center' }), ease: 'inOutExpo'
  });
  const build = () => {
    timeline?.revert();
    timeline = undefined;
    field.classList.add('motion-ready');
    pieces.forEach((piece, i) => {
      const point = position(i, mode);
      piece.style.transform = `translateX(${point.x}px) translateY(${point.y}px) rotate(${point.rotate}deg) scale(${point.scale})`;
    });
    pause.hidden = !window.anime?.createTimeline;
    if (pause.hidden) return;
    if (reduced.matches && !motionEnabled) {
      pause.textContent = 'Activar movimiento ▶';
      return;
    }
    timeline = window.anime.createTimeline({ autoplay: false, loop: true });
    timeline
      .add(pieces, parameters('scatter', 1400), 0)
      .add(pieces, parameters('grid', 1600), 2400)
      .add(pieces, parameters(mode, 1800), 5200)
      .add({ duration: 1800 }, 7700);
    sync();
  };
  choices.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.motion;
    choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    document.getElementById('motionMode').textContent = modes[mode].title;
    document.getElementById('motionDescription').textContent = modes[mode].text;
    document.getElementById('motionContact').dataset.interest = modes[mode].interest;
    field.setAttribute('aria-label', modes[mode].label);
    build();
  }));
  pause.addEventListener('click', () => {
    if (reduced.matches && !motionEnabled) {
      motionEnabled = true;
      userPaused = false;
      pause.setAttribute('aria-pressed', 'false');
      pause.textContent = 'Pausar Ⅱ';
      build();
      return;
    }
    userPaused = !userPaused;
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.textContent = userPaused ? 'Reanudar ▶' : 'Pausar Ⅱ';
    sync();
  });
  reduced.addEventListener('change', () => {
    motionEnabled = false;
    userPaused = false;
    pause.setAttribute('aria-pressed', 'false');
    pause.textContent = 'Pausar Ⅱ';
    build();
  });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: .08 }).observe(field);
  }
  let width = field.clientWidth;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (field.clientWidth === width) return;
      width = field.clientWidth;
      build();
    }).observe(field);
  }
  build();
})();
