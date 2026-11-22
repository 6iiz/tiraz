// A list: each item is its own strip card that glides in from the far side held up off the desk, and is laid down in its place
// (lift to 0, the shadow tightening) one per beat. Its index is printed on an accent tab at the reading side; a key phrase pops up as a
// chip. The voxel toy waits in the lane on the far side and hops down beside each card as it lands. The title is printed on a small
// label card above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, rr } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, toy = M.toy(brand, P);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const lane = 170, cx0 = rtl ? lane : T.card.x0, cx1 = rtl ? T.card.x1 : W - lane, tab = 64, pad = 34;
  const tx0 = rtl ? cx0 + pad : cx0 + pad + tab + 36, tx1 = rtl ? cx1 - pad - tab - 36 : cx1 - pad;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, minScale: 0.8, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: tx1 - tx0, minPx: 44, where: 'the list title' }) : null;
  const ch = (k) => rows[k].height + 34, gap = 26, titleH = title ? title.height + 40 : 0;
  const total = (title ? titleH + gap : 0) + items.reduce((s, _, k) => s + ch(k) + gap, -gap);
  const top = kit.place(total, 740), beat = Math.min(T.beat, (d - 1.2) / Math.max(1, items.length));
  const ys = []; { let y = top + (title ? titleH + gap : 0); items.forEach((_, k) => { ys.push(y); y += ch(k) + gap; }); }
  const land = (k) => at + 0.35 + k * beat, laneX = rtl ? lane / 2 + 6 : W - lane / 2 - 6;
  const stops = [{ t: 0, x: laneX, y: ys[0] - 10 }];
  items.forEach((_, k) => stops.push({ t: land(k) - 0.05, x: laneX, y: ys[k] + ch(k) + 10, height: 70 }));
  return {
    duration: d,
    draw(ctx, t) {
      ctx.save(); M.camera(ctx, W, H, t, at, rtl);
      ground.draw(ctx, t);
      if (title) {
        const tw = Math.min(cx1 - cx0, title.width + 2 * pad + 20), lx = rtl ? cx1 - tw : cx0;
        M.card(ctx, P, lx, top, tw, titleH, { r: 18, fill: P.paper });
        kit.drawText(ctx, title, { x0: lx + pad, x1: lx + tw - pad, y: top + 20 + title.lead / 2, align: 'start', color: P.grey });
      }
      items.forEach((_, k) => {
        const p = span(t, land(k) - 0.45, land(k)); if (p <= 0) return;
        const e = M.E(p), y = ys[k], h = ch(k), off = (1 - e) * (rtl ? -1 : 1) * (W + 200);
        ctx.save(); ctx.translate(off, -(1 - e) * 60);
        M.card(ctx, P, cx0, y, cx1 - cx0, h, { r: 22, lift: 1 - e });
        const ix = rtl ? cx1 - pad - tab : cx0 + pad;
        ctx.fillStyle = P.chipEdge; rr(ctx, ix, y + h / 2 - tab / 2 + 6, tab, tab, 12); ctx.fill();
        ctx.fillStyle = P.accent; rr(ctx, ix, y + h / 2 - tab / 2, tab, tab, 12); ctx.fill();
        ctx.font = `800 34px "${mono}"`; ctx.fillStyle = P.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), ix + tab / 2, y + h / 2 + 2);
        kit.rec(ix, ix + tab, y + h / 2 - 20, y + h / 2 + 20, String(k + 1), { decor: true });
        const ym = y + 17 + rows[k].lead / 2, spans = M.keySpans(rows[k], tx0, tx1, ym, 'start', rtl);
        const pc = span(t, land(k) + 0.05, land(k) + 0.35); let lift = 0;
        for (const s of spans) lift = M.chip(ctx, P, s, rows[k].size, pc, 0, rows[k].space) || lift;
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.ink, key: P.onAccent,
          each: (w, i, box, c) => { if (!w.key) return; if (pc <= 0) return P.ink; c.translate(0, -lift); } });
        ctx.restore();
      });
      const tr = M.track(stops, t, 0.26);
      M.ring(ctx, P, tr.x, tr.y, tr.landed);
      M.drawToy(ctx, toy, tr.x, tr.y, { air: tr.air, sq: tr.sq, e: span(t, at, at + 0.3), time: t + clock, scale: 0.85, flip: !rtl });
      ctx.restore();
    },
  };
}
