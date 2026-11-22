// Before and after, as a cartoon gag. The old value stands on the card in grey; a big mallet swings down from the side and flattens it
// (it squashes to a pancake and stays squashed), a puff of dust lines pops out, then the new value springs up beneath in the accent
// cartouche with little four-point twinkles around it. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const cx0 = SAFE.left + 4, cx1 = SAFE.right - 4, x0 = cx0 + 80, x1 = cx1 - 80;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0 - 120, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.85, where: 'the compare label' }) : null;
  const pad = 64, lH = label ? label.height + 30 : 0, top = kit.place(lH + was.height + 70 + now.height + 2 * pad, 690);
  const yL = top + pad + (label ? label.lead / 2 : 0), yWas = top + pad + lH + was.lead / 2, yNow = yWas + was.height / 2 + 70 + now.lead / 2;
  const bot = yNow + now.height - now.lead / 2 + pad;
  const tHit = at + 0.95, tNow = at + 1.4;
  const wb = M.layout(was, { x0, x1, y: yWas }, rtl), wx0 = Math.min(...wb.map((b) => b.x)), wx1 = Math.max(...wb.map((b) => b.x + b.width));
  const nb = M.layout(now, { x0, x1, y: yNow }, rtl);
  const nRuns = M.keyRuns(now, { x0, x1, y: yNow }, rtl, true);
  const floorWas = yWas + was.size * 0.5;
  // the mallet hangs from a pivot beyond the reading-side edge and swings down onto the word
  const side = rtl ? 1 : -1, px = rtl ? W - 30 : 30, arm = Math.abs(px - (wx0 + wx1) / 2), py = yWas - was.size * 0.5 - 140;
  const mallet = (ctx, a) => {
    ctx.save(); ctx.translate(px, py); ctx.rotate(-side * a);
    const hx = -side * arm;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, 0); ctx.stroke();
    ctx.strokeStyle = P.card; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-side * 40, 0); ctx.lineTo(hx + side * 60, 0); ctx.stroke();
    M.rrect(ctx, hx - 70, -10, hx + 70, 140, 22); ctx.fillStyle = P.ink; ctx.fill();
    ctx.fillStyle = P.card; ctx.fillRect(hx - 70, 30, 140, 14); ctx.fillRect(hx - 70, 96, 140, 14);
    ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      M.fellow(ctx, P, W / 2, T.stage.fellowY, T.stage.fellowS, tt + clock, T.beat, tt >= tNow && tt < tNow + 1 ? 'cheer' : 'dance');
      const pc = span(tt, at, at + T.pop.card); if (pc <= 0) return;
      ctx.save(); M.popAt(ctx, pc, W / 2, bot);
      M.card(ctx, P, cx0, top, cx1, bot);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yL, color: P.grey, key: P.ink,
        each: (w, i, box, c) => { if (M.popAt(c, span(tt, at + 0.1 + i * 0.07, at + 0.1 + i * 0.07 + T.pop.word), box.x + box.width / 2, box.y + label.size * 0.5) === false) return false; } });
      // the old value: pops in, then is flattened by the hit and stays a pancake
      const flat = span(tt, tHit - 0.04, tHit + 0.05);
      ctx.save();
      if (flat > 0) { const sy = 1 - 0.8 * flat, sx = 1 + 0.18 * flat; ctx.translate(W / 2, floorWas); ctx.scale(sx, sy); ctx.translate(-W / 2, -floorWas); }
      kit.drawText(ctx, was, { x0, x1, y: yWas, color: P.grey, key: P.grey,
        each: (w, i, box, c) => { if (M.popAt(c, span(tt, at + 0.3 + i * 0.07, at + 0.3 + i * 0.07 + T.pop.word), box.x + box.width / 2, box.y + was.size * 0.5) === false) return false; } });
      ctx.restore();
      // dust lines out of the impact
      const dp = span(tt, tHit, tHit + 0.35);
      if (dp > 0 && dp < 1) {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
          const ex = s < 0 ? wx0 - 20 : wx1 + 20, a = (k - 1) * 0.5, r0 = 20 + 70 * dp, r1 = r0 + 40;
          ctx.beginPath(); ctx.moveTo(ex + s * Math.cos(a) * r0, floorWas - 10 + Math.sin(a) * r0); ctx.lineTo(ex + s * Math.cos(a) * r1, floorWas - 10 + Math.sin(a) * r1); ctx.stroke();
        }
      }
      // the new value springs up in the cartouche, with twinkles
      kit.drawText(ctx, now, { x0, x1, y: yNow, color: P.ink, key: P.ink,
        each: (w, i, box, c) => { if (M.popAt(c, span(tt, tNow + i * 0.07, tNow + i * 0.07 + T.pop.word * 1.3), box.x + box.width / 2, box.y + now.size * 0.5) === false) return false;
          if (nRuns[i] !== 'skip') M.cartouche(c, P, nRuns[i], now.size); return P.onAccent; } });
      if (tt >= tNow + 0.3) {
        const nx0 = Math.min(...nb.map((b) => b.x)) - now.size * 0.5, nx1 = Math.max(...nb.map((b) => b.x + b.width)) + now.size * 0.5;
        [[nx0 - 10, yNow - now.size * 0.6], [nx1 + 10, yNow - now.size * 0.3], [nx1 - 20, yNow + now.size * 0.75]].forEach(([x, y], k) => {
          const s = 10 + 9 * Math.abs(Math.sin(Math.PI * (tt - tNow) / T.beat + k)); ctx.fillStyle = P.ink;
          ctx.beginPath(); ctx.moveTo(x, y - s * 1.6); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s * 1.6); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s * 1.6); ctx.fill();
        });
      }
      ctx.restore();
      // the swing: up and back, down fast onto the word, a short rest, back up out of the way
      const up = span(tt, tHit - 0.45, tHit - 0.2), down = span(tt, tHit - 0.2, tHit), back = span(tt, tHit + 0.25, tHit + 0.55);
      if (up > 0 && back < 1) {
        const a = back > 0 ? -0.75 * back : down > 0 ? -0.75 * (1 - down * down) : -0.75 * clamp(up);
        mallet(ctx, a);
      }
    },
  };
}
