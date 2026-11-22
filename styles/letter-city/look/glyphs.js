// Arabic (or Latin) text as extruded solids, like text3d() in /engine/three3d.js and with the same result, but with holes found by
// contour direction (the non-zero rule fonts use) instead of by nesting. Variable fonts keep overlapping contours (Kufam's final
// heh and teh marbuta are two overlapping loops): read by nesting, one loop became a hole of the other and the letter lost its face.
// Here a contour that turns the same way as the glyph's largest one is solid, the other way is a hole of the smallest solid around it.
import { THREE, shapePath } from '/engine/three3d.js';
import { shapeText } from '/engine/type/shape.js';
import { marks } from '/engine/kit.js';

function solidsNZ(sp) {
  const polys = sp.subPaths.map((s) => ({ s, pts: s.getPoints(6) })).filter((p) => p.pts.length > 2);
  if (!polys.length) return [];
  polys.forEach((p) => { p.a = THREE.ShapeUtils.area(p.pts); p.abs = Math.abs(p.a); });
  const outer = Math.sign(polys.reduce((a, b) => (b.abs > a.abs ? b : a)).a);
  const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const solid = polys.filter((p) => Math.sign(p.a) === outer), holes = polys.filter((p) => Math.sign(p.a) !== outer);
  const shapes = new Map();
  for (const p of solid) { const sh = new THREE.Shape(); sh.curves = p.s.curves; sh.autoClose = true; shapes.set(p, sh); }
  for (const h of holes) {
    const host = solid.filter((q) => q.abs > h.abs && h.pts.every((pt, i) => i % 3 || inside(pt, q.pts))).sort((a, b) => a.abs - b.abs)[0];
    if (!host) { const sh = new THREE.Shape(); sh.curves = h.s.curves; sh.autoClose = true; shapes.set(h, sh); continue; }   // a lone contour drawn the other way (a dot) is still ink
    const path = new THREE.Path(); path.curves = h.s.curves; shapes.get(host).holes.push(path);
  }
  return [...shapes.values()];
}

export async function text3d(brand, text, { size = 90, weight = 800, depth = 20, curve = 5, face = 'display', material } = {}) {
  const ws = marks(text, 'the 3D text'), plain = ws.map((w) => w.w).join(' ');
  const font = brand.fonts[face] || brand.fonts.display;
  const sh = await shapeText({ fontUrl: font.file, text: plain, size, dir: brand.dir === 'ltr' ? 'ltr' : 'rtl', wght: weight });
  const root = new THREE.Group(), words = [], cx = sh.width / 2, cy = (sh.ascent - sh.descent) / 2;
  sh.words.forEach((sw, wi) => {
    const w = { text: sw.text, key: !!ws[wi]?.key, group: new THREE.Group() };
    const mx = (sw.x0 + sw.x1) / 2 - cx; w.group.position.set(mx, 0, 0);
    for (const gi of sw.ids) {
      const g = sh.glyphs[gi]; if (!g.d) continue;
      const shapes = solidsNZ(shapePath(g.d)); if (!shapes.length) continue;
      const geo = new THREE.ExtrudeGeometry(shapes, { depth, curveSegments: curve, bevelEnabled: false });
      const mesh = new THREE.Mesh(geo, material(w));
      mesh.position.set(g.x - cx - mx, -g.y + cy, 0); mesh.castShadow = true; mesh.receiveShadow = true; w.group.add(mesh);
    }
    root.add(w.group); words.push(w);
  });
  return { root, words, width: sh.width, height: sh.ascent + sh.descent, baseline: cy, size };
}
