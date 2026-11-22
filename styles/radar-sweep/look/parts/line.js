// A line found by the scope: a ping leaves the centre and every word exists from the moment the ring reaches it, arriving as a bright
// return that settles to a steady echo. The key phrase (*…*, one or several words) is the one warm contact: set in the accent, with a
// lock closing on it. The scope is calmed behind the text by a feathered dark band. spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
//   cut: stays until the joint's sweep takes it.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const dist = (p) => Math.hypot(p.x - ground.cx, p.y - ground.cy);
  const dLead = lead ? M.wordCentres(lead, { x0, x1, y: yLead, rtl }).map(dist) : [];
  const dLine = M.wordCentres(line, { x0, x1, y: yLine, rtl }).map(dist);
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'start', rtl });
  const far = Math.max(...dLead, ...dLine);
  // a hook (at < 0) pings faster so that every word is found and the lock closed by the first frame
  const speed = at < 0 ? Math.max(T.dur.speed, far / Math.max(0.2, -at - 0.15 - T.dur.lock - 0.1)) : T.dur.speed;
  const t0 = at + 0.03, out0 = spec.cut ? Infinity : d - T.dur.out;
  const quiet = [{ y0: top - 10, y1: top + block + 10 }];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, quiet);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t0, speed), far + 300);
      const fade = 1 - span(t, out0, out0 + T.dur.out);
      runs.forEach((r) => {
        const hit = t0 + Math.max(...dLine.slice(r.i0, r.i1 + 1)) / speed;
        const px = r.size * 0.04, h = r.size * 1.1;
        if (fade > 0) M.lock(ctx, pal, r.x - px, r.y - h / 2, r.w + px * 2, h, span(t, hit + 0.05, hit + 0.05 + T.dur.lock) * fade);
      });
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.soft,
        each: (w, i, b, c) => M.echo(c, M.ret(t, t0, speed, dLead[i]), pal.soft, pal, fade) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.echo, key: pal.target,
        each: (w, i, b, c) => M.echo(c, M.ret(t, t0, speed, dLine[i]), w.key ? pal.target : pal.echo, pal, fade) });
    },
  };
}
