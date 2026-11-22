// A line typed at the prompt: a dim prompt sign on the reading side, the lead-in typed first in the softer phosphor, then the statement
// in full phosphor. A block cursor runs ahead of the words; each word lights whole as the cursor passes and is over-bright for a moment.
// The key word (*…*) is inverse video. On the way out the screen is cleared and the words fade by afterglow.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, ch = ground.ch;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const gutter = 60, room = 50, x0 = rtl ? SAFE.left + room : SAFE.left + gutter, x1 = rtl ? SAFE.right - gutter : SAFE.right - room, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? ch : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = M.snap(top + (lead ? lead.lead / 2 : 0), ch), yLine = M.snap(top + (lead ? lead.height + gap : 0) + line.lead / 2, ch);
  const sLead = lead && M.screenText(kit, lead, { x0, x1, y: yLead, align: 'start' }, pal, T, pal.soft);
  const sLine = M.screenText(kit, line, { x0, x1, y: yLine, align: 'start' }, pal, T);
  const tl = sLead ? M.typing(sLead.boxes, at, T, 11) : { on: [], end: at };
  const tm = M.typing(sLine.boxes, tl.end + (lead ? 0.12 : 0), T, 23);
  const off = d - T.dur.out, px = rtl ? SAFE.right : SAFE.left;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = M.decay(t, off, T.dur.tau);
      const lv = (on) => (i) => (t >= on[i] ? fade : 0), ht = (on) => (i) => M.heat(t, on[i], T.dur.heat);
      if (t >= at) {
        M.charRow(ctx, rtl ? '<' : '>', px, yLead && lead ? yLead : yLine, T.size.prompt, mono, pal.dim, rtl ? 'right' : 'left');
        kit.rec(rtl ? px - 30 : px, rtl ? px : px + 30, (lead ? yLead : yLine) - 20, (lead ? yLead : yLine) + 20, '>', { decor: true });
      }
      if (sLead) sLead.draw(ctx, lv(tl.on), ht(tl.on));
      sLine.draw(ctx, lv(tm.on), ht(tm.on));
      // the cursor: after the last typed word of whichever text is being typed
      const kLine = M.typedUpTo(tm.on, t), kLead = M.typedUpTo(tl.on, t);
      let cx, cy, size;
      if (kLine >= 0) { const b = sLine.boxes[kLine]; cx = M.cursorX(sLine.boxes, kLine, line, rtl, x0, x1); cy = b.y; size = line.size; }
      else if (kLead >= 0) { const b = sLead.boxes[kLead]; cx = M.cursorX(sLead.boxes, kLead, lead, rtl, x0, x1); cy = b.y; size = lead.size; }
      else { cx = rtl ? x1 : x0; cy = lead ? yLead : yLine; size = lead ? lead.size : line.size; }
      if (t >= at - 0.3) M.cursor(ctx, pal, T, t, { x: cx, y: cy, size, rtl, typingUntil: tm.end, alpha: t < off ? 1 : 0 });
    },
  };
}
