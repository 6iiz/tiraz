// A line, printed in two pulls on the bare paper of the poster's sky. First the accent pull lays a flat block for the key word (*…*)
// a few px off register; then the key-ink pull crosses the whole block from the reading side and lays the words. Where the accent is
// dark enough, the key word is knocked out of the block (bare paper inside the accent); otherwise it is overprinted in the key ink.
// The optional lead-in is in the muted ink, laid by the same pull. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.75, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? Math.min(kit.place(block, 720), T.floor - block);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const box = { x0, x1, y0: top - 10, y1: top + block + 10 };
  const knock = P.onAccent === P.paper;
  // where the key words sit: measured once from the layout with a dry run of drawText
  const keys = [];
  { const c = document.createElement('canvas').getContext('2d');
    kit.drawText(c, line, { x0, x1, y: yLine, align: 'center', each: (w, i, b) => { if (w.key) keys.push(b); return false; } }); }
  const tA = at, tI = at + T.dur.pull * 0.8;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (keys.length) {
        const kb = { x0: Math.min(...keys.map((b) => b.x)) - 30, x1: Math.max(...keys.map((b) => b.x + b.width)) + 30, y0: top, y1: top + block };
        M.pull(ctx, span(t, tA, tA + T.dur.pull * 0.7), kb, P.accent, P, () => {
          for (const b of keys) {
            const px = line.size * 0.16, py = line.size * 0.64;
            ctx.fillStyle = P.accent; ctx.fillRect(b.x - px + 3, b.y - py + 2, b.width + px * 2, py * 2);
          }
          if (knock) kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: P.paper, key: P.paper, each: (w) => (w.key ? undefined : false) });
        }, { rtl, seed: 3 });
      }
      M.pull(ctx, span(t, tI, tI + T.dur.pull), box, P.ink, P, () => {
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'center', color: P.muted });
        kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: P.ink, key: P.ink, each: (w) => (w.key && knock ? false : undefined) });
      }, { rtl, seed: 7 });
    },
  };
}
