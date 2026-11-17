// frames.js · numbered image frames (a 3D render, footage stills) as a layer a scene can draw. Mechanics only: where the film sits,
// what is written over it and how it is framed is the brand's look.
//   const film = frames({ pattern: 'film/f%04d.png', fps: 30, n: 360, base });
//   await film.prepare(t);  film.draw(ctx, 0, 0, W, H);        in the scene's prepare(t) and draw(ctx, t)
// The film keeps its own frame rate. The last frame holds when t runs past the end.

export function frames({ pattern, fps, n, base = '' }) {
  if (typeof pattern !== 'string' || !/%0\d+d/.test(pattern)) throw new Error(`the frame pattern "${pattern}" needs a number part such as %04d, e.g. film/f%04d.png.`);
  if (!(fps > 0) || !(n >= 1)) throw new Error('frames() needs "fps" (frames per second) and "n" (how many frames there are).');
  const root = pattern.startsWith('/') || /^https?:/.test(pattern) ? pattern : base + pattern;
  const path = (i) => root.replace(/%0(\d+)d/, (_, d) => String(i).padStart(Number(d), '0'));
  let shown = null, shownIndex = -1;
  const index = (t) => Math.min(n - 1, Math.max(0, Math.floor(t * fps + 1e-6)));
  return {
    duration: n / fps,
    index,
    async prepare(t) {
      const i = index(t);
      if (i === shownIndex) return;
      const img = new Image(); img.src = path(i);
      try { await img.decode(); } catch { throw new Error(`the film frame did not load: ${path(i)}. Check "pattern" and "n", and that the file exists.`); }
      shown = img; shownIndex = i;
    },
    draw(ctx, x, y, w, h) { if (shown) ctx.drawImage(shown, x, y, w, h); },
    get image() { return shown; },
  };
}

// The anchors file says where each part of the film is in every frame: { parts: { chip: [ {x,y} | [x,y] per frame ] } } or the parts alone.
// A part may be a list indexed by frame or an object keyed by frame number.
export async function anchors(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`the anchors file was not found: ${url}. It says where each part is in every frame.`);
  let data; try { data = await res.json(); } catch { throw new Error(`${url} is not valid JSON.`); }
  const parts = data.parts || data;
  return {
    parts,
    at(part, frameIndex) {
      const list = parts[part];
      if (!list) return null;
      const p = Array.isArray(list) ? list[frameIndex] : list[String(frameIndex)];
      if (!p) return null;                                           // the part is off screen in this frame
      return { x: p.x ?? p[0], y: p.y ?? p[1] };
    },
  };
}
