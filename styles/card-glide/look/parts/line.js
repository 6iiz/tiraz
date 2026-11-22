// A line, printed on a paper card lying on the desk: a small interface head, the lead-in in grey, the statement in ink. The camera
// glides in to the card; the key phrase (*…*) is a chip of the accent that pops up out of the card, its words printed on it. The voxel
// toy lies on the card's head as a flat sticker, pops up into a toy, and hops along the card's top edge to stand over the key phrase.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; the joint does every exit)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, S = M.toy(brand, P);
  const C = T.card, x0 = C.x0 + C.pad, x1 = C.x1 - C.pad, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const headH = 60, footH = 26;
  const cardH = headH + 30 + (lead ? lead.height + 10 : 0) + line.height + 30 + footH + 34;
  const top = spec.y ?? kit.place(cardH, 720);
  const yLead = top + headH + 30 + (lead ? lead.lead / 2 : 0), yLine = top + headH + 30 + (lead ? lead.height + 10 : 0) + line.lead / 2;
  const spans = M.keySpans(line, x0, x1, yLine, 'start', rtl);
  const keyX = spans.length ? (spans[0].x0 + spans[0].x1) / 2 : (rtl ? x1 - 120 : x0 + 120);
  const startX = rtl ? C.x0 + 130 : C.x1 - 130, midX = (startX + keyX) / 2;
  const stops = [{ t: 0, x: startX, y: top }, { t: 0.75, x: midX, y: top }, { t: 1.15, x: keyX, y: top, height: 120 }];
  return {
    duration: d,
    draw(ctx, t) {
      ctx.save(); M.camera(ctx, W, H, t, at, rtl);
      ground.draw(ctx, t);
      M.card(ctx, P, C.x0, top, C.x1 - C.x0, cardH, { r: C.r });
      M.printHead(ctx, P, C.x0, top, C.x1 - C.x0, rtl, brand);
      M.printFoot(ctx, P, C.x0, top + cardH - footH - 30, C.x1 - C.x0, rtl, 3, 0);
      const tr = M.track(stops, t), bump = tr.landed < 0.5 ? Math.sin(tr.landed / 0.5 * Math.PI) * 0.5 : 0;
      const pc = span(t, at + 0.25, at + 0.6);
      let lift = 0;
      for (const s of spans) lift = M.chip(ctx, P, s, line.size, pc, bump, line.space) || lift;
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.grey });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.onAccent,
        each: (w, i, box, c) => { if (!w.key) return; if (pc <= 0) return P.ink; c.translate(0, -lift); } });
      M.ring(ctx, P, keyX, top, tr.landed);
      M.drawToy(ctx, S, tr.x, tr.y, { air: tr.air, sq: tr.sq, e: span(t, 0.2, 0.45), time: t + clock, flip: tr.x > keyX !== rtl });
      ctx.restore();
    },
  };
}
