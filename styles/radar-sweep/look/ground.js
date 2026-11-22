// The Radar Sweep ground: a scope in a dark room. Range rings and a bearing ring with fine ticks around one centre, faint cross lines,
// and the sweep arm turning slowly with a fading wedge behind it. A few contacts flare where the arm passes and decay until it comes
// round again. Everything here is cold (mixes of the brand's dark and light colours); the accent is kept for the target.
// `draw(ctx, t, quiet)`: quiet = [{ y0, y1 }] bands where text sits; the scope is calmed under them with a feathered dark band.
// Uses `clock`, so the arm never jumps at a cut.
import { rng, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const G = look.tokens.scope, pal = palette(brand), cx = W / 2, cy = G.cy;
  const st = document.createElement('canvas'); st.width = W; st.height = H;
  {
    const c = st.getContext('2d');
    c.fillStyle = pal.dark; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, G.rMax); g.addColorStop(0, pal.scope); g.addColorStop(1, pal.dark);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = pal.ring; c.lineWidth = 1.5;
    for (let r = G.step; r <= G.rMax; r += G.step) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(0, cy); c.lineTo(W, cy); c.moveTo(cx, 0); c.lineTo(cx, H); c.stroke();
    c.setLineDash([4, 10]); c.beginPath(); for (const a of [Math.PI / 4, -Math.PI / 4]) { c.moveTo(cx - Math.cos(a) * G.rMax, cy - Math.sin(a) * G.rMax); c.lineTo(cx + Math.cos(a) * G.rMax, cy + Math.sin(a) * G.rMax); } c.stroke(); c.setLineDash([]);
    // the bearing ring: ticks every 2 degrees, longer every 10 and 30
    c.strokeStyle = pal.ringHi; const rb = G.bearing;
    c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, rb, 0, Math.PI * 2); c.stroke();
    for (let d = 0; d < 360; d += 2) {
      const a = d * Math.PI / 180, L = d % 30 === 0 ? 26 : d % 10 === 0 ? 15 : 7;
      c.lineWidth = d % 30 === 0 ? 3 : 1.5; c.beginPath(); c.moveTo(cx + Math.cos(a) * rb, cy + Math.sin(a) * rb); c.lineTo(cx + Math.cos(a) * (rb + L), cy + Math.sin(a) * (rb + L)); c.stroke();
    }
    c.fillStyle = pal.ringHi; c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.fill();
  }
  const r = rng(G.seed);
  const contacts = Array.from({ length: 9 }, () => ({ a: r() * Math.PI * 2, d: G.step * 1.2 + r() * (G.rMax - G.step * 1.4), s: 4 + r() * 5 }));
  const period = G.period, TAU = Math.PI * 2;
  const angle = (time) => (time / period) * TAU - Math.PI / 2;
  return {
    pal, cx, cy, angle: (t) => angle(t + clock),
    draw(ctx, t, quiet = []) {
      const time = t + clock, a = angle(time);
      ctx.drawImage(st, 0, 0);
      // the wedge behind the arm
      const cg = ctx.createConicGradient(a - G.trail, cx, cy);
      cg.addColorStop(0, rgba(pal.light, 0)); cg.addColorStop(G.trail / TAU, rgba(pal.light, 0.12)); cg.addColorStop(G.trail / TAU + 0.0001, rgba(pal.light, 0)); cg.addColorStop(1, rgba(pal.light, 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, G.rMax, 0, TAU); ctx.fill();
      ctx.save(); ctx.strokeStyle = pal.ringHi; ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * G.rMax, cy + Math.sin(a) * G.rMax); ctx.stroke(); ctx.restore();
      // contacts: brightest just after the arm passes, then decaying
      for (const k of contacts) {
        const since = (((a - k.a) % TAU) + TAU) % TAU / TAU * period, v = Math.exp(-since / 1.6);
        if (v < 0.03) continue;
        ctx.save(); ctx.globalAlpha = v; ctx.fillStyle = pal.echo; ctx.shadowColor = pal.light; ctx.shadowBlur = 14 * v;
        ctx.beginPath(); ctx.arc(cx + Math.cos(k.a) * k.d, cy + Math.sin(k.a) * k.d, k.s, 0, TAU); ctx.fill(); ctx.restore();
      }
      // calm the scope where text sits: a dark band with feathered edges, no box
      for (const q of quiet) {
        const f = 70, g = ctx.createLinearGradient(0, q.y0 - f, 0, q.y1 + f), h = q.y1 - q.y0 + 2 * f, a0 = q.a ?? 0.82;
        g.addColorStop(0, rgba(pal.dark, 0)); g.addColorStop(f / h, rgba(pal.dark, a0)); g.addColorStop(1 - f / h, rgba(pal.dark, a0)); g.addColorStop(1, rgba(pal.dark, 0));
        ctx.fillStyle = g; ctx.fillRect(0, q.y0 - f, W, h);
      }
    },
  };
}
