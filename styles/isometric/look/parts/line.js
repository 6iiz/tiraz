// A line: the statement centred above a small isometric world (a floor slab and a few blocks). The blocks extrude up one after another;
// the key word (*…*) is set in the accent, and its block, the tallest, is the accent one, tied to the words by a leader line.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, u = T.unit;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = lead ? 16 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 470);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const bottom = top + block, nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const hasKey = line.rows.some((r) => r.words.some((w) => w.key));
  // the world: a slab of 8 x 8 units and four blocks on it, drawn back to front
  const oy = Math.min(Math.max(bottom + 2.4 * u, 900), 1120), P = M.project(W / 2, oy, u);
  const blocks = [
    { x: 1, y: 1, w: 2, d: 2, h: 2.2, f: pal.neutral },
    { x: 4.6, y: 0.8, w: 2.4, d: 2, h: 1.2, f: pal.neutral },
    { x: 1, y: 4.5, w: 2.4, d: 2.4, h: 3.6, f: pal.hot, key: true },
    { x: 4.6, y: 4.4, w: 2.2, d: 2.2, h: 1.8, f: pal.neutral },
  ];
  // a long line arrives in the same short window as a short one, so an opening hook has landed by the first frame
  const nWords = nLead + line.rows.reduce((s, r) => s + r.words.length, 0), stagger = Math.min(T.dur.stagger, 0.36 / Math.max(1, nWords - 1));
  const words = (t, offset, size) => (w, i, box, c) => {
    const t0 = at + (offset + i) * stagger;
    if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, size) === false) return false;
    if (M.leave(c, span(t, d - T.dur.out, d), box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.E(span(t, d - T.dur.out - 0.05, d));
      let keyBox = null;
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, color: pal.muted, each: words(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, color: pal.text, key: pal.keyText,
        each: (w, i, box, c) => { if (w.key && !keyBox) keyBox = { ...box }; return words(t, nLead, line.size)(w, i, box, c); } });
      const slab = M.G(span(t, at, at + T.dur.build)) * (1 - out);
      if (slab <= 0) return;
      M.block(ctx, P, 0, 0, 0, 8, 8, 0.5 * slab, pal.floor);
      blocks.forEach((b, k) => {
        const g = M.G(span(t, at + 0.12 + k * 0.08, at + 0.12 + k * 0.08 + T.dur.build)) * (1 - out);
        if (g > 0) M.block(ctx, P, b.x, b.y, 0.5 * slab, b.w, b.d, b.h * g, b.f, true);
      });
      if (hasKey && keyBox) {
        const b = blocks[2], [bx, by] = P(b.x + b.w / 2, b.y + b.d / 2, 0.5 + b.h), kx = keyBox.x + keyBox.width / 2;
        const last = keyBox.row === line.rows.length - 1, ky = last ? keyBox.y + line.size * 0.72 : bottom + 20;
        const pl = span(t, at + 0.5, at + 0.85) * (1 - out);
        M.leader(ctx, [[bx, by], [bx, Math.max(by - 0.8 * u, ky + 30)], [kx, ky + 12]], pl, pal.line);
        if (last && pl > 0) { const w = keyBox.width * M.E(pl); ctx.fillStyle = pal.accent; ctx.fillRect(kx - w / 2, ky + 2, w, 5); }
      }
    },
  };
}
