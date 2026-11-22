// A line as the game's shouted command: speed lines race across the screen, and the whole line slams in at once on a card tilted a
// few degrees (too big, a small undershoot, settled in about a fifth of a second). The lead-in rides on a dark tag above it; the key
// word (*…*) sits on a spiky burst of the accent. The fuse burns under the screen. At the end the card shrinks away into the screen's
// corner like a used command. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, TV = ground.TV, rtl = kit.rtl;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: 790, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: 760, minPx: 44, where: 'the lead-in' }) : null;
  const cw = Math.min(900, line.width + 110), ch = line.height + 70, lw = lead ? lead.width + 64 : 0, lh = lead ? lead.height + 22 : 0;
  const cx = W / 2, cy = (spec.y ?? 700) + (lead ? lh * 0.4 : 0), tilt = -T.tilt * Math.PI / 180;
  const tagY = cy - ch / 2 - lh + 16, tagX = rtl ? cx + cw / 2 - lw - 20 : cx - cw / 2 + 20;
  const tx = { x0: cx - cw / 2 + 55, x1: cx + cw / 2 - 55, y: cy - line.height / 2 + line.lead / 2, align: 'start' }, keys = M.keyBoxes(kit, line, tx);
  const corner = { x: rtl ? TV.x + TV.w - 120 : TV.x + 120, y: TV.y + 90 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ground.screen(ctx, (c) => {
        c.fillStyle = P.tint; c.fillRect(TV.x, TV.y, TV.w, TV.h);
        c.fillStyle = P.tint2; const off = ((t + clock) * 900 * ground.speed) % 160;          // speed lines
        for (let k = -2; k < 10; k++) { const y = TV.y + 40 + k * 110, x = (rtl ? -off : off) + (k % 3) * 120 - 200; c.beginPath(); c.roundRect(x, y, 520 + (k % 2) * 260, 26, 13); c.fill(); }
      });
      ground.fuse(ctx, t, d, at);
      const s = M.slam(span(t, at, at + 0.22)), q = M.in2(span(t, d - 0.34, d - 0.04));
      if (s <= 0 || q >= 1) return;
      ctx.save();
      ctx.translate(cx + (corner.x - cx) * q, cy + (corner.y - cy) * q); ctx.rotate(tilt * (1 - q * 2)); ctx.scale(s * (1 - 0.82 * q), s * (1 - 0.82 * q)); ctx.translate(-cx, -cy);
      M.toon(ctx, M.rect(cx - cw / 2, cy - ch / 2, cw, ch, 22), P.l, P);
      if (lead) {
        M.toon(ctx, M.rect(tagX, tagY, lw, lh, lh / 2 > 40 ? 30 : lh / 2), P.d, P, 8, 6);
        kit.drawText(ctx, lead, { x0: tagX + 32, x1: tagX + lw - 32, y: tagY + 11 + lead.lead / 2, align: 'start', color: P.l, key: P.l });
      }
      keys.forEach((b) => M.burst(ctx, b, line.size, P, b.i * 0.7 + (t + clock) * 0.8));
      kit.drawText(ctx, line, { ...tx, color: P.d, key: P.onA });
      ctx.restore();
    },
  };
}
