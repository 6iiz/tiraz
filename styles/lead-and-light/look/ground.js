// The lead-and-light ground: a dark stone wall with a tall round-headed window cut into it, seen from inside. The window is glazed in
// diamond quarries of the brand's tints, held by lead and crossed by iron bars, with a border of small pieces round its edge. The
// stone floor underneath picks up a faint tinted copy of the window. Unlit glass is dark and cloudy, and glows
// only where a slow band of sun moves behind it; the copy on the floor brightens with it. Everything is built once; a frame lays the
// dark window, then the lit window through a moving soft mask.
import { rgba, rng, mix, clamp } from '/engine/kit.js';
import { palette, glass } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), r = rng(2207);
  const wx = 92, ww = W - 184, top = 110, spring = top + ww / 2, foot = 1290, floor = 1330;
  const arch = (c, k = 0, fresh = true) => { if (fresh) c.beginPath(); c.moveTo(wx + k, foot - k); c.lineTo(wx + k, spring); c.arc(W / 2, spring, ww / 2 - k, Math.PI, 0); c.lineTo(wx + ww - k, foot - k); c.closePath(); };
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  // the pieces, once: diamonds in a lattice and a border of small oblongs
  const S = T.quarry, pieces = [];
  for (let j = -1; j * S / 2 < foot + S; j++) for (let i = -1; i * S < W + S; i++) {
    const x = i * S + (j % 2 ? S / 2 : 0), y = top + j * S / 2, u = r();
    const c = u < 0.12 ? pal.tints[0] : u < 0.24 ? pal.tints[2] : u < 0.5 ? pal.tints[1] : u < 0.75 ? pal.tints[3] : pal.tints[4];
    pieces.push({ x, y, c, streak: r() * Math.PI, shade: (r() - 0.5) * 0.12 });
  }
  const paintWindow = (g, lit) => {
    g.save(); arch(g, 26); g.clip();
    for (const p of pieces) {
      g.fillStyle = mix(glass(pal, p.c, lit), p.shade > 0 ? pal.light : pal.dark, Math.abs(p.shade));
      g.beginPath(); g.moveTo(p.x, p.y - S / 2); g.lineTo(p.x + S / 2, p.y); g.lineTo(p.x, p.y + S / 2); g.lineTo(p.x - S / 2, p.y); g.closePath(); g.fill();
      g.save(); g.clip(); g.strokeStyle = rgba(pal.dark, 0.1); g.lineWidth = 2;                       // streaks in the glass
      for (let k = -3; k <= 3; k++) { const a = p.streak; g.beginPath(); g.moveTo(p.x + Math.cos(a) * -S + k * 9 * Math.sin(a), p.y + Math.sin(a) * -S - k * 9 * Math.cos(a)); g.lineTo(p.x + Math.cos(a) * S + k * 9 * Math.sin(a), p.y + Math.sin(a) * S - k * 9 * Math.cos(a)); g.stroke(); }
      g.restore();
    }
    g.strokeStyle = pal.lead; g.lineWidth = 7; g.beginPath();                                          // the lead network
    for (let k = S / 2 - Math.ceil(H / S + 2) * S; k < W + H; k += S) { g.moveTo(k, top - S); g.lineTo(k + H, top - S + H); g.moveTo(k, top - S); g.lineTo(k - H, top - S + H); }
    g.stroke();
    g.restore();
    // the border of small pieces between the glass and the stone
    g.save(); arch(g, 0); arch(g, 26, false); g.clip('evenodd');
    const n = 64; for (let i = 0; i < n; i++) { g.fillStyle = glass(pal, pal.tints[i % 2 ? 0 : 4], lit); g.beginPath(); g.moveTo(W / 2, spring + 400); const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI; g.arc(W / 2, spring, ww, a0, a1); g.closePath(); g.fill(); }
    for (let y = spring; y < foot; y += 46) { const k = Math.round((y - spring) / 46) % 2; g.fillStyle = glass(pal, pal.tints[k ? 0 : 4], lit); g.fillRect(wx, y, 26, 46); g.fillRect(wx + ww - 26, y, 26, 46); }
    g.restore();
    g.strokeStyle = pal.lead; g.lineWidth = 6; arch(g, 26); g.stroke(); arch(g, 0); g.stroke();
    g.fillStyle = pal.lead; for (let y = spring - 120; y < foot; y += 250) g.fillRect(wx, y - 5, ww, 10);  // iron saddle bars
  };
  const [dim, d] = mk(); const [lit, l] = mk();
  // the wall and the floor, under the dark window
  d.fillStyle = pal.stone; d.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < floor; y += 92, row++) for (let x = row % 2 ? -80 : 0; x < W; x += 160) {
    d.fillStyle = mix(pal.stone, pal.stoneHi, r()); d.fillRect(x + 3, y + 3, 154, 86);
  }
  d.fillStyle = mix(pal.stone, pal.dark, 0.3); d.fillRect(0, floor, W, H - floor);
  for (let y = floor, k = 0; y < H; k++, y += 40 + k * 14) { d.fillStyle = rgba(pal.dark, 0.5); d.fillRect(0, y, W, 3); }
  d.save(); arch(d, -30); d.fillStyle = mix(pal.stone, pal.light, 0.06); d.fill(); d.restore();          // the splayed embrasure
  d.fillStyle = rgba(pal.dark, 0.5); d.fillRect(wx - 40, foot, ww + 80, 40);                               // the sill
  paintWindow(d, 0); paintWindow(l, 1);
  // the coloured copy on the floor, blurred once
  const [patch, pg] = mk();
  pg.filter = 'blur(22px)'; pg.globalAlpha = 0.55;
  pg.drawImage(lit, wx, spring - 100, ww, foot - spring + 100, wx - 60, floor + 30, ww + 120, H - floor - 60);
  pg.filter = 'none';
  const [tmp, tg] = mk();
  return {
    pal, window: { wx, ww, top, spring, foot },
    draw(ctx, t) {
      const time = t + clock, k = (((time / T.sunPeriod) % 1) + 1) % 1, pos = -500 + k * (W + 1000);
      ctx.drawImage(dim, 0, 0);
      ctx.save(); ctx.globalAlpha = T.tone.base; ctx.drawImage(lit, 0, 0); ctx.restore();
      tg.globalCompositeOperation = 'copy'; tg.drawImage(lit, 0, 0);
      tg.globalCompositeOperation = 'destination-in';
      const gr = tg.createLinearGradient(pos - 360, 0, pos + 360, 300);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      tg.fillStyle = gr; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, 0, 0);
      const s = clamp(1 - Math.abs(pos - W / 2) / (W * 0.9));
      ctx.save(); ctx.globalAlpha = 0.35 + 0.5 * s; ctx.drawImage(patch, 0, 0); ctx.restore();
    },
  };
}
