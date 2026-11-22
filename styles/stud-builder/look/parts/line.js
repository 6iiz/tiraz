// A line built as a little wall on the desk. The lead-in is printed on smooth flat tiles; the statement on bricks whose rows stack
// stud to stud. Each row is cut into bricks at its key phrase: the key phrase (*…*, one word or several) is one brick of the accent,
// the plain words around it bricks of the brand's text colour. Every piece is set down by hand in four held poses, one after another
// in reading order, and taken away the same way at the end. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 50, x1 = SAFE.right - 50, maxW = x1 - x0;
  const line = M.widen(M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - T.size.line * 0.6, minScale: 0.6 }), T.size.line * 0.3, maxW);
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 72 : 0, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height : 0) + gap + line.lead / 2;
  // the pieces
  const pieces = [];
  if (lead) M.layout(lead, x0, x1, yLead, rtl).reduce((rows, b) => { (rows[b.row] ||= []).push(b); return rows; }, []).forEach((row, r) => {
    const l = Math.min(...row.map((b) => b.x)) - 26, rr = Math.max(...row.map((b) => b.x + b.width)) + 26, y = yLead + r * lead.lead;
    pieces.push({ kind: 'lead', row: r, l, r: rr, y0: y - lead.lead * 0.44, h: lead.lead * 0.88, words: row.map((b) => b.i), pc: M.piece(P, rr - l, lead.lead * 0.88, P.tile, { studs: false, deep: 16 }) });
  });
  const segs = M.bricks(line, M.layout(line, x0, x1, yLine, rtl), line.size * 0.36);
  for (const s of segs) pieces.push({ kind: 'line', row: s.row, l: s.l, r: s.r, y0: s.y - line.lead / 2, h: line.lead, words: s.words, key: s.key,
    pc: M.piece(P, s.r - s.l, line.lead, s.key ? P.accent : P.brick) });
  // reading order for the set-down; drawing order: lead first, then line rows from the bottom up, left to right
  const order = pieces.slice().sort((a, b) => (a.kind !== b.kind ? (a.kind === 'lead' ? -1 : 1) : a.row - b.row || (rtl ? b.l - a.l : a.l - b.l)));
  const n = order.length, step = Math.max(M.POSE, Math.floor(Math.min(2 * M.POSE, 0.5 / Math.max(1, n - 1)) / M.POSE + 1e-6) * M.POSE);
  order.forEach((p, k) => { p.t0 = at + k * step; p.tOut = d - 4 * M.POSE - (k % 2) * M.POSE; });
  const draw = pieces.slice().sort((a, b) => (a.kind !== b.kind ? (a.kind === 'lead' ? -1 : 1) : b.row - a.row || a.l - b.l));
  const leadOf = [], lineOf = [];
  for (const p of pieces) for (const i of p.words) (p.kind === 'lead' ? leadOf : lineOf)[i] = p;
  const ride = (t, p) => (w, i, box, c) => { const q = p(i), pose = M.poseAt(M.Q(t), q.t0, q.tOut); if (!pose) return false; M.apply(c, pose, (q.l + q.r) / 2, q.y0 + q.h / 2); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.Q(t), [cx, cy] = ground.cam(t);
      ctx.save(); ctx.translate(cx, cy);
      for (const p of draw) {
        const pose = M.poseAt(tq, p.t0, p.tOut); if (!pose) continue;
        ctx.save(); M.apply(ctx, pose, (p.l + p.r) / 2, p.y0 + p.h / 2); M.put(ctx, p.pc, p.l, p.y0); ctx.restore();
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.onTile, each: ride(t, (i) => leadOf[i]) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.onBrick, key: P.onAccent, each: ride(t, (i) => lineOf[i]) });
      ctx.restore();
    },
  };
}
