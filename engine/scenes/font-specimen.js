// font-specimen.js · a few font families per frame, each with its name in Latin and the sample line in that family.
//   index.html?scene=/engine/scenes/font-specimen.js&brand=/engine/tool-brand.json&page=0[&per=6][&families=Cairo,Amiri][&sabotage=1]
// Families come from /assets/fonts/index.json. `page` picks the slice of `per` families; `families` names them instead.
// Proof that a family really rendered in its own font and not in a fallback: every family is loaded under a private alias, and then
//   1. each FontFace must report "loaded", 2. document.fonts.check must be true, 3. the drawn shapes of the Arabic part (and the Latin part, when the family
//   has Latin) must differ from what the browser's default font draws for the same text, compared pixel by pixel (widths alone can match by chance).
//   Widths and the share of pixels that differ are printed on the card; a family that fails is outlined
//   in the warning colour and reported with console.error, which the renderer turns into a failed run that names it.
// &sabotage=1 skips loading the first family on purpose, so the test can show that the check does catch a fallback.
// The picture does not change with t, so one frame (--at 0) is the whole sheet.
import { mix } from '../brand.js';
import { rr } from '../lib/base.js';

// This page is a tool, not a look: its greys and its warning colour are plain mixes of the brand's own colours, not a design.
const tones = (c) => ({ ...c, muted: mix(c.text, c.bg, 0.35), panel: mix(c.bg, c.text, 0.06), warn: '#E5484D' });

export const duration = 1;
let B, cards = [], head = '';
const ARABIC_PART = 'أَبجد هوَّز حُطّي', LATIN_PART = 'Tiraz';

const clampWeight = (w, [lo, hi]) => Math.min(hi, Math.max(lo, w));
const width = (ctx, font, text) => { ctx.font = font; ctx.direction = 'rtl'; return ctx.measureText(text).width; };
// ink(): the text drawn in black on white at 64px; difference(): the share of inked pixels that are not inked the same way in the other drawing
function ink(ctx, font, text) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 700, 150); ctx.fillStyle = '#000'; ctx.font = font; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 680, 100); return ctx.getImageData(0, 0, 700, 150).data;
}
function difference(a, b) {
  let diff = 0, inked = 0;
  for (let i = 0; i < a.length; i += 4) { const x = a[i] < 128, y = b[i] < 128; if (x || y) inked++; if (x !== y) diff++; }
  return diff / Math.max(1, inked);
}

