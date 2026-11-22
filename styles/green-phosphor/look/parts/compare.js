// Before and after as an edit at the prompt. The old value is typed after a minus sign; then the cursor backspaces over it word by word,
// and each erased word dies away by afterglow, leaving only a faint burn in the glass. Under it, after a plus sign, the new value is typed
// in inverse video. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, ch = ground.ch;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const gutter = 70, x0 = rtl ? SAFE.left : SAFE.left + gutter, x1 = rtl ? SAFE.right - gutter : SAFE.right;
  const nowText = asText(S.now).replace(/\*/g, '').split(/\s+/).filter(Boolean).map((w) => '*' + w + '*').join(' ');
  const [was, now] = kit.fitAll([asText(S.was).replace(/\*/g, ''), nowText], { size: T.size.compare, weight: 800, maxW: x1 - x0 - 40, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  const block = (label ? label.lead + ch : 0) + was.height + ch * 2 + now.height;
  const top = kit.place(block, 640);
  const yLabel = M.snap(top + (label ? label.lead / 2 : 0), ch);
  const yWas = M.snap(top + (label ? label.lead + ch : 0) + was.lead / 2, ch), yNow = M.snap(yWas + was.height - was.lead / 2 + ch * 2 + now.lead / 2, ch);
  const sLabel = label && M.screenText(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start' }, pal, T, pal.soft);
  const sWas = M.screenText(kit, was, { x0, x1, y: yWas, align: 'start' }, pal, T, pal.soft);
  const sNow = M.screenText(kit, now, { x0, x1, y: yNow, align: 'start' }, pal, T);
  const tw = M.typing(sWas.boxes, at + 0.15, T, 41);
  const del0 = Math.max(tw.end + 0.25, at + 0.85), delStep = 0.12, nw = sWas.boxes.length;
  const gone = (i) => del0 + (nw - 1 - i) * delStep;                  // the last word is erased first
  const tn = M.typing(sNow.boxes, del0 + nw * delStep + 0.15, T, 43);
  const off = d - T.dur.out, burn = T.tone.burn;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = M.decay(t, off, T.dur.tau);
      if (sLabel) sLabel.draw(ctx, () => (t >= at ? fade : 0), () => M.heat(t, at, T.dur.heat));
      const sx = rtl ? SAFE.right : SAFE.left;
      if (t >= tw.on[0]) { ctx.save(); ctx.globalAlpha = fade; M.charRow(ctx, '-', sx, yWas, T.size.prompt, mono, pal.dim, rtl ? 'right' : 'left'); ctx.restore(); }
      if (t >= tn.on[0] - 0.1) { ctx.save(); ctx.globalAlpha = fade; M.charRow(ctx, '+', sx, yNow, T.size.prompt, mono, pal.phos, rtl ? 'right' : 'left'); ctx.restore(); }
      sWas.draw(ctx, (i) => (t < tw.on[i] ? 0 : (burn + (1 - burn) * M.decay(t, gone(i), T.dur.tau * 1.5)) * fade), (i) => M.heat(t, tw.on[i], T.dur.heat));
      sNow.draw(ctx, (i) => (t >= tn.on[i] ? fade : 0), (i) => M.heat(t, tn.on[i], T.dur.heat * 2));
      // the cursor: typing the old value, backing over it, then typing the new one
      let cx, cy, size = was.size;
      const kn = M.typedUpTo(tn.on, t);
      if (kn >= 0) { cx = M.cursorX(sNow.boxes, kn, now, rtl, x0, x1); cy = sNow.boxes[kn].y; size = now.size; }
      else if (t >= del0 + nw * delStep) { cx = rtl ? x1 : x0; cy = yNow; size = now.size; }
      else if (t >= del0) { const left = nw - 2 - Math.floor((t - del0) / delStep); cx = M.cursorX(sWas.boxes, left, was, rtl, x0, x1); cy = left >= 0 ? sWas.boxes[left].y : yWas; }
      else { const kw = M.typedUpTo(tw.on, t); cx = M.cursorX(sWas.boxes, kw, was, rtl, x0, x1); cy = kw >= 0 ? sWas.boxes[kw].y : yWas; }
      if (t >= at) M.cursor(ctx, pal, T, t, { x: cx, y: cy, size, rtl, typingUntil: tn.end, alpha: t < off ? 1 : 0 });
    },
  };
}
