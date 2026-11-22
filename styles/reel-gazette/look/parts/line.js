// A line as a newspaper spinning into the lens: the front page of the brand's own gazette (its short name as the masthead between
// rules) whirls in from far away, turning twice, and stops dead, square to the camera; the headline is the line (the lead-in as a
// kicker above it), with columns of print below. When it has stopped, the key word (*…*) is tinted by hand in the accent, and the camera
// creeps in. Everything on the page moves on film frames and weaves with the gate. spec: { duration, at?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const PW = 900, tw = 780;
  const mast = kit.fit(brand.shortName || brand.name, { size: T.size.mast, weight: 900, maxW: 560, single: true, where: 'the masthead' });
  const head = kit.fit(spec.says.text, { size: T.size.head, weight: T.weight.head, maxW: tw, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: tw, single: true, where: 'the lead-in' }) : null;
  const mastH = 150, leadH = lead ? lead.lead + 6 : 0, printH = 170;
  const PH = 36 + mastH + leadH + head.height + 28 + printH + 36, cy = Math.min(760, SAFE.bottom - PH / 2 + 60), top = -PH / 2;
  const seed = Math.floor(clock * 10) + 3, dir = (Math.floor(clock) % 2) ? 1 : -1;
  const page = (ctx, tintP) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-PW / 2 + 14, top + 18, PW, PH);
    ctx.fillStyle = P.paper; ctx.fillRect(-PW / 2, top, PW, PH);
    let y = top + 36;
    ctx.fillStyle = P.dark; ctx.fillRect(-PW / 2 + 50, y, PW - 100, 6); ctx.fillRect(-PW / 2 + 50, y + 12, PW - 100, 2);
    kit.drawText(ctx, mast, { x0: -PW / 2, x1: PW / 2, y: y + mastH / 2 + 2, color: P.dark, key: P.dark });
    M.diamond(ctx, -mast.width / 2 - 40, y + mastH / 2, 10, P.accent); M.diamond(ctx, mast.width / 2 + 40, y + mastH / 2, 10, P.accent);
    ctx.fillStyle = P.dark; ctx.fillRect(-PW / 2 + 50, y + mastH - 18, PW - 100, 2); ctx.fillRect(-PW / 2 + 50, y + mastH - 10, PW - 100, 6);
    y += mastH;
    if (lead) { kit.drawText(ctx, lead, { x0: -tw / 2, x1: tw / 2, y: y + lead.lead / 2, color: P.dark, key: P.dark }); y += leadH; }
    M.inked(kit, ctx, head, { x0: -tw / 2, x1: tw / 2, y: y + head.lead / 2, color: P.dark, P, tintP, seed });
    y += head.height + 28;
    ctx.fillStyle = P.dark; ctx.fillRect(-PW / 2 + 50, y - 14, PW - 100, 2);
    M.print(ctx, -PW / 2 + 50, y + 6, PW - 100, printH - 10, 3, P.bar, seed);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.q(t), e = M.O(span(f, at, at + T.dur.spin));
      const s = (0.05 + 0.95 * e) * (1 + 0.03 * span(f, at + T.dur.spin, d)), rot = (1 - e) * Math.PI * 4 * dir;
      if (e > 0) {
        ctx.save(); ground.weave(ctx, t); ctx.translate(W / 2, cy); ctx.rotate(rot); ctx.scale(s, s);
        page(ctx, span(f, at + T.dur.spin + 0.1, at + T.dur.spin + 0.35));
        ctx.restore();
      }
      ground.over(ctx, t);
    },
  };
}
