// Before and after, with a ball: the old value stands as quiet grey solids; a crayon ball is thrown in from the reading side, hits
// it, and the old words tumble and fall out of the frame (stepped, with gravity). Then the new value drops in as solids of the accent
// and lands with a squash. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, C = M.sets(P);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 100, x0 = SAFE.left + 40, x1 = SAFE.right - 40;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: T.size.compare * 0.85, weight: 900, maxW, minScale: 0.6, where: 'the old value' });
  const now = kit.fit('*' + asText(S.now).replace(/\*/g, '') + '*', { size: T.size.compare, weight: 900, maxW, minScale: 0.6, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 700, maxW, single: true, where: 'the compare label' }) : null;
  const yLabel = 420, yWas = 640, yNow = 880;
  const LB = label ? M.solidText(kit, W, H, label, { x0, x1, y: yLabel, D: T.depth.small, colours: { plain: C.dim, key: C.key }, seed: 2 }) : [];
  const WA = M.solidText(kit, W, H, was, { x0, x1, y: yWas, D: T.depth.compare, colours: { plain: C.dim, key: C.dim }, seed: 8 });
  const NO = M.solidText(kit, W, H, now, { x0, x1, y: yNow, D: T.depth.compare, colours: C, seed: 14 });
  const RL = label ? M.rowsOf(LB, label.size) : [], RW = M.rowsOf(WA, was.size), RN = M.rowsOf(NO, now.size);
  const r = 58, bc = M.ball(W, H, r, P.keyFace, P.keyDeep, 4, false);
  const tWas = at + 0.15, tThrow = at + 0.7, tHit = at + 1.0, tNow = at + 1.35;
  const sh = M.smudge(W, H, now.width * 0.9, P.shadow, 4);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = ground.step(t), dx = -ground.cam(t) * 0.3;
      if (label) M.words(ctx, kit, LB, RL, ts, (k) => at + k * T.dur.gap, { dx, h: 90, dur: T.dur.drop });
      const hit = ts - tHit;                                     // the old value: in, then knocked down
      if (hit < 0) M.words(ctx, kit, WA, RW, ts, (k) => tWas + k * T.dur.gap, { dx, h: T.drop, dur: T.dur.drop });
      else WA.forEach((q, k) => {
        const u = hit - k * 0.04; if (u < 0) { ctx.drawImage(q.sprite.cv, q.x + dx, q.y); return; }
        const side = rtl ? -1 : 1, spin = side * (1.2 + k * 0.3) * u * 3, vx = side * (260 + k * 60) * u, vy = -300 * u + 2400 * u * u;
        if (q.y + vy > H + 100) return;
        const cx = q.x + q.sprite.cv.width / 2 + dx, cy = q.y + q.sprite.cv.height / 2;
        ctx.save(); ctx.translate(cx + vx, cy + vy); ctx.rotate(spin); ctx.drawImage(q.sprite.cv, -q.sprite.cv.width / 2, -q.sprite.cv.height / 2); ctx.restore();
      });
      const pb = span(ts, tThrow, tHit + 0.5);                   // the ball: in from the reading side, through, out the other side
      if (pb > 0 && pb < 1) {
        const from = rtl ? W + r * 2 : -r * 2, to = rtl ? -r * 2 : W + r * 2, u = pb < 0.6 ? (pb / 0.6) * 0.5 : 0.5 + ((pb - 0.6) / 0.4) * 0.5;
        const bx = from + (to - from) * u, by = yWas - 40 * Math.sin(Math.PI * u) + 20;
        ctx.save(); ctx.translate(bx, by); ctx.rotate((rtl ? -1 : 1) * u * 9); ctx.drawImage(bc, -bc.width / 2, -bc.height / 2); ctx.restore();
      }
      const pn = span(ts, tNow, tNow + T.dur.drop);
      if (pn > 0) { ctx.save(); ctx.globalAlpha = clamp(pn * 2); ctx.drawImage(sh, W / 2 - sh.width / 2 + dx * 1.6 - 40, ground.horizon + 80 - sh.height / 2); ctx.restore(); }
      M.words(ctx, kit, NO, RN, ts, (k) => tNow + k * T.dur.gap, { dx, h: T.drop, dur: T.dur.drop });
    },
  };
}
