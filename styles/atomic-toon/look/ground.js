// The atomic-toon ground: a room made of colour planes. One wall colour per scene (`room` picks it), a darker floor band, a horizon line
// broken by gaps, and a few props printed off register on the floor and high on the wall: a kidney rug, a boomerang table, a lamp
// on a thin stem, atomic sparkles. All of it lies outside the safe area, so the words always sit on the plain wall.
// The props' fills and lines re-settle on twos (the shimmer), so the room is never still.
import { mix, rgba } from '/engine/kit.js';
import { palette, grain, cel, circle, kidney, boomerang, sparkle } from './motion.js';

export function create({ W, H, brand, look, clock = 0, room = 0 }) {
  const P = palette(brand), g = grain(W, H, P), rtl = brand.dir !== 'ltr';
  const wall = P.walls[room % P.walls.length], floor = mix(wall, P.ink, 0.13), hz = 1340;
  const side = (x) => (rtl ? W - x : x);                                // props mirror with the reading direction
  const rug = kidney(side(600), hz + 250, 700, 120, 7 + room);
  const top = kidney(side(560), hz + 40, 420, 74, 21 + room);           // a kidney coffee table on three thin legs
  const legs = new Path2D(); for (const dx of [-150, 10, 150]) { legs.moveTo(side(560 + dx), hz + 60); legs.lineTo(side(560 + dx * 1.15), hz + 170); }
  const lampStem = new Path2D(); lampStem.moveTo(side(150), hz + 190); lampStem.lineTo(side(150), hz - 40); lampStem.moveTo(side(150), hz + 190); lampStem.lineTo(side(110), hz + 215); lampStem.moveTo(side(150), hz + 190); lampStem.lineTo(side(190), hz + 215);
  const lampShade = new Path2D(); lampShade.moveTo(side(95), hz - 30); lampShade.lineTo(side(205), hz - 30); lampShade.lineTo(side(180), hz - 100); lampShade.lineTo(side(120), hz - 100); lampShade.closePath();
  const bulb = circle(side(150), hz - 22, 16);
  const boom = boomerang(side(900), 120, 90, rtl ? 150 : 30);                // a boomerang hung high on the wall, above the safe area
  const plane = mix(wall, P.paper, 0.5), px = rtl ? 0 : W - 400;
  const stars = [[150, 150, 34], [930, 205, 22], [620, 110, 16], [330, 230, 14]].map(([x, y, r], i) => ({ p: sparkle(side(x), y, r), i }));
  const dots = []; for (let i = 0; i < 9; i++) dots.push(circle(side(90 + i * 110), hz + 400 + (i % 2) * 40, 12));
  return {
    P, wall, rtl,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = plane; ctx.fillRect(px, 0, 400, hz);           // a second colour plane: a wall panel on the far side
      ctx.fillStyle = floor; ctx.fillRect(0, hz, W, H - hz);
      // the horizon, with gaps
      const hl = new Path2D(); hl.moveTo(0, hz); hl.lineTo(W, hz);
      cel(ctx, hl, { line: P.ink, width: 5, id: 11, t: time, gaps: 0.25 });
      cel(ctx, rug, { fill: P.tint, line: P.ink, width: 4, id: 12, t: time });
      for (const d of dots) cel(ctx, d, { fill: rgba(P.paper, 0.6), id: 13, t: time });
      cel(ctx, boom, { fill: P.soft, line: P.ink, width: 3, id: 18, t: time });
      cel(ctx, legs, { line: P.ink, width: 5, id: 19, t: time, gaps: 0.05 });
      cel(ctx, top, { fill: P.accent, line: P.ink, width: 4, id: 14, t: time });
      cel(ctx, lampStem, { line: P.ink, width: 5, id: 15, t: time, gaps: 0.05 });
      cel(ctx, bulb, { fill: P.paper, id: 16, t: time });
      cel(ctx, lampShade, { fill: P.tint, line: P.ink, width: 4, id: 17, t: time });
      for (const s of stars) cel(ctx, s.p, { fill: s.i % 2 ? P.accent : P.paper, line: P.ink, width: 3, id: 20 + s.i, t: time, gaps: 0.1 });
      ctx.drawImage(g, 0, 0);
    },
  };
}
