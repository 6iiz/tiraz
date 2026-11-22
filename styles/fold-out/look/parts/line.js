// A line on a pop-up card: a card of cut paper (ink outline, thick paper border, cardboard edge) pops up on its bottom hinge in front of
// the book's backdrop, with the lead-in printed small above the statement. A key phrase (*…*) is printed on one accent sticker that flips
// open on its own hinge a moment later. The card leaves by folding back flat. Lands within 0.65 s of `at`.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   cut: the card stays up until the page turns.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2, px = T.size.line * 0.3;
  const line = M.isolate(kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.85, where: 'the line' }), px + 16, maxW);
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height : 0) + gap + line.height, pad = 46;
  const top = spec.y ?? kit.place(block + 2 * pad, 720) + pad;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const cw = Math.min(W - 70, Math.max(520, Math.max(line.width, lead ? lead.width : 0) + 120)), C = M.card(cw, block + 2 * pad, P.card, P, 5);
  const base = top + block + pad;
  const runs = M.keyRuns(line, x0, x1, yLine, 'center', rtl).map((r, k) => ({ ...r, st: M.card(r.x1 - r.x0 + 2 * px, line.size * 1.3, P.accent, P, 60 + k) }));
  const upAt = at, stickAt = at + 0.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s = M.pop(span(t, upAt, upAt + 0.42)) * (spec.cut ? 1 : M.fold(span(t, d - T.dur.out, d)));
      M.stand(ctx, C, W / 2, base, s, (c) => {
        if (lead) kit.drawText(c, lead, { x0, x1, y: yLead, align: 'center', color: P.soft });
        for (const r of runs) {
          const cx = (r.x0 + r.x1) / 2; c.save();
          if (M.flip(c, span(t, stickAt + r.first * 0.05, stickAt + r.first * 0.05 + 0.32), cx)) { c.drawImage(r.st.shadow, cx - r.st.w / 2 - r.st.m + 4, r.y - r.st.h / 2 - r.st.m + 6); c.drawImage(r.st.img, cx - r.st.w / 2 - r.st.m, r.y - r.st.h / 2 - r.st.m); }
          c.restore();
        }
        kit.drawText(c, line, { x0, x1, y: yLine, align: 'center', color: P.dark, key: P.on,
          each: (w, i, box, cc) => {
            if (w.ph) return false;
            if (!w.key) return;
            const r = runs.find((q) => w.idx >= q.first && w.idx <= q.last); if (!r) return;
            const cx = (r.x0 + r.x1) / 2, p = span(t, stickAt + r.first * 0.05, stickAt + r.first * 0.05 + 0.32);
            if (p <= 0) return P.dark;                                              // printed on the card until the sticker opens
            M.flip(cc, p, cx);
          } });
      });
    },
  };
}
