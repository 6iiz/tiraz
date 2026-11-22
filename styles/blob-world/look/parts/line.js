// A line printed on the board: the words are stamped one after another, the lead in grey above (it wraps rather than shrinks), the
// key phrase (*…*, one word or several) on one printed accent tape. Two Pips hop up and sit on the tape; the rest of the crowd potters
// about on the board below the words, each in its own patch, never over the text. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 24, maxW = x1 - x0 - M.keyRoom(T.size.line);
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75, lead: T.lineLead });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minScale: 0.9, where: 'the lead-in' }) : null;
  const keyTop = M.keyRuns(M.boxes(kit, line, { x0, x1, y: 0 })).some((r) => r.row === 0);
  const gap = lead ? (keyTop ? 96 : 30) : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nl = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, n = nl + line.rows.reduce((s, r) => s + r.words.length, 0);
  const total = (n - 1) * T.dur.word + 0.16, f = at < 0 ? Math.min(1, (-at - 0.15) / total) : 1;
  const when = (k) => at + k * T.dur.word * f, out0 = d - T.dur.out;
  // where the words are, to keep Pips off them
  const words = [...(lead ? M.boxes(kit, lead, { x0, x1, y: yLead }).map((b) => ({ ...b, s: lead.size })) : []), ...M.boxes(kit, line, { x0, x1, y: yLine }).map((b) => ({ ...b, s: line.size }))];
  const free = (x, y0, y1, yRow) => !words.some((b) => b.y < yRow - 2 && x + 40 > b.x - 10 && x - 40 < b.x + b.width + 10 && y1 > b.y - b.s * 0.7 && y0 < b.y + b.s * 0.7);
  const r = rng(101), pips = [], textBottom = yLine + (line.rows.length - 1) * line.lead + line.size * 0.7;
  // the perchers: on top of the first key run, where nothing is printed above them
  const runs = M.keyRuns(M.boxes(kit, line, { x0, x1, y: yLine }));
  if (runs.length) {
    const run = runs[0], ty = run.y - line.size * 0.56, cand = [0.22, 0.78, 0.5].map((u) => run.x0 + (run.x1 - run.x0) * u);
    let seat = 0;
    for (const x of cand) {
      if (seat >= 2 || !free(x, ty - 76, ty - 2, run.y)) continue;
      const side = x > W / 2 ? W + 80 : -80, arrive = at + 0.35 + seat * 0.12;
      const plan = new M.Plan(side, ty - 40).hop(x, ty, { at: arrive - 0.66, n: 3, per: 0.22, h: 46, happy: true });
      for (let k = 1; k < 6; k++) plan.hop(x, ty, { at: arrive + 1.3 * k + seat * 0.5, n: 1, per: 0.3, h: 24 });
      pips.push({ plan, spr: ground.spr[seat ? 1 : 0], size: 74, seed: 3 + seat }); seat++;
    }
  }
  // the crowd: six patches on the board under the words
  const yA = Math.max(textBottom + 110, 980), yB = 1780, cols = 3;
  for (let k = 0; k < 6; k++) {
    const cw = (SAFE.right - SAFE.left) / cols, bx0 = SAFE.left + (k % cols) * cw + 30, bx1 = bx0 + cw - 60;
    const by0 = k < cols ? yA : (yA + yB) / 2 + 30, by1 = k < cols ? (yA + yB) / 2 - 30 : yB;
    const plan = new M.Plan(bx0 + r() * (bx1 - bx0), by0 + r() * (by1 - by0), at - 1);
    M.wander(plan, r, { x0: bx0, x1: bx1, y0: by0, y1: by1 }, d + 1, 140);
    pips.push({ plan, spr: ground.spr[(k + 1) % 4], size: T.pip - (k % 3) * 8, seed: 10 + k });
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = Math.max(0, (t - out0) / T.dur.out);
      M.crowd(ctx, pips.filter((p) => p.seed >= 10), t);
      if (lead) M.printText(ctx, kit, lead, { x0, x1, y: yLead, color: P.grey, P, keyed: false, when, out, t });
      M.printText(ctx, kit, line, { x0, x1, y: yLine, color: P.ink, P, when: (i) => when(nl + i), out, t });
      M.crowd(ctx, pips.filter((p) => p.seed < 10), t);
    },
  };
}
