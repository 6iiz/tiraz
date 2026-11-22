// SVG path data -> absolute M L C Q Z only. The shared 3D base reads those five; a brand logo may also use H V S T, relative
// commands and elliptical arcs (a round logo is usually two arcs), so they are rewritten here. Arcs become cubic curves of at most
// a quarter turn each, which is exact to well under a pixel at logo sizes.
export function normalPath(d) {
  const t = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) || [];
  let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, cx = null, cy = null, qx = null, qy = null; const out = [];
  const n = () => +t[i++], f = (v) => +v.toFixed(3);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { out.push('Z'); x = sx; y = sy; cx = cy = qx = qy = null; continue; }
    if (i >= t.length || /[a-zA-Z]/.test(t[i])) { i++; continue; }
    if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; out.push(`M${f(x)},${f(y)}`); cmd = rel ? 'l' : 'L'; cx = cy = qx = qy = null; }
    else if (C === 'L') { x = ox + n(); y = oy + n(); out.push(`L${f(x)},${f(y)}`); cx = cy = qx = qy = null; }
    else if (C === 'H') { x = ox + n(); out.push(`L${f(x)},${f(y)}`); cx = cy = qx = qy = null; }
    else if (C === 'V') { y = (rel ? y : 0) + n(); out.push(`L${f(x)},${f(y)}`); cx = cy = qx = qy = null; }
    else if (C === 'C' || C === 'S') {
      let x1, y1;
      if (C === 'C') { x1 = ox + n(); y1 = oy + n(); } else { x1 = cx == null ? x : 2 * x - cx; y1 = cy == null ? y : 2 * y - cy; }
      const x2 = ox + n(), y2 = oy + n(), ex = ox + n(), ey = oy + n();
      out.push(`C${f(x1)},${f(y1)} ${f(x2)},${f(y2)} ${f(ex)},${f(ey)}`); cx = x2; cy = y2; qx = qy = null; x = ex; y = ey;
    } else if (C === 'Q' || C === 'T') {
      let x1, y1;
      if (C === 'Q') { x1 = ox + n(); y1 = oy + n(); } else { x1 = qx == null ? x : 2 * x - qx; y1 = qy == null ? y : 2 * y - qy; }
      const ex = ox + n(), ey = oy + n();
      out.push(`Q${f(x1)},${f(y1)} ${f(ex)},${f(ey)}`); qx = x1; qy = y1; cx = cy = null; x = ex; y = ey;
    } else if (C === 'A') {
      const rx = Math.abs(n()), ry = Math.abs(n()), rot = n(), large = n(), sweep = n(), ex = ox + n(), ey = oy + n();
      for (const c of arc(x, y, rx, ry, rot, large, sweep, ex, ey)) out.push(`C${f(c[0])},${f(c[1])} ${f(c[2])},${f(c[3])} ${f(c[4])},${f(c[5])}`);
      x = ex; y = ey; cx = cy = qx = qy = null;
    } else i++;
  }
  return out.join(' ');
}

// The SVG arc from (x1, y1) to (x2, y2) as cubic Bezier segments [c1x, c1y, c2x, c2y, x, y].
function arc(x1, y1, rx, ry, deg, large, sweep, x2, y2) {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return x1 === x2 && y1 === y2 ? [] : [[x1, y1, x2, y2, x2, y2]];
  const phi = deg * Math.PI / 180, cs = Math.cos(phi), sn = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, xp = cs * dx + sn * dy, yp = -sn * dx + cs * dy;
  const lam = xp * xp / (rx * rx) + yp * yp / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, den = rx * rx * yp * yp + ry * ry * xp * xp;
  let k = Math.sqrt(Math.max(0, num / den)); if (+large === +sweep) k = -k;
  const cxp = k * rx * yp / ry, cyp = -k * ry * xp / rx;
  const cx = cs * cxp - sn * cyp + (x1 + x2) / 2, cy = sn * cxp + cs * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!+sweep && dt > 0) dt -= 2 * Math.PI; else if (+sweep && dt < 0) dt += 2 * Math.PI;
  const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9), step = dt / segs, al = 4 / 3 * Math.tan(step / 4), out = [];
  const P = (a) => [cx + rx * Math.cos(a) * cs - ry * Math.sin(a) * sn, cy + rx * Math.cos(a) * sn + ry * Math.sin(a) * cs];
  const D = (a) => [-rx * Math.sin(a) * cs - ry * Math.cos(a) * sn, -rx * Math.sin(a) * sn + ry * Math.cos(a) * cs];
  for (let s = 0; s < segs; s++) {
    const a0 = t1 + s * step, a1 = a0 + step, p0 = P(a0), p1 = P(a1), d0 = D(a0), d1 = D(a1);
    out.push([p0[0] + al * d0[0], p0[1] + al * d0[1], p1[0] - al * d1[0], p1[1] - al * d1[1], p1[0], p1[1]]);
  }
  return out;
}
