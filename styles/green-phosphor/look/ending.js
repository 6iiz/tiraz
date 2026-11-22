// The phosphor ending: the brand's logo is printed in characters, row by row from the top as a line printer would, its densest cells
// over-bright for a moment as they are struck. Then the cursor types the name under it, the handle letter by letter in the mono face,
// and the slogan; the cursor stays, blinking, at the end of the last line. spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, ch = ground.ch;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  // the logo in characters: a grid twice as wide as tall in cells, so it is square on screen
  const lw = 14, lh = 28, rowsN = 13, colsN = 26, size = colsN * lw;
  const dens = M.sampler(colsN, rowsN, (g, w, h) => brand.logo.draw(g, 0, 0, w, '#ffffff'), 6, 12)();
  const lx = (W - size) / 2, ly = SAFE.top + 40;
  const art = document.createElement('canvas'); art.width = size + 60; art.height = rowsN * lh + 60;
  M.drawCells(art.getContext('2d'), dens, colsN, rowsN, 30, 30, lw, lh, mono, pal);
  const bloom = document.createElement('canvas'); bloom.width = art.width; bloom.height = art.height;
  { const b = bloom.getContext('2d'); b.filter = 'blur(10px)'; b.drawImage(art, 0, 0); b.filter = 'blur(3px)'; b.drawImage(art, 0, 0); }
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const yName = M.snap(ly + rowsN * lh + 70 + name.lead / 2, ch), yHandle = M.snap(yName + name.lead / 2 + handle.lead / 2 + 10, ch);
  const ySlogan = M.snap(yHandle + handle.lead / 2 + 24 + (slogan ? slogan.lead / 2 : 0), ch);
  const o = (y) => ({ x0: SAFE.left, x1: SAFE.right, y, align: 'center' });
  const sName = M.screenText(kit, name, o(yName), pal, T), sSlogan = slogan && M.screenText(kit, slogan, o(ySlogan), pal, T, pal.soft);
  const printEnd = 0.15 + rowsN * 0.05;
  const tn = M.typing(sName.boxes, printEnd + 0.15, T, 61);
  const hStart = tn.end + 0.1, hEnd = hStart + brand.handle.length / (T.type.cps * 1.6);
  const ts = sSlogan ? M.typing(sSlogan.boxes, hEnd + 0.15, T, 67) : { on: [], end: hEnd };
  const hx0 = (W - handle.width) / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const rowsShown = (t - 0.15) / 0.05;
      if (rowsShown > 0) {
        const hgt = Math.min(rowsN, rowsShown) * lh + 30;
        ctx.save(); ctx.beginPath(); ctx.rect(0, ly - 30, W, hgt); ctx.clip();
        ctx.globalAlpha = 0.75 + 0.25 * M.heat(t, printEnd, 0.4); ctx.drawImage(bloom, lx - 30, ly - 30);
        ctx.globalAlpha = 1; ctx.drawImage(art, lx - 30, ly - 30);
        ctx.restore();
        if (rowsShown < rowsN) { ctx.fillStyle = pal.hot; ctx.fillRect(lx, ly + Math.floor(rowsShown) * lh + lh - 3, size, 3); }
      }
      sName.draw(ctx, (i) => (t >= tn.on[i] ? 1 : 0), (i) => M.heat(t, tn.on[i], T.dur.heat));
      // the handle, letter by letter (it is a Latin handle in the mono face; an Arabic one would be revealed whole)
      if (t >= hStart) {
        const p = /[؀-ۿ]/.test(brand.handle) ? 1 : Math.min(1, (t - hStart) / (hEnd - hStart));
        ctx.save(); ctx.beginPath(); ctx.rect(hx0 - 4, yHandle - 40, handle.width * p + 8, 80); ctx.clip();
        kit.drawText(ctx, handle, { ...o(yHandle), color: pal.phos });
        ctx.restore();
      }
      if (sSlogan) sSlogan.draw(ctx, (i) => (t >= ts.on[i] ? 1 : 0), (i) => M.heat(t, ts.on[i], T.dur.heat));
      let cx, cy, sz;
      const kS = sSlogan ? M.typedUpTo(ts.on, t) : -1, kN = M.typedUpTo(tn.on, t);
      if (kS >= 0) { cx = M.cursorX(sSlogan.boxes, kS, slogan, rtl, SAFE.left, SAFE.right); cy = ySlogan; sz = slogan.size; }
      else if (t >= hStart) { const p = Math.min(1, (t - hStart) / (hEnd - hStart)); cx = hx0 + handle.width * p + 6; cy = yHandle; sz = handle.size; M.cursor(ctx, pal, T, t, { x: cx, y: cy, size: sz, rtl: false, typingUntil: hEnd }); cx = null; }
      else if (kN >= 0) { cx = M.cursorX(sName.boxes, kN, name, rtl, SAFE.left, SAFE.right); cy = yName; sz = name.size; }
      if (cx != null) M.cursor(ctx, pal, T, t, { x: cx, y: cy, size: sz, rtl, typingUntil: ts.end });
    },
  };
}
