// The beat-arena set: the brand's accent as a saturated stage colour, with a pattern one step off it (each part has its own set:
// diagonal stripes for a line, a turning sunburst for a number, polka dots for a list, a split stage for a comparison). A darker
// floor band below the safe area carries two toy contestants who keep the tempo: the caller hops on beats 1 and 2 of every bar, the
// answerer on beats 3 and 4 (call and response). `cheer` makes both jump together with arms up (the ending).
// Time is the reel's (t + clock), so the beat never restarts at a cut. Pattern canvases are built once.
import { mix } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0, set = 'stripes' }) {
  const T = look.tokens, pal = palette(brand, T), FY = T.floor, beat = T.beat;
  const dots = document.createElement('canvas'); dots.width = W; dots.height = H + 240;
  { const g = dots.getContext('2d'); g.fillStyle = pal.stripe;
    for (let r = 0, y = 0; y < dots.height + 60; r++, y += 120) for (let x = (r % 2) * 60 - 60; x < W + 60; x += 120) { g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.fill(); } }

  const stripes = (ctx, time, y0 = 0, y1 = H, col = pal.stripe) => {
    const P = 150, off = (time * 36) % (P * 2);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0); ctx.clip(); ctx.fillStyle = col; ctx.beginPath();
    for (let x = -H - P * 2 + off; x < W + P; x += P * 2) { ctx.moveTo(x, H); ctx.lineTo(x + P, H); ctx.lineTo(x + P + H, 0); ctx.lineTo(x + H, 0); ctx.closePath(); }
    ctx.fill(); ctx.restore();
  };
  const sunburst = (ctx, time, cx, cy) => {
    const n = 22, R = 2400, turn = time * 0.12 * (brand.dir === 'ltr' ? 1 : -1);
    ctx.fillStyle = pal.stripe; ctx.beginPath();
    for (let i = 0; i < n; i += 2) { const a0 = (i / n) * Math.PI * 2 + turn, a1 = ((i + 1) / n) * Math.PI * 2 + turn; ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); }
    ctx.fill();
  };

  // A little player: bean-shaped body, mitt arms, oval eyes with one white dot, a mouth that opens when it hops.
  const bean = (ctx, x, time, body, patch, phase, cheer) => {
    const b = time / beat, i = Math.floor(b), u = b - i, mine = cheer || ((((i % 4) + 4) % 4) >> 1) === phase;
    const hop = mine ? Math.sin(Math.PI * Math.min(1, u / 0.62)) * (cheer ? 90 : 62) : 0;
    const sq = mine && u > 0.62 ? Math.max(0, 1 - (u - 0.62) / 0.22) * 0.14 : 0;       // squash on landing
    const w = 136 * (1 + sq), h = 172 * (1 - sq), y = FY - 6 - hop;
    ctx.save();
    ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.ellipse(x + 8, FY + 10, 74 - hop * 0.25, 13, 0, 0, Math.PI * 2); ctx.fill();   // floor shadow
    const up = mine && hop > 8;
    ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = pal.ink;
    for (const s of [-1, 1]) {                                                                         // arms: ink stroke then body colour
      const ax = x + s * w * 0.46, ay = y - h * 0.48, hx = ax + s * (up ? 34 : 30), hy = up ? ay - 74 : ay + 46;
      ctx.lineWidth = 30; ctx.strokeStyle = pal.ink; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.lineWidth = 15; ctx.strokeStyle = body; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
    }
    ctx.fillStyle = body; ctx.strokeStyle = pal.ink; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, [w * 0.5, w * 0.5, w * 0.3, w * 0.3]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = patch; ctx.beginPath(); ctx.ellipse(x, y - h * 0.2, w * 0.22, h * 0.11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const ey = y - h * 0.7;
    for (const s of [-1, 1]) {
      ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.ellipse(x + s * 24, ey, 11, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.paper; ctx.beginPath(); ctx.arc(x + s * 24 + 3, ey - 6, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = pal.ink; ctx.beginPath();
    if (mine && hop > 4) ctx.ellipse(x, ey + 36, 15, 12, 0, 0, Math.PI * 2); else ctx.ellipse(x, ey + 34, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // one head piece each: an antenna ball for the caller, two round ears for the answerer
    ctx.lineWidth = 8; ctx.strokeStyle = pal.ink;
    if (phase === 0) { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + 6, y - h - 38); ctx.stroke(); ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(x + 6, y - h - 46, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else for (const s of [-1, 1]) { ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x + s * 40, y - h + 10, 20, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  };

  const rtl = brand.dir !== 'ltr';
  return {
    pal,
    draw(ctx, t, { cheer = false } = {}) {
      const time = t + clock;
      ctx.fillStyle = pal.accent; ctx.fillRect(0, 0, W, H);
      if (set === 'burst') sunburst(ctx, time, W / 2, 660);
      else if (set === 'dots') ctx.drawImage(dots, 0, -((time * 30) % 240));
      else if (set === 'split') {                                   // two stages: the upper one striped, the lower one a step darker
        stripes(ctx, time, 0, 760);
        ctx.fillStyle = mix(pal.accent, pal.ink, 0.16); ctx.fillRect(0, 760, W, H - 760);
        ctx.fillStyle = pal.ink; ctx.fillRect(0, 756, W, 8);
      } else stripes(ctx, time);
      ctx.fillStyle = pal.floor; ctx.fillRect(0, FY, W, H - FY);
      ctx.fillStyle = pal.ink; ctx.fillRect(0, FY - 4, W, 8);
      bean(ctx, rtl ? W - 250 : 250, time, pal.paper, pal.accent, 0, cheer);
      bean(ctx, rtl ? 250 : W - 250, time, pal.answer, pal.paper, 1, cheer);
    },
  };
}
