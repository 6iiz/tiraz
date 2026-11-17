// identity-card.js · a data sheet that lets a person check a brand file before any look exists. One still frame (duration 1).
//   index.html?scene=/engine/scenes/identity-card.js&brand=/brand/brand.json[&sample=<a line of Arabic>]
// Shows: the name in the display font, a sample line in the text font, every colour with its name and hex, the contrast of text and of accent
// on bg, the logo large and small, the slogan and the handle when the brand has them. Plain left to right, on the brand's bg, labels in the mono font.
// Not a look: it decorates nothing and moves nothing.
import { font, mix, contrast, SAFE } from '../kit.js';

// Arabic with digits and a separator, in the one digit system the brand uses (brand.digits): a view never mixes the two systems
const SAMPLE = { latin: 'نص تجريبي 123 و 4,567', arabic: 'نص تجريبي ١٢٣ و ٤٬٥٦٧' };

export async function create({ W, H, brand, query, kit }) {
  if (!brand) throw new Error('identity-card.js needs a brand: pass &brand=/brand/brand.json');
  const c = brand.colors, mono = brand.fonts.mono.family, left = 60, right = W - 60;
  const dim = mix(c.text, c.bg, 0.45), start = brand.dir === 'rtl' ? 'end' : 'start';   // 'start' of drawText is the reading side; the sheet always sits at the left
  const name = kit.fit(brand.name, { size: 120, maxW: right - left, single: true, where: 'the brand name' });
  const ownText = brand.fonts.text !== brand.fonts.display;                             // with no fonts.text, the display font is used for text too
  const sample = kit.fit(query.get('sample') || SAMPLE[brand.digits === 'arabic' ? 'arabic' : 'latin'], { family: brand.fonts.text.family, size: 56, maxW: right - left, single: true, where: 'the sample line' });
  const slogan = brand.slogan ? brand.slogan.map((s) => kit.fit(s, { size: 64, maxW: right - left, single: true, where: 'the slogan' })) : [];

  return {
    duration: 1,
    draw(ctx) {
      ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      let y = SAFE.top - 160;
      const label = (text, yy, xx = left, color = dim) => { ctx.save(); ctx.font = font(500, 26, mono); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(text, xx, yy); ctx.restore(); };

      label('name · fonts.display', y); y += 20;
      kit.drawText(ctx, name, { x0: left, x1: right, y: y + name.lead / 2, align: start }); y += name.height + 50;

      label(ownText ? 'sample · fonts.text' : 'sample · fonts.display (the brand gives no fonts.text)', y); y += 20;
      kit.drawText(ctx, sample, { x0: left, x1: right, y: y + sample.lead / 2, align: start }); y += sample.height + 60;

      label('colors', y); y += 24;
      const cols = 4, cell = (right - left) / cols, sw = 150;
      Object.entries(c).forEach(([k, hex], i) => {
        const x = left + (i % cols) * cell, yy = y + Math.floor(i / cols) * (sw + 90);
        ctx.fillStyle = hex; ctx.fillRect(x, yy, sw + 40, sw);
        ctx.strokeStyle = dim; ctx.lineWidth = 2; ctx.strokeRect(x, yy, sw + 40, sw);   // an outline, so a swatch equal to bg is still seen
        label(k, yy + sw + 32, x, c.text); label(hex.toUpperCase(), yy + sw + 64, x);
      });
      y += Math.ceil(Object.keys(c).length / cols) * (sw + 90) + 50;

      label('contrast (WCAG ratio, 4.5 reads small text, 3 reads large)', y); y += 52;
      for (const [what, fg] of [['text on bg', c.text], ['accent on bg', c.accent]]) {
        ctx.save(); ctx.font = font(500, 44, mono); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = c.text;
        ctx.fillText(`${what}  ${contrast(fg, c.bg).toFixed(2)} : 1`, left, y); ctx.restore(); y += 62;
      }
      y += 30;

      label('logo · large, small', y); y += 30;
      brand.logo.draw(ctx, left, y, 300, c.text);
      brand.logo.small(ctx, left + 360, y + 300 - 64, 64, c.text);
      y += 300 + 70;

      if (slogan.length) {
        label('slogan', y); y += 20;
        for (const s of slogan) { kit.drawText(ctx, s, { x0: left, x1: right, y: y + s.lead / 2, align: start }); y += s.height; }
        y += 40;
      }
      if (brand.handle) { label(`handle · platform ${brand.platform}`, y); y += 56; ctx.save(); ctx.font = font(500, 44, mono); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.fillStyle = c.text; ctx.fillText(brand.handle, left, y); ctx.restore(); }
    },
  };
}
