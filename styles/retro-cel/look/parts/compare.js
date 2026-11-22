// Before and after as a tape fault and a light coming on. The old value slides in as a plain cel; then the tape catches: for a few
// drawings it tears into sideways-slipping strips, and what is left is a faded, paused picture with a tracking bar across it. The new
// value slides in below in backlit cel lettering and a star glint lands on it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rng, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: maxW - 60, where: 'a compared value' });
  // the new value is the key: every word of it is lit from behind
  now.rows.forEach((r) => r.words.forEach((w) => { w.key = true; }));
  was.rows.forEach((r) => r.words.forEach((w) => { w.key = false; }));
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 90, minScale: 0.9, where: 'the compare label' }) : null;
  const lw = label ? label.width + 90 : 0, lh = label ? label.height + 22 : 0, ly = 330, lx = rtl ? X1 - lw + 20 : X0 - 20;
  const yWas = (label ? ly + lh : 330) + 60 + was.height / 2, yNow = yWas + was.height / 2 + 110 + now.lead / 2;
  const cutT = at + 0.85, nowT = at + 1.3;
  // the old value as a still picture, for the tape fault
  const still = document.createElement('canvas'); still.width = W; still.height = H;
  M.cel(kit, still.getContext('2d'), was, { x0: X0, x1: X1, y: yWas - was.height / 2 + was.lead / 2, align: 'center', P, rtl });
  const r = rng(55), strips = Array.from({ length: 9 }, () => ({ h: 10 + r() * 40, k: r() }));
  const y0 = yWas - was.height / 2 - 40, hh = was.height + 80;
  let keyBox = null;
  return {
    duration: d,
    draw(ctx, t) {
      const th = M.held(t);
      ground.draw(ctx, t);
      if (label) {
        M.bar(ctx, lx, ly, lw, lh, P, span(th, at, at + 0.17));
        M.cel(kit, ctx, label, { x0: lx + 45, x1: lx + lw - 45, y: ly + 11 + label.lead / 2, align: 'start', P, rtl, at: () => span(th, at + 0.08, at + 0.08 + T.dur.slide) });
      }
      if (th < cutT) {
        M.cel(kit, ctx, was, { x0: X0, x1: X1, y: yWas - was.height / 2 + was.lead / 2, align: 'center', P, rtl, at: () => span(th, at + 0.25, at + 0.25 + T.dur.slide) });
      } else {
        const g = span(th, cutT, cutT + 0.34), fault = g < 1;
        ctx.save(); ctx.globalAlpha = fault ? 1 : 0.38;
        if (fault) {                                                  // the strips slip sideways, a new tear every drawing
          const f = Math.floor((th - cutT) * 12), rr = rng(900 + f);
          let y = y0;
          for (const s of strips) {
            const h = s.h * (hh / 250), dx = (rr() - 0.5) * 160 * (0.4 + g);
            ctx.drawImage(still, 0, y, W, h, dx, y, W, h); y += h;
          }
          ctx.drawImage(still, 0, y, W, y0 + hh - y, (rr() - 0.5) * 60, y, W, y0 + hh - y);
        } else ctx.drawImage(still, 0, y0, W, hh, 0, y0, W, hh);
        ctx.restore();
        kit.rec(W / 2 - was.width / 2, W / 2 + was.width / 2, yWas - was.height / 2, yWas + was.height / 2, String(S.was), {});
        // the tracking bar that stays across the paused picture
        const ty = yWas + was.height * 0.05, bw = Math.min(1, g * 1.5);
        ctx.fillStyle = rgba(P.light, 0.22); ctx.fillRect(0, ty - 14, W * bw, 28);
        ctx.fillStyle = rgba(P.night, 0.5); ctx.fillRect(0, ty - 3, W * bw, 6);
      }
      keyBox = null;
      M.cel(kit, ctx, now, { x0: X0, x1: X1, y: yNow - now.height / 2 + now.lead / 2, align: 'center', P, rtl,
        at: () => span(th, nowT, nowT + T.dur.slide), onKey: (b, dx) => { if (!keyBox) keyBox = { x: b.x + dx, y: b.y, w: b.width }; } });
      if (keyBox && th >= nowT + T.dur.slide) {
        const cyc = (th - nowT - T.dur.slide) % 1.4;
        M.glint(ctx, rtl ? keyBox.x + keyBox.w * 0.05 : keyBox.x + keyBox.w * 0.95, keyBox.y - now.size * 0.42, now.size * 0.5, cyc / 0.5, P.light);
      }
      ground.over(ctx, t);
    },
  };
}
