// sequence.js · plays other scenes one after another, with a transition between each pair.
//   index.html?scene=/engine/scenes/sequence.js&brand=/brand/brand.json&spec=/reel/spec.json
// spec: { "scenes": [ { "scene": "/brand/look/parts/line.js", "spec": { ...inline... }  or  "specUrl": "/brand/look/ending.json" (or relative to this spec file),  "duration"?: seconds }, ... ],
//         "transition": { "name": "fade", "duration": 0.5, "params"?: { ... } },       how every gap joins; left out, scenes join with a cut
//                    or { "joint": "/brand/look/joint.js", "duration": 0.5 }            the brand's own joint module (see below)
//         "transitions"?: [ one per gap, null to keep the default ],                      gap 1 is between scene 1 and 2
//         "over"?: { "scene": "/brand/look/mark.js", "spec"?: { ... }, "specUrl"?: "..." } }
// Every child plays in its own time starting at 0. Neighbours overlap by the transition's duration, so the total is the sum of the durations
// minus the overlaps. Outside an overlap the child draws straight to the frame; inside one both draw to offscreen canvases and the transition blends them.
// Scene i+1 starts at start[i] + duration[i] - transition[i]. Each child is built with that start (plus the sequence's own clock) as its `clock`,
// so a brand's ground, which adds the clock to t, never restarts at a cut.
// "over" is a scene drawn on top of every frame with the sequence's time and clock (a brand's persistent mark). It has no duration of its own.
// A child's spec may carry "sfx": the sound cues of that scene. They are read by assemble.py, not here.
// create() returns also `timeline`: { scenes: [{ start, end }], transitions: [{ name, start, end }] } in reel seconds, for placing sounds.
import { need } from '../kit.js';
import { listTransitions, loadTransition } from '../transitions/run.js';

// With no transition written, scenes join with a cut: any other joint is a decision of the brand's look. A transition that is named
// (or a joint module) with no length lasts NAMED seconds.
const DEFAULT = { name: 'fade', duration: 0 }, NAMED = 0.5;
const canvasOf = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

