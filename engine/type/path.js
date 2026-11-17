// path.js · small tools for the glyph outlines HarfBuzz gives us (absolute M L Q C Z path data, no arcs).
// Needed to trace an outline (how long is each contour?) and to morph one (which contours pair up?). Results are memoised per path string:
// the same string always gives the same answer, so there is no state between frames.

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
const memo = new Map();

// Scales a glyph path from font units (y up) to pixels (y down) and rounds to 2 decimals.
export function scalePath(d, k) {
  const r = (v) => Math.round(v * 100) / 100;
  return d.replace(/(-?[\d.]+(?:e[-+]?\d+)?),(-?[\d.]+(?:e[-+]?\d+)?)/gi, (_, x, y) => `${r(x * k)},${r(-y * k) + 0}`);
}

// Moves every point of a path by (dx, dy); used to place a glyph where it sits in the line before morphing.
export function shiftPath(d, dx, dy) {
  const r = (v) => Math.round(v * 100) / 100;
  return d.replace(/(-?[\d.]+(?:e[-+]?\d+)?),(-?[\d.]+(?:e[-+]?\d+)?)/gi, (_, x, y) => `${r(+x + dx)},${r(+y + dy)}`);
}

// Splits path data into contours: [{ d, len, area, cx, cy, box:[x0,y0,x1,y1] }].
// len is the outline length, area the signed area (its sign tells an outer contour from a hole), cx/cy the centre of the box.
export function contours(d) {
  if (memo.has(d)) return memo.get(d);
  const out = [];
  for (const part of d.split(/(?=M)/).filter((s) => s.trim())) {
    const pts = flatten(part);
    if (pts.length < 2) continue;
    let len = 0, area = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i], [nx, ny] = pts[(i + 1) % pts.length];
      len += Math.hypot(nx - x, ny - y); area += (x * ny - nx * y) / 2;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    out.push({ d: part.endsWith('Z') ? part : part + 'Z', len, area, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, box: [x0, y0, x1, y1] });
  }
  memo.set(d, out);
  return out;
}

// One contour as a closed polygon, curves cut into short straight pieces. Only for measuring.
function flatten(part) {
  const pts = []; let cx = 0, cy = 0;
  for (const seg of part.match(/[MLQCZ][^MLQCZ]*/g) || []) {
    const v = (seg.slice(1).match(NUM) || []).map(Number), c = seg[0];
    if (c === 'M' || c === 'L') { cx = v[0]; cy = v[1]; pts.push([cx, cy]); }
    else if (c === 'Q') { for (let i = 1; i <= 8; i++) { const u = i / 8, a = (1 - u) ** 2, b = 2 * u * (1 - u), e = u * u; pts.push([a * cx + b * v[0] + e * v[2], a * cy + b * v[1] + e * v[3]]); } cx = v[2]; cy = v[3]; }
    else if (c === 'C') { for (let i = 1; i <= 12; i++) { const u = i / 12, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, e = 3 * u * u * (1 - u), f = u ** 3; pts.push([a * cx + b * v[0] + e * v[2] + f * v[4], a * cy + b * v[1] + e * v[3] + f * v[5]]); } cx = v[4]; cy = v[5]; }
  }
  return pts;
}
