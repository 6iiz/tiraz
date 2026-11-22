// Before and after as an equipment swap: the old value sits in the window, a pixel bar strikes through it in four steps and it greys
// out; a down arrow hops; the new value drops into its row on the accent block with an "up" arrow beside it and two twinkling stars.
// The label is the small window above. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, u = M.PX;
  const wx = 72, ww = 936, pad = 9 * u, icon = 11 * u, inner = ww - 2 * pad - icon;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: inner, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: ww - 2 * pad, minPx: 44, where: 'the compare label' }) : null;
  const th = label ? M.snap(label.height + 8 * u) : 0, gap = label ? 3 * u : 0, mid = 12 * u;
  const h = M.snap(2 * pad + was.height + mid + now.height), top = M.snap(kit.place(th + gap + h, 720)), mt = top + th + gap;
  const tw = label ? M.snap(Math.min(ww, label.width + 2 * pad + 4 * u)) : 0, tx = rtl ? wx + ww - tw : wx;
  const yWas = mt + pad + was.lead / 2, yArrow = mt + pad + was.height + mid / 2, yNow = mt + pad + was.height + mid + now.lead / 2;
  const x0 = rtl ? wx + pad + icon : wx + pad, x1 = rtl ? wx + ww - pad : wx + ww - pad - icon;
  const tWas = at + 0.3, tCut = at + 0.85, tNow = at + 1.4, tClear = d - 0.3;
  const edge = (f) => (rtl ? x1 - f.rows[0].width : x0 + f.rows[0].width);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const close = 1 - M.stepped(span(t, d - 0.26, d - 0.04), 3);
      if (label) { const o = M.stepped(span(t, at, at + 0.24)) * close;
        if (M.win(ctx, tx, top, tw, th, P, o) && o >= 1 && t < tClear)
          kit.drawText(ctx, label, { x0: tx + pad, x1: tx + tw - pad, y: top + th / 2 - (label.rows.length - 1) * label.lead / 2, align: 'start', color: P.lead, key: P.lead }); }
      const o = M.stepped(span(t, at + 0.12, at + 0.36)) * close;
      if (!M.win(ctx, wx, mt, ww, h, P, o) || o < 1 || t >= tClear) return;
      if (t >= tWas) {
        const cut = M.stepped(span(t, tCut, tCut + 0.3)), grey = t >= tCut;
        kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: grey ? P.grey : P.l, key: grey ? P.grey : P.l });
        if (cut > 0) { const wv = (was.width + 4 * u) * cut, xa = rtl ? x1 + 2 * u - wv : x0 - 2 * u;
          ctx.fillStyle = P.lead; ctx.fillRect(M.snap(xa), M.snap(yWas), M.snap(wv), u); }
      }
      if (t >= tCut + 0.3) M.sprite(ctx, M.ARROW_DOWN, M.snap((x0 + x1) / 2 - 3.5 * u), M.snap(yArrow - 2 * u) + (Math.floor(t * 4) % 2) * u, { o: P.lead }, u);
      if (t >= tNow) {
        const drop = t < tNow + 0.1 ? -2 * u : 0;
        now.rows.forEach((r, k) => { const l = rtl ? x1 - r.width : x0, y = yNow + drop + k * now.lead;
          M.block(ctx, l - 3 * u, y - now.size * 0.62, l + r.width + 3 * u, y + now.size * 0.62, P.a); });
        kit.drawText(ctx, now, { x0, x1, y: yNow + drop, align: 'start', color: P.onA, key: P.onA });
        const ix = rtl ? edge(now) - 14 * u : edge(now) + 7 * u;
        M.sprite(ctx, M.ARROW_UP, M.snap(ix), M.snap(yNow - 3 * u) - (Math.floor(t * 3) % 2) * u, { o: P.a }, u);
        if (t < tNow + 1.4) { const k = Math.floor((t - tNow) * 6), e = edge(now);
          M.sprite(ctx, M.STAR[k % 2], M.snap(rtl ? e - 7 * u : e + 2 * u), M.snap(yNow - now.size * 0.75), { o: P.lead }, u);
          M.sprite(ctx, M.STAR[(k + 1) % 2], M.snap(rtl ? e - 3 * u : e - 2 * u), M.snap(yNow + now.size * 0.35), { o: P.lead }, u); }
      }
    },
  };
}
