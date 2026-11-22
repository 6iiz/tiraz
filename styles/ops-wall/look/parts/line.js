// A line as a point on the briefing wall: the lead-in is on a card that lands on the board with a magnet; the statement is written
// beside it in graphite marker, word by word at the pace of a hand. Then the key word (*…*) is looped in the accent marker, the decision
// colour. At the end the eraser wipes the line in the reading direction and leaves a ghost. spec: { duration, at?, y?, cut?, says: { text, lead? } }
//   cut: the wipe is quicker.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at means the line is already up when the reel opens: its entrance is done before frame 0, so the hook is whole
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 50, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 110, single: true, where: 'the lead-in' }) : null;
  const cardH = lead ? lead.lead + 34 : 0, cardW = lead ? lead.width + 100 : 0, gap = lead ? 56 : 0;
  const top = spec.y ?? kit.place(cardH + gap + line.height + 40, 620);
  const yText = top + cardH + gap + 20 + line.lead / 2, x0 = SAFE.left + 25, x1 = SAFE.right - 25;
  const cx = rtl ? SAFE.right - cardW - 10 : SAFE.left + 10;
  const times = M.writeTimes(line, at + (lead ? 0.35 : 0.05), T.write.speed);
  const c = document.createElement('canvas').getContext('2d'), kb = [];
  kit.drawText(c, line, { x0, x1, y: yText, align: 'start', decor: true, each: (w, i, box) => { if (w.key) kb.push(box); return false; } });
  const loops = kb.map((b, i) => M.loop(b.x + b.width / 2, b.y + line.size * 0.05, b.width / 2 + line.size * 0.4, line.size * 0.72, 300 + i));
  const tLoop = times.end + 0.1;
  const wipe = spec.cut ? [d - 0.4, d - 0.05] : [d - 0.55, d - 0.1];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const we = span(t, wipe[0], wipe[1]);
      const ex = M.eraserX(we, SAFE.left - 40, SAFE.right + 40, rtl);
      // what the eraser has passed is a ghost; the rest is still ink
      const pass = (draw) => {
        if (we <= 0) { draw(1); return; }
        ctx.save(); ctx.beginPath(); rtl ? ctx.rect(0, 0, ex, H) : ctx.rect(ex, 0, W - ex, H); ctx.clip(); draw(1); ctx.restore();
        ctx.save(); ctx.beginPath(); rtl ? ctx.rect(ex, 0, W - ex, H) : ctx.rect(0, 0, ex, H); ctx.clip(); ctx.globalAlpha = 0.07; draw(0); ctx.restore();
      };
      if (lead) {
        M.card(ctx, cx, top, cardW, cardH, P, span(t, at, at + 0.4), span(t, d - 0.4, d - 0.1), rtl ? 0.012 : -0.012, () => {
          kit.drawText(ctx, lead, { x0: cx + 50, x1: cx + cardW - 50, y: top + cardH / 2 + 4, align: 'start', color: P.soft });
          M.magnet(ctx, rtl ? cx + cardW - 26 : cx + 26, top + 8, 15, P.ink, span(t, at + 0.25, at + 0.45));
        });
      }
      pass((live) => {
        kit.drawText(ctx, line, { x0, x1, y: yText, align: 'start', color: P.ink, key: P.ink, decor: !live,
          each: (w, i, box, cc) => M.write(cc, t, times[i], box, line.size, rtl, P.ink, 70 + i) });
        loops.forEach((pts, i) => M.stroke(ctx, pts, span(t, tLoop + i * 0.2, tLoop + i * 0.2 + 0.4), Math.max(6, line.size * 0.075), P.accent));
      });
      M.eraser(ctx, we, SAFE.left - 40, SAFE.right + 40, yText + (line.rows.length - 1) * line.lead / 2, line.height + 40, P, rtl);
    },
  };
}
