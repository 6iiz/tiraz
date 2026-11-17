// A line of text, words fading in one after another. spec: { duration, says: { text }, y?, at? }  (words between *stars* take the accent colour)
// at: when the first word starts, in seconds (default 0). A line that opens a reel uses a negative value, so it is complete in the first frame.
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, clock });
  const { arrive } = await import(look.base + 'motion.js');
  const fitted = kit.fit(spec.says.text, { size: look.tokens.size.line, maxW: 900, where: 'the line text' });
  const y = spec.y ?? kit.place(fitted.height) + fitted.lead / 2;
  const step = look.tokens.dur.in, at = spec.at ?? 0;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      kit.drawText(ctx, fitted, {
        x0: 90, x1: W - 90, y,
        each: (word, i, box, c) => arrive(c, span(t, at + i * step, at + (i + 1) * step)),
      });
    },
  };
}
