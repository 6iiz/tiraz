// A line in real time: the clock counts down to this line's zero. Until then the frame is split: the main cell carries the lead (as a
// live transcript, with a speaking light) and the statement, with tracking brackets on the key phrase; two cells under it show the same
// second from other cameras: a close-up of the key phrase and a wide shot of the whole line. At zero the cells close into one picture,
// the statement settles to its middle and the clock flips. spec: { duration, at?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock: clk, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, A = T.area, gut = T.gutter;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: clk });
  const M = await import(look.base + 'motion.js'), P = ground.palette, mono = ground.mono, vig = M.vignette(P);
  const x0 = Math.max(A.x0 + 40, SAFE.left + 6), x1 = Math.min(A.x1 - 40, SAFE.right - 6), maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 40, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const mainH = Math.max(440, block + 150), main = { x: A.x0, y: A.y0, w: A.x1 - A.x0, h: mainH }, full = { x: A.x0, y: A.y0, w: A.x1 - A.x0, h: A.y1 - A.y0 };
  const lowY = A.y0 + mainH + gut, lowH = A.y1 - lowY, half = (A.x1 - A.x0 - gut) / 2;
  const camA = { x: rtl ? A.x0 + half + gut : A.x0, y: lowY, w: half, h: lowH }, camB = { x: rtl ? A.x0 : A.x0 + half + gut, y: lowY, w: half, h: lowH };
  const zero = Math.max(1.4, at + 1.4);
  const topSplit = A.y0 + 62 + (mainH - 62 - block) / 2, topFull = A.y0 + (full.h - block) / 2;
  const ys = (top) => ({ lead: top + (lead ? lead.lead / 2 : 0), line: top + (lead ? lead.height + gap : 0) + line.lead / 2 });
  // the other cameras' picture of the same second, built once: the statement as it is set, with its brackets
  const shot = document.createElement('canvas'); shot.width = W; shot.height = Math.ceil(line.height + 80); const sg = shot.getContext('2d');
  const sy = 40 + line.lead / 2, sSpans = M.keySpans(line, x0, x1, sy, 'start', rtl);
  kit.drawText(sg, line, { x0, x1, y: sy, align: 'start', color: P.text, key: P.keyText, decor: true });
  sSpans.forEach((s) => M.brackets(sg, s.x0, s.x1, s.y, line.size, P, 1));
  const focus = sSpans[0] ?? { x0: x0, x1: x1, y: sy };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.clock(ctx, t, zero, P, mono, rtl, M.clockBox(T, rtl));
      const m = M.snap(span(t, zero, zero + T.dur.merge)), split = 1 - m;
      // the other cameras (covered by the main cell as it closes over them)
      if (split > 0) {
        M.cell(ctx, camA, P, mono, rtl, { code: 'CAM 2', vignette: vig });
        M.cell(ctx, camB, P, mono, rtl, { code: 'CAM 3', vignette: vig });
        const drift = (t - at) * 12, cxF = (focus.x0 + focus.x1) / 2;
        ctx.save(); ctx.beginPath(); ctx.rect(camA.x + 1, camA.y + 1, camA.w - 2, camA.h - 2); ctx.clip();
        const s1 = Math.min(2.1, (camA.w * 0.95) / Math.max(60, focus.x1 - focus.x0 + 60));
        ctx.translate(camA.x + camA.w / 2 + drift * 0.4, camA.y + camA.h / 2 + 18); ctx.scale(s1, s1); ctx.drawImage(shot, -cxF, -focus.y); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(camB.x + 1, camB.y + 1, camB.w - 2, camB.h - 2); ctx.clip();
        const s2 = (camB.w * 0.9) / W;
        ctx.translate(camB.x + camB.w / 2, camB.y + camB.h / 2 + 18); ctx.scale(s2 * (1 + drift * 0.0015), s2 * (1 + drift * 0.0015)); ctx.drawImage(shot, -W / 2, -shot.height / 2); ctx.restore();
        M.cell(ctx, camA, P, mono, rtl, { code: 'CAM 2', fill: false });
        M.cell(ctx, camB, P, mono, rtl, { code: 'CAM 3', fill: false });
      }
      const R = M.lerpRect(main, full, m);
      M.cell(ctx, R, P, mono, rtl, { code: 'CAM 1', chip: split, vignette: vig });
      const y = ys(topSplit + (topFull - topSplit) * m);
      if (lead) {
        // the live transcript: a speaking light beside the lead
        const lx = rtl ? x1 - 14 : x0, on = Math.floor(t * 3) % 2 === 0 || t > zero;
        ctx.fillStyle = on ? P.accent : P.pending; ctx.fillRect(rtl ? lx : lx, y.lead - 7, 14, 14);
        kit.drawText(ctx, lead, { x0: rtl ? x0 : x0 + 34, x1: rtl ? x1 - 34 : x1, y: y.lead, align: 'start', color: P.muted });
      }
      const spans = M.keySpans(line, x0, x1, y.line, 'start', rtl);
      spans.forEach((s) => M.brackets(ctx, s.x0, s.x1, s.y, line.size, P, span(t, at + 0.1, at + 0.35)));
      kit.drawText(ctx, line, { x0, x1, y: y.line, align: 'start', color: P.text, key: P.keyText });
    },
  };
}
