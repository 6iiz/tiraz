// A line as an intertitle card: the card opens from its middle like a shutter, an optional small lead-in is exposed above an ornament
// rule, then the statement is exposed whole, centred, in a few cranked steps. The key word (*…*) is written in the accent when it reads
// on the card (silver otherwise) and a flourish is drawn under it. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, C = T.card;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = C.x1 - C.x0 - 2 * C.padX, cx = (C.x0 + C.x1) / 2;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const ornH = 58, inner = (lead ? lead.lead + ornH : 0) + line.height, h = inner + 2 * C.padY;
  const top = spec.y ?? kit.place(h, 720);
  const yLead = top + C.padY + (lead ? lead.lead / 2 : 0), yOrn = yLead + (lead ? lead.lead / 2 + ornH / 2 - 6 : 0);
  const yLine = top + C.padY + (lead ? lead.lead + ornH : 0) + line.lead / 2;
  const tLead = 0.25, tLine = lead ? 0.5 : 0.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const w = ground.weave(t), tc = M.crank(t - at);
      ctx.save(); ctx.translate(w.x, w.y);
      M.card(ctx, C.x0, top, C.x1, top + h, span(tc, 0, 0.34), P, C.notch);
      if (lead) {
        kit.drawText(ctx, lead, { x0: C.x0 + C.padX, x1: C.x1 - C.padX, y: yLead, color: P.dim, each: (wd, i, box, c) => M.expose(c, span(tc, tLead, tLead + 0.25), lead.size) });
        M.rule(ctx, cx, yOrn, 360, span(tc, tLead + 0.1, tLead + 0.4), P);
      }
      const pe = span(tc, tLine, tLine + 0.25), pf = span(tc, tLine + 0.3, tLine + 0.65);
      kit.drawText(ctx, line, { x0: C.x0 + C.padX, x1: C.x1 - C.padX, y: yLine, color: P.silver, key: P.key,
        each: (wd, i, box, c) => {
          if (M.expose(c, pe, line.size) === false) return false;
          if (wd.key) M.flourish(c, box.x, box.x + box.width, box.y + line.size * 0.8, pf, P, kit.rtl);
        } });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
