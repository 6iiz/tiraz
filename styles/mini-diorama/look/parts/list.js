// A list: a café menu on the wall. A header plate, then one plate per item, all the same width, each hung on its own nail;
// the plates let go one per beat and knock into place. Each plate carries its number in the mono face at its far end.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 + Math.round(clock) });
  const rg = R3.region, tn = R3.tn, pad = 2 * T.sign.padX, idxW = 70, rtl = R3.rtl;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: rg.w - pad - 40, single: true, lead: 1.3, where: 'the list title' }) : null;
  const fit = kit.fitAll(items, { size: T.size.item, weight: 700, maxW: rg.w - pad - idxW, single: true, lead: 1.3, where: 'a list item' });
  const w = Math.min(rg.w, Math.max(...fit.map((f) => f.width)) + pad + idxW + 40), h = Math.round(fit[0].lead + fit[0].size * 0.5);
  const bt = title ? R3.boardSize(title) : null;
  const ys = R3.stack([...(title ? [bt.h] : []), ...items.map(() => h)], T.layout.centre, items.length > 4 ? 10 : 14);
  const plain = (f) => f.rows.map((r) => r.words.map((x) => x.w).join(' ')).join(' ');
  const signs = [];
  if (title) signs.push({ s: R3.sign({ cx: rg.cx, cy: ys[0], wpx: bt.w, hpx: bt.h, depth: 12, paint: R3.textPaint(title, {}), text: plain(title) }), t0: at });
  fit.forEach((f, k) => {
    const n = String(k + 1).padStart(2, '0');
    const paint = (g, ww, hh) => {
      const inner = R3.textPaint(f, { align: 'start' });
      inner(g, ww, hh);
      // the number at the far end of the plate, on a little tab
      const x = rtl ? T.sign.padX - 6 : ww - T.sign.padX - idxW + 6;
      g.fillStyle = tn.ink; g.fillRect(x, 14, idxW - 12, hh - 28);
      g.font = `700 ${T.size.index}px "${mono}"`; g.fillStyle = tn.board; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr';
      g.fillText(n, x + (idxW - 12) / 2, hh / 2 + 1);
    };
    signs.push({ s: R3.sign({ cx: rg.cx, cy: ys[(title ? 1 : 0) + k], wpx: w, hpx: h, paint, text: plain(f) }), t0: at + 0.3 + k * T.dur.beat });
  });
  return {
    duration: d,
    draw(ctx, t) {
      signs.forEach(({ s, t0 }) => s.pose(t, t0));
      R3.draw(ctx, t);
      signs.forEach(({ s }) => s.rec());
    },
  };
}
