// The Blob World ending: the brand's logo is stamped on the board in an accent disc, and Pips hop in from every edge of the board to
// stand in a ring round it, each beaming as it lands; then the name, the handle and the slogan are printed underneath. spec: { duration }
import { need, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left, x1 = SAFE.right, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  ·  '), { size: 48, weight: 600, maxW: x1 - x0, minScale: 0.92, where: 'the slogan' }) : null;
  const D = { x: W / 2, y: 560, r: 140 }, ring = 270;
  const yName = D.y + ring * 0.8 + 150, yHandle = yName + name.lead / 2 + 20 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const r = rng(404), pips = [], N = 10;
  for (let k = 0; k < N; k++) {
    const a = -Math.PI / 2 + (k + 0.5) / N * Math.PI * 2, tx = D.x + Math.cos(a) * ring, ty = D.y + Math.sin(a) * ring * 0.8;
    const edge = [[-90, ty], [W + 90, ty], [tx, 1990]][Math.cos(a) < -0.3 ? 0 : Math.cos(a) > 0.3 ? 1 : 2];
    const land = 0.55 + k * 0.08 + r() * 0.04;
    const plan = new M.Plan(edge[0], edge[1]).hop(tx, ty, { at: land - 0.75, n: 3, per: 0.25, h: 54, happy: true });
    for (let j = 1; j < 6; j++) plan.hop(tx, ty, { at: 2.4 + j * 1.1 + (k % 3) * 0.2, n: 1, per: 0.28, h: 22, happy: true });
    pips.push({ plan, spr: ground.spr[k % 4], size: 80, seed: k, mood: (tt) => (tt > land ? 'happy' : undefined) });
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const back = pips.filter((p) => M.state(p.plan, t).y < D.y + 40), front = pips.filter((p) => !back.includes(p));
      M.crowd(ctx, back, t);
      const st = M.soft((t - 0.15) / 0.2);
      if (st > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, st * 2); const s = 1 + 0.08 * (1 - st);
        ctx.translate(D.x, D.y); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(4, 8, D.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.acc; ctx.beginPath(); ctx.arc(0, 0, D.r, 0, Math.PI * 2); ctx.fill();
        brand.logo.draw(ctx, -D.r * 0.58, -D.r * 0.58, D.r * 1.16, P.onAcc); ctx.restore();
      }
      M.crowd(ctx, front, t);
      M.printText(ctx, kit, name, { x0, x1, y: yName, align: 'center', color: P.ink, P, keyed: false, when: (i) => 1.5 + i * 0.1, t });
      M.printText(ctx, kit, handle, { x0, x1, y: yHandle, align: 'center', color: P.ink, P, keyed: false, when: () => 1.85, t });
      if (slogan) M.printText(ctx, kit, slogan, { x0, x1, y: ySlogan, align: 'center', color: P.grey, P, keyed: false, when: (i) => 2.05 + i * 0.05, t });
    },
  };
}
