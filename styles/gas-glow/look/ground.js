// The gas-glow ground: a shop window at night, seen from the street. Behind the glass, the dark back wall of a sign workshop (a
// pegboard); in front of it, a clear panel hung on two chains from the window head, with a screw in each corner: the tubes are
// mounted on it. The window's posts frame the picture; on the sill below sits the transformer, its two high-voltage cables climbing
// to the panel, its pilot lamp lit while any tube is. Over everything, the window glass: two still reflections, and now and then the
// soft light of a passing car sliding across. The still parts are drawn once per page.
import { rng, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export const PANEL = { x0: 58, x1: 1022, y0: 238, y1: 1318 };
let cache = null;

function build(W, H, pal) {
  const key = `${W}x${H}:${pal.light}:${pal.dark}:${pal.accent}`;
  if (cache?.key === key) return cache;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rng(808);
  g.fillStyle = pal.wall; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(0, 0, W, H);
  g.fillStyle = pal.peg;                                        // the pegboard
  for (let y = 40; y < 1560; y += 44) for (let x = 30 + ((y / 44) % 2) * 22; x < W; x += 44) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
  g.strokeStyle = rgba(pal.light, 0.05); g.lineWidth = 3;      // a few tools' outlines hanging on it, out of focus
  g.save(); g.filter = 'blur(3px)';
  for (const [x, y, w, h] of [[120, 1360, 70, 150], [930, 1380, 40, 120], [210, 1420, 110, 60]]) { g.beginPath(); g.roundRect(x, y, w, h, 12); g.stroke(); }
  g.restore();
  const v = g.createRadialGradient(W / 2, 760, 200, W / 2, 760, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // chains from the window head to the panel
  for (const cx of [200, 880]) for (let y = 34, k = 0; y < PANEL.y0 - 4; y += 15, k++) {
    g.strokeStyle = pal.metal; g.lineWidth = 3.2;
    g.beginPath(); if (k % 2) g.ellipse(cx, y, 2.5, 9, 0, 0, 7); else g.ellipse(cx, y, 6.5, 9, 0, 0, 7); g.stroke();
  }
  // the clear panel: a faint sheet with lit edges and four screws
  const { x0, x1, y0, y1 } = PANEL;
  g.fillStyle = rgba(pal.light, 0.035); g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 14); g.fill();
  g.strokeStyle = rgba(pal.light, 0.16); g.lineWidth = 2; g.stroke();
  g.strokeStyle = rgba(pal.light, 0.28); g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0 + 16, y0 + 1); g.lineTo(x1 - 16, y0 + 1); g.stroke();
  for (const [sx, sy] of [[x0 + 26, y0 + 26], [x1 - 26, y0 + 26], [x0 + 26, y1 - 26], [x1 - 26, y1 - 26]]) {
    g.fillStyle = pal.metal; g.beginPath(); g.arc(sx, sy, 8, 0, 7); g.fill(); g.strokeStyle = pal.metalDark; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - 5, sy + 3); g.lineTo(sx + 5, sy - 3); g.stroke();
  }
  // the sill and the transformer, its cables up to the panel
  g.fillStyle = pal.sill; g.fillRect(0, 1640, W, H - 1640);
  g.fillStyle = rgba(pal.light, 0.12); g.fillRect(0, 1640, W, 3);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 1643, W, 24);
  const T = { x: 700, y: 1500, w: 250, h: 140 };
  for (const [ax, bx] of [[T.x + 60, 640], [T.x + 190, 960]]) {
    g.strokeStyle = pal.cable; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ax, T.y); g.bezierCurveTo(ax, T.y - 120, bx, PANEL.y1 + 150, bx, PANEL.y1 - 30); g.stroke();
    g.strokeStyle = rgba(pal.light, 0.1); g.lineWidth = 2; g.beginPath(); g.moveTo(ax - 3, T.y); g.bezierCurveTo(ax - 3, T.y - 120, bx - 3, PANEL.y1 + 150, bx - 3, PANEL.y1 - 30); g.stroke();
    g.fillStyle = pal.metal; g.beginPath(); g.roundRect(bx - 9, PANEL.y1 - 42, 18, 26, 4); g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(T.x + 10, T.y + T.h - 4, T.w, 16);
  g.fillStyle = pal.metalDark; g.beginPath(); g.roundRect(T.x, T.y, T.w, T.h, 10); g.fill();
  g.fillStyle = rgba(pal.light, 0.1); g.fillRect(T.x + 8, T.y + 3, T.w - 16, 3);
  g.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 7; k++) g.fillRect(T.x + 24, T.y + 30 + k * 13, 120, 5);
  g.fillStyle = pal.metal; g.fillRect(T.x + 168, T.y + 34, 58, 34);
  // the window posts and head
  g.fillStyle = pal.frame; g.fillRect(0, 0, 30, H); g.fillRect(W - 30, 0, 30, H); g.fillRect(0, 0, W, 26);
  g.fillStyle = pal.frameHi; g.fillRect(28, 26, 3, 1614); g.fillRect(W - 31, 26, 3, 1614); g.fillRect(28, 24, W - 56, 3);
  cache = { key, c, lamp: [T.x + 197, T.y + 104] };
  void r; return cache;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), base = build(W, H, pal);
  return {
    pal,
    // power 0..1: how much of the sign is lit (the transformer's lamp follows it)
    draw(ctx, t, o = {}) {
      const time = t + clock, power = o.power ?? 0;
      ctx.drawImage(base.c, 0, 0);
      const [lx, ly] = base.lamp, b = 0.25 + 0.75 * power * (0.93 + 0.07 * Math.sin(time * 37));
      const gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, 46); gr.addColorStop(0, rgba(pal.key.glow, 0.6 * b)); gr.addColorStop(1, rgba(pal.key.glow, 0));
      ctx.fillStyle = gr; ctx.fillRect(lx - 46, ly - 46, 92, 92);
      ctx.fillStyle = pal.key.tube; ctx.globalAlpha = 0.35 + 0.65 * b; ctx.beginPath(); ctx.arc(lx, ly, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    },
    // light thrown on the panel and the wall behind a lit text block
    spill(ctx, cx, cy, rx, ry, color, k) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgba(color, 0.16 * k)); gr.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = gr; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
    },
    // the window glass, drawn last: two still streaks and a passing car's light every few seconds
    glass(ctx, t) {
      const time = t + clock;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (const [x, w] of [[180, 90], [330, 26]]) {
        ctx.fillStyle = rgba(pal.light, 0.028); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 700, H); ctx.lineTo(x - 700, H); ctx.closePath(); ctx.fill();
      }
      const cyc = 7.5, q = ((time + 2.2) % cyc) / cyc;                   // headlights sliding across, right to left
      if (q < 0.4) {
        const x = W + 300 - (q / 0.4) * (W + 900), g = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
        g.addColorStop(0, rgba(pal.light, 0)); g.addColorStop(0.5, rgba(pal.light, 0.05)); g.addColorStop(1, rgba(pal.light, 0));
        ctx.fillStyle = g; ctx.fillRect(x - 260, 0, 520, H);
      }
      ctx.restore();
    },
  };
}
