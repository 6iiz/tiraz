// A line in glass: the statement stands as thick frosted-glass letters lit from behind; the words turn into the light one after another
// from the reading side; the key word (*…*) is accent-tinted glass and throws a pool of coloured light, shaped like the word, on the
// floor in front of it. The optional lead-in is etched light above it, flat. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, mix, SAFE } from '/engine/kit.js';
import { screenBox } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, J = T.dur.joint, first = clock < 0.01;
  const M = await import(look.base + 'motion.js');
  const st = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const P = st.P, maxW = SAFE.right - SAFE.left - 20, dir = kit.rtl ? 1 : -1;
  const fit = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW, minScale: 0.6, lead: 1.45 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 500, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.lead : 0) + gap + fit.height;
  const top = spec.y ?? kit.place(block, 640), yLead = top + (lead ? lead.lead / 2 : 0);
  const mats = { clear: M.glass(P, st.env, 'clear', fit.size * 0.32), key: M.glass(P, st.env, 'key', fit.size * 0.32) };
  const rows = [], words = [], patches = [];
  for (let r = 0; r < fit.rows.length; r++) {
    const text = fit.rows[r].words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' ');
    const g = await M.glassText(brand, text, { size: fit.size, mats: (k) => mats[k] });
    const sy = top + (lead ? lead.lead : 0) + gap + r * fit.lead + fit.lead / 2, [x, y] = st.at(W / 2, sy);
    g.root.position.set(x, y, 0); st.scene.add(g.root); rows.push({ g, text: fit.rows[r].words.map((w) => w.w).join(' ') });
    for (const w of g.words) {
      words.push(w);
      if (w.key) patches.push({ w, m: st.patch(P.glow, W / 2 + x + w.x, Math.max(w.width * 1.5, 320), { text: w.text }) });
    }
  }
  const n = words.length, step = n > 1 ? Math.min(0.12, 0.3 / (n - 1)) : 0, out0 = d - J * 0.9;
  const lit = (w) => words.indexOf(w);
  const leadC = mix(P.ground, P.ink, 0.78);
  return {
    duration: d,
    draw(ctx, t) {
      const sw = M.sweep(t, d, J, W, first), drift = Math.min(1, t / d);
      st.camera.position.z = T.cam.D * (1 - 0.018 * drift);
      words.forEach((w, i) => {
        const e = M.turnIn(w.group, span(t, at + i * step, at + i * step + T.dur.in), dir);
        if (w.key && e >= 1) w.group.rotation.y = Math.sin((t - at) * 1.3) * 0.05;     // the key pane breathes in the light
        M.turnOut(w.group, span(t, out0 + i * 0.05, out0 + i * 0.05 + T.dur.out), dir);
      });
      for (const p of patches) { const i = lit(p.w); p.m.material.opacity = 0.9 * M.soft(span(t, at + i * step + 0.25, at + i * step + 0.75)) * (1 - span(t, out0, out0 + 0.4)); }
      st.draw(ctx, t, sw);
      for (const r of rows) if (r.g.words.some((w) => w.group.visible)) kit.rec(...screenBox(r.g.root, st.camera, W, H), r.text);
      if (lead) {
        const a = 1 - M.away(span(t, out0, out0 + 0.35)), pin = M.land(span(t, at - 0.1, at + 0.3));
        if (a > 0 && pin > 0) {
          ctx.save(); ctx.globalAlpha = Math.min(a, pin);
          kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead + (1 - pin) * 16, align: 'center', color: leadC });
          ctx.restore();
        }
      }
    },
  };
}
