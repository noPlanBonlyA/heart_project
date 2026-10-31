import './fonts';
import './style.css';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── hero: a slow heartbeat (lub-dub) of warm light with ripples ───────────────
function pulse(canvas: HTMLCanvasElement) {
  const g = canvas.getContext('2d');
  if (!g) return;
  let w = 0;
  let h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const BEAT = 1.25; // seconds per heartbeat (~48 bpm, calm)
  // two bumps per beat: "lub" then a softer "dub"
  const beat = (t: number) => {
    const p = (t % BEAT) / BEAT;
    const bump = (c: number, wdt: number) => Math.exp(-(((p - c) / wdt) ** 2));
    return bump(0.08, 0.05) + 0.6 * bump(0.28, 0.06);
  };

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const draw = (now: number) => {
    const t = now / 1000;
    const cx = w / 2;
    const cy = h * 0.48;
    const r = Math.max(w, h);
    const b = reduce ? 0.35 : beat(t);
    g.clearRect(0, 0, w, h);

    // core glow
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, r * (0.34 + 0.04 * b));
    core.addColorStop(0, `rgba(190, 46, 62, ${0.2 + 0.18 * b})`);
    core.addColorStop(0.45, `rgba(120, 22, 34, ${0.1 + 0.08 * b})`);
    core.addColorStop(1, 'rgba(6, 5, 5, 0)');
    g.fillStyle = core;
    g.fillRect(0, 0, w, h);

    // ripples leaving the centre on every beat
    if (!reduce) {
      for (let k = 0; k < 3; k++) {
        const age = ((t + k * BEAT) % (BEAT * 3)) / (BEAT * 3);
        const rr = r * (0.08 + 0.55 * age);
        g.beginPath();
        g.arc(cx, cy, rr, 0, Math.PI * 2);
        g.strokeStyle = `rgba(233, 216, 166, ${0.1 * (1 - age) ** 2})`;
        g.lineWidth = 1;
        g.stroke();
      }
    }
    if (!reduce && visible) requestAnimationFrame(draw);
    else if (!reduce) setTimeout(() => requestAnimationFrame(draw), 400);
  };
  requestAnimationFrame(draw);
}

// ── fade-up on scroll ────────────────────────────────────────────────────────
function reveal() {
  const els = document.querySelectorAll<HTMLElement>('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((e) => io.observe(e));
}

// ── trailer: poster first; on click load an adaptive stream (quality follows the connection) ──
function player(box: HTMLElement) {
  const btn = box.querySelector<HTMLButtonElement>('.play');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const hls = box.dataset.hls!;
    const mp4 = box.dataset.mp4!;
    const poster = btn.querySelector('img')?.getAttribute('src') ?? '';
    const v = document.createElement('video');
    v.controls = true;
    v.playsInline = true;
    v.poster = poster;
    v.setAttribute('aria-label', 'HEART trailer');
    box.replaceChildren(v);
    box.classList.add('on');
    if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = hls;
    } else {
      try {
        const { default: Hls } = await import('hls.js/light');
        if (Hls.isSupported()) {
          const h = new Hls({ startLevel: 0, capLevelToPlayerSize: true, maxBufferLength: 20 });
          h.loadSource(hls);
          h.attachMedia(v);
          h.on(Hls.Events.ERROR, (_e, d) => {
            if (d.fatal) {
              h.destroy();
              v.src = mp4;
              v.play().catch(() => {});
            }
          });
        } else v.src = mp4;
      } catch {
        v.src = mp4;
      }
    }
    v.play().catch(() => {});
    v.focus();
  });
}

// ── cards: tap toggles the glow on touch screens ─────────────────────────────
function cards() {
  document.querySelectorAll<HTMLElement>('.card').forEach((c) => {
    c.addEventListener('click', () => {
      const was = c.classList.contains('on');
      document.querySelectorAll('.card.on').forEach((o) => o.classList.remove('on'));
      if (!was) c.classList.add('on');
    });
  });
}

const canvas = document.querySelector<HTMLCanvasElement>('canvas.pulse');
if (canvas) pulse(canvas);
reveal();
document.querySelectorAll<HTMLElement>('.player').forEach(player);
cards();
