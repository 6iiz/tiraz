// The Swiss ground: the brand's light colour as paper, the brand's dark colour as ink, and a visible six-column grid.
// Gutters and margins are a shade darker than the columns, so the grid reads as paper strips. In the first second of the reel the
// grid draws itself (lines grow along their length); after that it is still. Uses `clock`, so it does not redraw at every scene.
import { mix, span } from '/engine/kit.js';
import { E } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const G = look.tokens.grid, tone = look.tokens.tone;
  const paper = brand.colors.text, ink = brand.colors.bg;
  const gut = mix(paper, ink, tone.gutter), rule = mix(paper, ink, tone.rule);
  const colW = (W - 2 * G.margin - (G.cols - 1) * G.gutter) / G.cols;
  const cols = []; for (let i = 0; i < G.cols; i++) { const x0 = G.margin + i * (colW + G.gutter); cols.push([x0, x0 + colW]); }
  return {
    cols, colW, paper, ink,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
      const g = E(span(time, -0.2, 0.5));
      ctx.fillStyle = gut;
      ctx.fillRect(0, 0, G.margin, H * g); ctx.fillRect(W - G.margin, 0, G.margin, H * g);
      for (let i = 0; i < cols.length - 1; i++) ctx.fillRect(cols[i][1], 0, G.gutter, H * g);
      ctx.fillStyle = rule;
      for (let k = 0, y = G.baseline; y < H; k++, y += G.baseline) {
        const p = span(time, -0.4 + k * 0.02, 0.1 + k * 0.02); if (p > 0) ctx.fillRect(W - W * p, y - 1, W * p, 2);
      }
      for (const [a, b] of cols) for (const x of [a, b]) ctx.fillRect(x - 1, 0, 2, H * span(time, -0.3, 0.6));
    },
  };
}
