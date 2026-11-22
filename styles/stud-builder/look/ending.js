// The stud-builder ending: a square brick of the accent with the brand's logo printed on its face is set down in four poses; then
// the name on a long brick snaps under it, the handle (mono) and the slogan on flat tiles below, each a pose or two after the last.
// spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 140, cx = W / 2;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.label, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const S = 230, yLogo = 360, yName = yLogo + S + name.lead / 2, yHandle = yName + name.lead / 2 + 50 + handle.lead / 2;
  const sTop = yHandle + handle.lead / 2 + 40;
  const logoPc = M.piece(P, S, S, P.accent, { pitch: S / 2 });
  const nameW = name.width + 110, namePc = M.piece(P, nameW, name.lead, P.brick, { pitch: 110 });
  const tileOf = (f) => M.piece(P, f.width + 56, f.height - f.lead * 0.1, P.tile, { studs: false, deep: 14 });
  const hPc = tileOf(handle), sPc = slogan ? tileOf(slogan) : null;
  const at = (ctx, tq, t0, y, fn) => { const pose = M.setDown(tq, t0); if (!pose) return; ctx.save(); M.apply(ctx, pose, cx, y); fn(); ctx.restore(); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.Q(t), [ox, oy] = ground.cam(t);
      ctx.save(); ctx.translate(ox, oy);
      // the name brick is drawn first: the logo brick sits on its studs
      at(ctx, tq, 0.6, yName, () => { M.put(ctx, namePc, cx - nameW / 2, yName - name.lead / 2);
        kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.onBrick }); });
      at(ctx, tq, 0.1, yLogo + S / 2, () => { M.put(ctx, logoPc, cx - S / 2, yLogo); brand.logo.draw(ctx, cx - S * 0.32, yLogo + S * 0.18, S * 0.64, P.onAccent); });
      at(ctx, tq, 1.0, yHandle, () => { M.put(ctx, hPc, cx - hPc.w / 2, yHandle - hPc.h / 2);
        kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.onTile }); });
      if (slogan) at(ctx, tq, 1.35, sTop + slogan.height / 2, () => { M.put(ctx, sPc, cx - sPc.w / 2, sTop + slogan.lead * 0.05);
        kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: sTop + slogan.lead / 2, align: 'center', color: P.onTile }); });
      ctx.restore();
    },
  };
}
