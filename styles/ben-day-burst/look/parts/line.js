// A line: a sheet of four pulls of the same object print, each in another colourway, fills the top of the poster; one by one they
// are pulled again in the next colourway on a slow count. Below, the blade prints the type: the lead-in on a slab of the accent,
// the statement in the dark key colour, the key word (*…*, or a run of them) on one accent block with a heavy key border.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, g = T.gutter;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 20;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 30, minScale: 0.9, where: 'the lead-in' }) : null;
  const block = (lead ? lead.height + 18 : 0) + line.height;
  const top = spec.y ?? Math.max(560, kit.place(block, 1040));
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + 18 : 0) + line.lead / 2;
  const seed = [...spec.says.text].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 9973, 3), obj = M.OBJECTS[M.KINDS[seed % 4]];
  const x0 = 40, y0 = 40, tw = (W - 80 - g) / 2, th = (top - 50 - y0 - g) / 2, s = Math.min(tw, th) / 230;
  const tiles = [0, 1, 2, 3].map((i) => { const c = i % 2, r = Math.floor(i / 2), col = rtl ? 1 - c : c; return { x: x0 + col * (tw + g), y: y0 + r * (th + g), w: tw, h: th }; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      tiles.forEach((r, i) => M.cycling(ctx, r, P.ways, i, { t, t0: at + i * 0.06, start: at + 1.2, lag: i * 0.14, every: T.dur.swap, rtl, dots: ground.dots, keyC: P.night, paperC: P.paper,
        obj, ox: r.x + r.w / 2, oy: r.y + r.h / 2, s, step: T.dur.step, plate: T.dur.plate }));
      if (lead) M.pullText(ctx, kit, lead, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yLead, t, t0: at + 0.12, d: T.dur.pull, P, color: P.onAccent, slab: P.accent });
      M.pullText(ctx, kit, line, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yLine, t, t0: at + 0.2, d: T.dur.pull, P });
    },
  };
}