// Children are built with the loadScene that main.js passes in (a scene must never import main.js: it would wait for itself).
export async function create({ W, H, brand, look, spec, base = '', clock = 0, loadScene }) {
  if (!loadScene) throw new Error('sequence.js needs the loadScene that engine/main.js passes to create(); this page does not provide it.');
  need(spec, ['scenes'], 'the sequence spec');
  if (!Array.isArray(spec.scenes) || !spec.scenes.length) throw new Error('the sequence spec needs "scenes": a list with at least one scene.');
  const n = spec.scenes.length, problems = [], known = new Set((await listTransitions()).map((e) => e.name));
  const abs = (p) => (p.startsWith('/') || /^https?:/.test(p) ? p : base + p);

  // Reads an entry's spec: inline "spec", or the JSON file named by "specUrl" (its own folder becomes the child's base).
  async function entrySpec(item) {
    let childSpec = item.spec ?? null, childBase = base;
    if (item.specUrl) {
      const res = await fetch(abs(item.specUrl)); if (!res.ok) throw new Error(`its spec file was not found: ${abs(item.specUrl)}`);
      try { childSpec = await res.json(); } catch { throw new Error(`${abs(item.specUrl)} is not valid JSON`); }
      childBase = abs(item.specUrl).slice(0, abs(item.specUrl).lastIndexOf('/') + 1);
    }
    return { childSpec, childBase };
  }
  const sceneOk = (item) => { if (!item || typeof item.scene !== 'string' || !item.scene.startsWith('/')) throw new Error('needs "scene": the path of a scene module, starting with / (for example /brand/look/parts/line.js)'); };

  // ---- transitions, one per gap (known before any child, because a child's start depends on them)
  if (spec.transitions && spec.transitions.length > Math.max(0, n - 1)) problems.push(`"transitions" has ${spec.transitions.length} entries but ${n} scenes have only ${Math.max(0, n - 1)} gaps.`);
  const gaps = [];
  for (let g = 0; g < n - 1; g++) {
    let tr = spec.transitions?.[g] ?? spec.transition ?? DEFAULT;
    if (typeof tr === 'string') tr = { name: tr };
    const where = `transition ${g + 1} (between scene ${g + 1} and ${g + 2})`;
    const duration = tr.duration ?? spec.transition?.duration ?? (tr.name || tr.joint ? NAMED : DEFAULT.duration), name = tr.name ?? DEFAULT.name;
    if (!(duration >= 0)) { problems.push(`${where}: "duration" must be a number of seconds, 0 or more.`); gaps.push(null); continue; }
    // A joint is the brand's own way of joining two scenes: a module in its look, { "joint": "/brand/look/joint.js", "duration": 0.5, "spec"?: {…} }.
    // It exports create({ W, H, brand, look, spec }) -> { draw(ctx, from, to, p, { t }) }: from and to are canvases holding the two scenes at this
    // moment, p runs 0..1 across the joint, and the module draws the frame. At p = 0 it must show `from` and at p = 1 `to`.
    if (tr.joint !== undefined) {
      if (typeof tr.joint !== 'string' || !tr.joint.startsWith('/')) { problems.push(`${where}: "joint" must be the path of a joint module, starting with / (for example /brand/look/joint.js).`); gaps.push(null); continue; }
      let joint = null;
      if (duration > 0) {
        try {
          const mod = await import(tr.joint);
          if (typeof mod.create !== 'function') throw new Error('it must export create({ W, H, brand, look, spec }), which returns { draw(ctx, from, to, p) }');
          joint = await mod.create({ W, H, brand, look, spec: tr.spec ?? null });
          if (typeof joint?.draw !== 'function') throw new Error('its create() must return { draw(ctx, from, to, p) }');
        } catch (e) { problems.push(`${where}: the joint ${tr.joint} could not be used: ${e.message}`); gaps.push(null); continue; }
      }
      gaps.push({ name: tr.joint, duration, params: {}, run: null, joint }); continue;
    }
    if (duration > 0 && !known.has(name) && ![...known].filter((k) => k.toLowerCase() === String(name).toLowerCase()).length) { problems.push(`${where}: there is no transition called "${name}". See engine/transitions/index.json for the names; "fade" always works.`); gaps.push(null); continue; }
    let run = null;
    if (duration > 0) { try { run = await loadTransition(name); } catch (e) { problems.push(`${where}: ${e.message}`); } }
    gaps.push({ name, duration, params: tr.params || {}, run });
  }

  // ---- children, in order: start[i] needs durations 0..i-1 and gaps 0..i-1, all known before child i is built
  const kids = [], start = [], dur = [];
  for (let i = 0; i < n; i++) {
    const item = spec.scenes[i], where = `scene ${i + 1}`;
    start.push(i === 0 ? 0 : start[i - 1] + dur[i - 1] - (gaps[i - 1]?.duration ?? 0));
    try {
      sceneOk(item);
      const { childSpec, childBase } = await entrySpec(item);
      const scene = await loadScene(item.scene, { spec: childSpec, base: childBase, clock: clock + start[i] });
      const duration = item.duration ?? scene.duration;
      if (!(duration > 0)) throw new Error(`has no duration: add "duration" (seconds) to its entry in "scenes", or use a scene that returns one`);
      kids.push({ scene, duration }); dur.push(duration);
    } catch (e) { problems.push(`${where} (${item?.scene ?? '?'}): ${e.message}`); kids.push(null); dur.push(0); }
  }

  // ---- the optional scene drawn over every frame
  let over = null;
  if (spec.over !== undefined) {
    try {
      sceneOk(spec.over);
      const { childSpec, childBase } = await entrySpec(spec.over);
      over = await loadScene(spec.over.scene, { spec: childSpec, base: childBase, clock });
    } catch (e) { problems.push(`"over" (${spec.over?.scene ?? '?'}): ${e.message}`); }
  }

  // a transition may not be longer than either neighbour, and the two around one scene may not overlap each other (three scenes on screen at once)
  if (!kids.includes(null)) {
    gaps.forEach((g, i) => {
      if (!g) return;
      for (const k of [i, i + 1]) if (g.duration > kids[k].duration) problems.push(`transition ${i + 1} lasts ${g.duration} s but scene ${k + 1} lasts only ${kids[k].duration} s: make the transition shorter or the scene longer.`);
      if (i > 0 && gaps[i - 1] && gaps[i - 1].duration + g.duration > kids[i].duration) problems.push(`the transitions on both sides of scene ${i + 1} (${gaps[i - 1].duration} s and ${g.duration} s) are longer together than the scene (${kids[i].duration} s): shorten them or lengthen the scene.`);
    });
  }
  if (problems.length) throw new Error(`the sequence cannot be built:\n  - ${problems.join('\n  - ')}`);

  // ---- timeline
  const gapLen = gaps.map((g) => g.duration);
  const end = start.map((s, i) => s + dur[i]), total = end[n - 1];
  const offA = n > 1 ? canvasOf(W, H) : null, offB = n > 1 ? canvasOf(W, H) : null;
  const timeline = { scenes: start.map((s, i) => ({ start: s, end: end[i] })), transitions: gaps.map((g, i) => ({ name: g.name, start: start[i + 1], end: end[i] })) };

  // What is on screen at t: one child, or two with the progress of the blend. A zero-length gap is a hard cut.
  function at(t) {
    for (let g = 0; g < n - 1; g++) if (gapLen[g] > 0 && t >= start[g + 1] && t < end[g]) return { from: g, to: g + 1, gap: g, p: (t - start[g + 1]) / gapLen[g] };
    let i = 0; for (let k = 0; k < n; k++) if (start[k] <= t) i = k;
    return { from: i };
  }
  const frame = (c, i, t) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, W, H); c.save(); kids[i].scene.draw(c, t - start[i]); c.restore(); };

  return {
    duration: total, timeline,
    // Each visible child prepares for its own time (a film loads the frame it needs).
    async prepare(t) {
      const s = at(t);
      for (const i of s.to === undefined ? [s.from] : [s.from, s.to]) if (kids[i].scene.prepare) await kids[i].scene.prepare(t - start[i]);
      if (over?.prepare) await over.prepare(t);
    },
    draw(ctx, t) {
      const s = at(t);
      if (s.to === undefined) frame(ctx, s.from, t);
      else {
        frame(offA.getContext('2d'), s.from, t); frame(offB.getContext('2d'), s.to, t);
        const g = gaps[s.gap];
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
        if (g.joint) g.joint.draw(ctx, offA, offB, s.p, { t, W, H });          // the brand's own joint draws the frame from the two scenes
        else ctx.drawImage(g.run.draw(offA, offB, s.p, g.params), 0, 0);
        ctx.restore();
      }
      if (over) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; over.draw(ctx, t); ctx.restore(); }
    },
  };
}
