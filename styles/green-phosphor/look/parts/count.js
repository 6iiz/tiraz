// A number as text-mode art: the figure is drawn in characters on the cell grid, each cell's glyph picked by how much of the figure
// covers it, so the number is built of dense bright glyphs with sparse dim ones on its edges. It counts up with steps that shrink as
// it lands; under it a bar of characters fills to the same progress, then the label is typed. Light decays out by afterglow.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cw = ground.cw, ch = ground.ch;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, disp = brand.fonts.display.family;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const cols = Math.floor((SAFE.right - SAFE.left) / cw), rows = 15;
  const fx = SAFE.left + ((SAFE.right - SAFE.left) - cols * cw) / 2;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minScale: 0.8, where: 'the count label' });
  const barRow = 1, block = rows * ch + ch * (barRow + 1.5) + label.height;
  const fy = Math.round(kit.place(block, 640) / ch) * ch;
  const yBar = fy + rows * ch + ch * 0.9, yLabel = M.snap(yBar + ch * 1.2 + label.lead / 2, ch);
  const read = M.sampler(cols, rows, (g, w, h, str) => {
    let s = h * 1.12; g.font = `900 ${s}px "${disp}"`;
    const mw = g.measureText(str).width; if (mw > w * 0.94) { s *= (w * 0.94) / mw; g.font = `900 ${s}px "${disp}"`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText(str, w / 2, h * 0.54);
  });
  const layer = document.createElement('canvas'); layer.width = cols * cw + 40; layer.height = rows * ch + 40;
  const lg = layer.getContext('2d');
  const sLabel = M.screenText(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center' }, pal, T, pal.soft);
  const t0 = at + 0.1, t1 = at + 1.5, steps = 18;
  const tl = M.typing(sLabel.boxes, t1 + 0.15, T, 5), off = d - T.dur.out;
  let lastStr = null, dens = null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = M.decay(t, off, T.dur.tau);
      if (t >= t0 && fade > 0.01) {
        const raw = span(t, t0, t1), p = raw >= 1 ? 1 : Math.floor(M.E(raw) * steps) / steps;
        const str = text(countValue(0, S.value, p, (x) => x));
        if (str !== lastStr) { dens = read(str); lastStr = str; }
        lg.clearRect(0, 0, layer.width, layer.height);
        M.drawCells(lg, dens, cols, rows, 20, 20, cw, ch, mono, pal);
        const hotNow = raw >= 1 ? M.heat(t, t1, 0.3) : 0.4;
        ctx.save(); ctx.globalAlpha = fade * (0.55 + 0.4 * hotNow); ctx.filter = 'blur(9px)'; ctx.drawImage(layer, fx - 20, fy - 20); ctx.restore();
        ctx.save(); ctx.globalAlpha = fade; ctx.drawImage(layer, fx - 20, fy - 20); ctx.restore();
        kit.rec(fx, fx + cols * cw, fy + ch * 2, fy + rows * ch - ch * 2, str);
        // the bar of characters: [#########.......]
        const bs = Math.round(ch * 0.62), n = Math.floor((cols * cw) / (bs * 0.6)) - 2, k = Math.round(n * (raw >= 1 ? 1 : M.E(raw)));
        ctx.save(); ctx.globalAlpha = fade;
        M.charRow(ctx, '[' + '#'.repeat(k) + '.'.repeat(n - k) + ']', fx, yBar, bs, mono, raw >= 1 ? pal.phos : pal.dim);
        ctx.restore();
        kit.rec(fx, fx + cols * cw, yBar - 14, yBar + 14, 'bar', { decor: true });
      }
      sLabel.draw(ctx, (i) => (t >= tl.on[i] ? fade : 0), (i) => M.heat(t, tl.on[i], T.dur.heat));
      const kL = M.typedUpTo(tl.on, t);
      if (kL >= 0) M.cursor(ctx, pal, T, t, { x: M.cursorX(sLabel.boxes, kL, label, rtl, SAFE.left, SAFE.right), y: sLabel.boxes[kL].y, size: label.size, rtl, typingUntil: tl.end, alpha: t < off ? 1 : 0 });
    },
  };
}
