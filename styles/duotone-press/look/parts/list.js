// A list: a strip of photograph (a colonnade, in duotone) is pulled first with the title under it; then each item is printed by a
// small leaf of its own, lifted from the reading side one per beat. Its index is knocked out in paper from a square of the
// photograph's shadow tones. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = (spec.at ?? 0) - look.tokens.dur.pre,  // the pull starts under the joint, so a cut never shows a blank sheet
        d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, cell = 84, gap = 28, pitch = 118;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: full - cell - gap, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: full, single: true, where: 'the list title' }) : null;
  const listH = pitch * items.length, titleH = title ? title.lead + 10 : 0;
  const top = Math.max(T.photo.y + 220 + 40, SAFE.bottom - 10 - listH - titleH);
  const win = { x: SAFE.left, y: T.photo.y, w: full, h: Math.min(520, top - 40 - T.photo.y) };
  const yTitle = top + (title ? title.lead / 2 : 0), y0 = top + titleH;
  const ph = M.photo('columns', Math.round(win.w * T.photo.res), Math.round(win.h * T.photo.res), 77);
  const rich = M.print(ph, ground.LUT.rich), shadow = M.print(ph, ground.LUT.shadow);
  const pl = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: full + 40, h: (title ? y0 : win.y + win.h + 20) - win.y + 20 }, rtl);
  const t0 = at + T.dur.peel * 0.75;
  const legs = items.map((_, k) => ({ y: y0 + k * pitch, pl: M.peel({ x: SAFE.left - 10, y: y0 + k * pitch, w: full + 20, h: pitch - 14 }, rtl), t0: t0 + k * T.beat }));
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s = M.pull(pl, t, at, T.dur.peel);
      ctx.save(); pl.clip(ctx, s); M.framed(ctx, rich, win, T.photo.push * span(t, at, d)); ctx.restore();
      if (title) M.press(ctx, kit, title, { t, pl, t0: at, dur: T.dur.peel, P, T, x0: SAFE.left, x1: SAFE.right, y: yTitle, color: P.grey });
      pl.flap(ctx, s, P.back);
      legs.forEach((L, k) => {
        const sl = M.pull(L.pl, t, L.t0, T.dur.small); if (sl <= 0) return;
        const ym = L.y + (pitch - 14) / 2, cx = rtl ? SAFE.right - cell : SAFE.left;
        ctx.save(); L.pl.clip(ctx, sl);
        ctx.drawImage(shadow, (k * 97) % Math.max(1, shadow.width - 60), shadow.height * 0.3, 60, 60, cx, ym - cell / 2, cell, cell);
        ctx.fillStyle = P.paper; ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1).padStart(2, '0'), cx + cell / 2, ym + 1);
        ctx.fillStyle = P.rule; ctx.fillRect(SAFE.left, L.y + pitch - 16, full, 2);
        ctx.restore();
        M.press(ctx, kit, rows[k], { t, pl: L.pl, t0: L.t0, dur: T.dur.small, P, T, shadow, x0: rtl ? SAFE.left : SAFE.left + cell + gap, x1: rtl ? SAFE.right - cell - gap : SAFE.right, y: ym });
        L.pl.flap(ctx, sl, P.back, 120);
      });
    },
  };
}
