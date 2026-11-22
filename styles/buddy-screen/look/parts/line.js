// A line, as a document open in the window: the lead-in is the field's small grey label, the statement is the field's text. The
// cursor glides in and double-clicks the key phrase, which turns into a selection (the interface's own highlight); the recorder pushes
// in a little. Then the pixel buddy runs along the field's top edge to stand over the selection, jumps, lands with a squash and a puff
// of pixel dust (the selection gives under it), and cheers. spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, mix, rr } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, B = M.buddy(P, T.px), c = M.content();
  const fx0 = c.x0, fx1 = c.x1, x0 = fx0 + 36, x1 = fx1 - 36, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const fh = 34 + (lead ? lead.height + 6 : 0) + line.height + 30, top = Math.max(c.y0 + 130, Math.min(760 - fh / 2, c.y1 - fh));
  const yLead = top + 34 + (lead ? lead.lead / 2 : 0), yLine = top + 34 + (lead ? lead.height + 6 : 0) + line.lead / 2;
  const spans = M.keySpans(line, x0, x1, yLine, 'start', rtl), k0 = spans[0];
  const keyX = k0 ? (k0.x0 + k0.x1) / 2 : (fx0 + fx1) / 2, startX = rtl ? fx0 + 90 : fx1 - 90;
  const stops = [{ t: 0, x: startX, y: top }, { t: 0.35, x: keyX, y: top, how: 'run', dur: Math.min(0.6, Math.abs(keyX - startX) / 900 + 0.15) }, { t: 1.0, x: keyX, y: top, how: 'jump', height: 120 }];
  const kx = k0 ? keyX : (fx0 + fx1) / 2, ky = k0 ? k0.y : yLine;
  const rest = { x: kx + 90, y: Math.max(ky + line.size * 0.75 + 20, top + fh + 30) };
  const path = [{ t: at, x: W - 70, y: 1290 }, { t: at + 0.35, x: kx + 14, y: ky + 18 }, { t: at + 0.55, x: kx + 14, y: ky + 18 }, { t: at + 0.95, ...rest }, { t: 2.8, x: rest.x + 60, y: rest.y + 80 }];
  const clicks = [at + 0.38, at + 0.5];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.zoom(ctx, W, H, 1 + (T.zoom - 1) * M.IO(span(t, at + 0.2, at + 1.0)), W / 2, top + fh / 2);
      M.windowFrame(ctx, P, brand, rtl, t + clock, 0);
      // the document: a title bar placeholder, then the field
      ctx.fillStyle = P.chrome; rr(ctx, rtl ? fx1 - 360 : fx0, c.y0, 360, 22, 11); ctx.fill(); rr(ctx, rtl ? fx1 - 220 : fx0, c.y0 + 40, 220, 16, 8); ctx.fill();
      ctx.fillStyle = P.win; ctx.strokeStyle = P.line; ctx.lineWidth = 2; rr(ctx, fx0, top, fx1 - fx0, fh, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.accent; ctx.fillRect(rtl ? fx1 - 4 : fx0, top + 22, 4, fh - 44);
      const b = M.act(stops, t), pulse = b.landed < 0.3 ? Math.sin(b.landed / 0.3 * Math.PI) : 0;
      const sel = span(t, at + 0.5, at + 0.6);
      for (const s of spans) M.select(ctx, P, s, line, sel, rtl, pulse);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.grey });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.onAccent, each: (w) => (w.key && sel <= 0 ? P.ink : undefined) });
      const cheer = b.landed < 99;
      M.drawBuddy(ctx, B, P, b, { eyes: cheer ? 'happy' : 'open', arms: cheer && Math.floor(b.landed / 0.25) % 2 === 0 ? 'up' : 'down', look: rtl ? 1 : 0, time: t + clock, flip: false });
      M.cursor(ctx, P, path, clicks, t);
      ctx.restore();
    },
  };
}
