// A list on the tactics board: the broadcast picture is flattened into a top-down board of the same moment (the board unfolds up
// from the bottom while the picture behind it dims). Each item lands on its own card at the top with a numbered accent chip, and the
// same number is pinned, with a marker ring, on a player of the board. Key words take the marker's colour and underline.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, field = ground.field, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const chipW = 64, pad = 26, x0 = rtl ? SAFE.left + pad : SAFE.left + chipW + pad, x1 = rtl ? SAFE.right - chipW - pad : SAFE.right - pad;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left - 60, minScale: 0.94, where: 'the list title' }) : null;
  const rowH = rows[0].size * 1.75, gapR = 12, titleH = title ? title.height + 30 : 0;
  const top = 300, ys = items.map((_, k) => top + titleH + k * (rowH + gapR));
  const runsK = rows.map((f, k) => M.runs(M.boxes(kit, f, { x0, x1, y: ys[k] + rowH / 2, align: 'start' })));
  // the board: half a pitch seen from above, under the cards
  const bTop = Math.max(ys.at(-1) + rowH + 50, 960), bH = H - bTop - 60, sc = Math.min((SAFE.right - SAFE.left) / 68, bH / 40), bx = W / 2, by = bTop + bH;
  const toB = (x, z) => [bx + x * sc, by - z * sc];
  const order = ['A2', 'A1', 'A3', 'A4', 'A5'];
  const beat = 0.4, t0 = (k) => at + 0.35 + k * beat;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      M.view(ctx, W, H, field, 1.25, { pan: -50, zoom: 1.06, fx: W / 2, fy: 1150, P });
      const fl = M.E(span(t, at - 0.1, at + 0.4));
      ctx.fillStyle = rgba(P.dark, 0.55 * fl); ctx.fillRect(0, 0, W, H);
      // the board unfolds up from its near line
      if (fl > 0) {
        ctx.save(); ctx.translate(0, by); ctx.scale(1, fl); ctx.translate(0, -by);
        ctx.fillStyle = P.turf; ctx.fillRect(toB(-34, 0)[0], toB(0, 40)[1], 68 * sc, 40 * sc);
        for (let i = 0; i < 8; i += 2) { ctx.fillStyle = P.turf2; ctx.fillRect(toB(-34, 0)[0], toB(0, (i + 1) * 5)[1], 68 * sc, 5 * sc); }
        ctx.strokeStyle = P.line; ctx.lineWidth = 3;
        ctx.strokeRect(toB(-34, 0)[0], toB(0, 40)[1], 68 * sc, 40 * sc);
        ctx.strokeRect(toB(-20.16, 0)[0], toB(0, 16.5)[1], 40.32 * sc, 16.5 * sc); ctx.strokeRect(toB(-9.16, 0)[0], toB(0, 5.5)[1], 18.32 * sc, 5.5 * sc);
        ctx.beginPath(); ctx.arc(bx, by - 11 * sc, 9.15 * sc, Math.PI + 0.93, -0.93); ctx.stroke();
        const pl = M.play(1.25);
        for (const [id, p] of Object.entries(pl)) {
          if (id === 'ball') continue;
          const [sx, sy] = toB(p.x, p.z); if (sy < toB(0, 40)[1]) continue;
          ctx.fillStyle = p.team === 'A' ? P.teamA : P.teamB; ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = p.team === 'A' ? P.dark : P.line; ctx.lineWidth = 2.5; ctx.stroke();
        }
        ctx.restore();
      }
      if (title) {
        const off = M.card(ctx, SAFE.left, top, SAFE.right - SAFE.left, title.height + 10, span(t, at, at + T.dur.card), out, P, rtl, 0);
        ctx.save(); ctx.translate(off, 0);
        kit.drawText(ctx, title, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: top + 5 + title.lead / 2, align: 'start', color: P.grey, key: P.key,
          each: (w, i, box, c) => { const s0 = at + 0.05 + i * T.dur.stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), out, title.size, rtl) === false) return false; } });
        ctx.restore();
      }
      rows.forEach((f, k) => {
        const s0 = t0(k), y = ys[k], ym = y + rowH / 2;
        const off = M.card(ctx, SAFE.left, y, SAFE.right - SAFE.left, rowH, span(t, s0 - 0.12, s0 + 0.12), out, P, rtl, 0);
        ctx.save(); ctx.translate(off, 0);
        if (span(t, s0 - 0.12, s0 + 0.12) > 0 && out < 1) {
          const cx = rtl ? SAFE.right - chipW : SAFE.left; ctx.fillStyle = P.accent; ctx.fillRect(cx, y, chipW, rowH);
          ctx.font = `700 34px "${mono}"`; ctx.fillStyle = P.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(String(k + 1), cx + chipW / 2, ym + 1);
          kit.rec(cx, cx + chipW, ym - 20, ym + 20, String(k + 1), { decor: true });
        }
        kit.drawText(ctx, f, { x0, x1, y: ym, align: 'start', color: P.light, key: P.key,
          each: (w, i, box, c) => { const w0 = s0 + i * 0.03; if (M.slide(c, span(t, w0, w0 + T.dur.in), out, f.size, rtl) === false) return false; } });
        runsK[k].forEach((r, j) => {
          const yy = r.y + f.size * 0.6, a = rtl ? r.x + r.width + 4 : r.x - 4, b = rtl ? r.x - 4 : r.x + r.width + 4;
          M.pen(ctx, [[a, yy], [(a + b) / 2, yy + 3], [b, yy + 5]], span(t, s0 + 0.15, s0 + 0.4), P.pen, 6, 31 + j);
        });
        ctx.restore();
        // the same number pinned on the board
        const id = order[k], pp = M.play(1.25)[id], [sx, sy] = toB(pp.x, pp.z), pin = span(t, s0 + 0.05, s0 + 0.3) * keep * (fl >= 1 ? 1 : 0);
        if (pin > 0) {
          ctx.save(); ctx.globalAlpha = keep;
          M.pen(ctx, Array.from({ length: 30 }, (_, i) => { const u = -Math.PI / 2 + i / 29 * Math.PI * 2.1; return [sx + Math.cos(u) * 30, sy + Math.sin(u) * 30]; }), pin, P.pen, 6, 41 + k);
          if (pin >= 1) {
            ctx.fillStyle = P.accent; ctx.fillRect(sx + 22, sy - 62, 38, 38);
            ctx.font = `700 26px "${mono}"`; ctx.fillStyle = P.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(String(k + 1), sx + 41, sy - 42);
          }
          ctx.restore();
        }
      });
      M.chip(ctx, 'freeze', 1.25 * T.fps + 3120, P, mono, rtl);
      void mix;
    },
  };
}