export async function init({ brand, query }) {
  if (!brand) throw new Error('font-specimen.js needs a brand: pass &brand=/engine/tool-brand.json');
  // &bg= &fg= &accent= (six hex digits each, no #) show the families on a customer's own colours instead of the tool's
  const hex = (k) => (/^[0-9a-f]{6}$/i.test(query.get(k) || '') ? '#' + query.get(k) : null);
  B = { ...brand, colors: { ...brand.colors, bg: hex('bg') || brand.colors.bg, text: hex('fg') || brand.colors.text, accent: hex('accent') || brand.colors.accent } };
  const res = await fetch('/assets/fonts/index.json');
  if (!res.ok) throw new Error('the font index is missing: run  python tools/assets.py reindex');
  const index = await res.json(), all = index.families, line = query.get('text') || index.sample;   // &text= shows a line of your own in each family
  let pick;
  if (query.get('families')) {
    pick = query.get('families').split(',').map((n) => {
      const f = all.find((x) => x.family.toLowerCase() === n.trim().toLowerCase());
      if (!f) throw new Error(`no font family called "${n}" in assets/fonts/index.json`);
      return f;
    });
  } else {
    const per = Number(query.get('per')) || 6, page = Number(query.get('page')) || 0;
    pick = all.slice(page * per, page * per + per);
    if (!pick.length) throw new Error(`page ${page} is empty: there are ${all.length} families, ${per} per page`);
    head = `fonts ${page * per + 1}–${page * per + pick.length} of ${all.length}`;
  }
  const probe = Object.assign(document.createElement('canvas'), { width: 700, height: 150 }).getContext('2d', { willReadFrequently: true }), failures = [];
  cards = [];
  for (const [i, f] of pick.entries()) {
    // &weight= draws the line at that weight where the family has it (a family that stops lighter is drawn at its heaviest, and the card says so)
    const alias = `specimen-${f.folder.replace(/\W+/g, '')}`, weight = clampWeight(Number(query.get('weight')) || 700, f.weightRange), faces = [];
    if (!(query.get('sabotage') === '1' && i === 0)) {
      for (const file of f.files.filter((x) => x.style === 'normal')) {
        const [lo, hi] = file.weight, url = `/assets/fonts/${f.folder}/${file.file}`;
        const face = new FontFace(alias, `url("${encodeURI(url)}")`, { weight: lo === hi ? String(lo) : `${lo} ${hi}` });
        try { await face.load(); } catch { throw new Error(`font file did not load: ${url}`); }
        document.fonts.add(face); faces.push(face);
      }
    }
    const spec = `${weight} 64px "${alias}"`, ref = `${weight} 64px "no-such-family-for-the-fallback-width"`;
    const ownAr = width(probe, spec, ARABIC_PART), refAr = width(probe, ref, ARABIC_PART);
    const ownLa = width(probe, spec, LATIN_PART), refLa = width(probe, ref, LATIN_PART);
    const dAr = difference(ink(probe, spec, ARABIC_PART), ink(probe, ref, ARABIC_PART));
    const dLa = f.latin ? difference(ink(probe, spec, LATIN_PART), ink(probe, ref, LATIN_PART)) : 1;
    const checks = {
      loaded: faces.length > 0 && faces.every((x) => x.status === 'loaded'),
      check: document.fonts.check(spec, line),
      arabicShapes: !f.arabic || dAr > 0.2,       // a family with no Arabic glyphs (the mono face) is only checked for its Latin
      latinShapes: dLa > 0.2,
    };
    const ok = Object.values(checks).every(Boolean);
    if (!ok) failures.push(`${f.family} (${Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(', ')})`);
    cards.push({ f, alias, weight, line, ok, ownAr: Math.round(ownAr), refAr: Math.round(refAr), ownLa: Math.round(ownLa), refLa: Math.round(refLa), dAr: Math.round(dAr * 100), dLa: Math.round(dLa * 100) });
  }
  if (failures.length) console.error('font-specimen: did not render in its own font: ' + failures.join('; '));
}

export function draw(ctx, t, { W, H }) {
  const c = tones(B.colors), mono = B.fonts.mono.family;
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
  if (head) { ctx.font = `500 30px "${mono}"`; ctx.fillStyle = c.muted; ctx.fillText(head, W / 2, 96); }
  const top = 140, gap = 16, ch = (H - top - 120 - gap * (cards.length - 1)) / cards.length, x0 = 50, w = W - 100;
  cards.forEach((k, i) => {
    const y = top + i * (ch + gap), f = k.f;
    ctx.fillStyle = c.panel; rr(ctx, x0, y, w, ch, 24); ctx.fill();
    if (!k.ok) { ctx.strokeStyle = c.warn; ctx.lineWidth = 4; rr(ctx, x0, y, w, ch, 24); ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.direction = 'ltr';
    ctx.font = `600 30px "${mono}"`; ctx.fillStyle = c.accent; ctx.fillText(f.family, x0 + 28, y + 50);
    ctx.font = `400 19px "${mono}"`; ctx.fillStyle = c.muted;
    const range = f.weightRange[0] === f.weightRange[1] ? `${f.weightRange[0]}` : `${f.weightRange[0]}–${f.weightRange[1]}`;
    ctx.fillText(`${f.category} · weights ${range} · shown at ${k.weight}${f.latin ? '' : ' · no latin'}`, x0 + 28, y + 80);
    ctx.textAlign = 'right';
    ctx.fillStyle = k.ok ? c.muted : c.warn;
    ctx.fillText(k.ok ? `ar ${k.ownAr}px vs ${k.refAr}px fallback · ${k.dAr}% shapes differ` : 'FALLBACK, not its own font', x0 + w - 28, y + 50);
    if (f.latin) ctx.fillText(`en ${k.ownLa}px vs ${k.refLa}px · ${k.dLa}% differ`, x0 + w - 28, y + 80);
    // the sample line, shrunk until it fits the card
    let size = 84; const font = (s) => `${k.weight} ${s}px "${k.alias}"`;
    ctx.direction = 'rtl'; ctx.font = font(size);
    while (ctx.measureText(k.line).width > w - 80 && size > 30) { size -= 2; ctx.font = font(size); }
    ctx.textAlign = 'center'; ctx.fillStyle = c.text; ctx.fillText(k.line, W / 2, y + ch - (ch - 100) / 2 + 6);
  });
}
