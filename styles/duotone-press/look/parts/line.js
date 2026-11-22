// A line: a pull from the press. Over the sheet lies a covering leaf; it is lifted from the reading side's top corner along a
// straight fold and, under it, the duotone photograph and the type are printed: the grey lead-in, then the statement in the dark ink,
// each word whole as the fold passes it. The key word (*…*, or a run of them) is knocked out in paper from one strip of the
// photograph printed in its shadow tones. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = (spec.at ?? 0) - look.tokens.dur.pre,  // the pull starts under the joint, so a cut never shows a blank sheet
        d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const block = (lead ? lead.height + 8 : 0) + line.height;
  const top = spec.y ?? Math.max(T.photo.y + 330 + 44, kit.place(block, 1050));
  const win = { x: SAFE.left, y: T.photo.y, w: SAFE.right - SAFE.left, h: top - 44 - T.photo.y };
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + 8 : 0) + line.lead / 2;
  const kinds = ['land', 'sea', 'columns', 'still'], seed = [...spec.says.text].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 9973, 7);
  const ph = M.photo(kinds[seed % 4], Math.round(win.w * T.photo.res), Math.round(win.h * T.photo.res), seed);
  const rich = M.print(ph, ground.LUT.rich), shadow = M.print(ph, ground.LUT.shadow);
  const pl = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: win.w + 40, h: top + block + 30 - win.y + 20 }, rtl);
  const o = { t: 0, pl, t0: at, dur: T.dur.peel, P, T, shadow };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s = M.pull(pl, t, at, T.dur.peel);
      ctx.save(); pl.clip(ctx, s); M.framed(ctx, rich, win, T.photo.push * span(t, at, d)); ctx.restore();
      o.t = t;
      if (lead) M.press(ctx, kit, lead, { ...o, x0: SAFE.left, x1: SAFE.right, y: yLead, color: P.grey });
      M.press(ctx, kit, line, { ...o, x0: SAFE.left, x1: SAFE.right, y: yLine });
      pl.flap(ctx, s, P.back);
    },
  };
}
