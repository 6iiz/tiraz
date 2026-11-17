// assets.js · loads an icon or an emoji by id (`<set>:<name>`) for a scene.
//   const a = await loadAsset('tabler:shopping-cart', { color: brand.colors.accent });
//   a.draw(ctx, x, y, size)   draws it inside a size×size box at x,y, centred, keeping its proportions
//   a.paths                   the outline path data (array of strings) when the icon is only plain <path> elements, so a scene can trace it; else null
// The sets are Iconify JSON files served by the local server under /assets/icons/<set>/icons.json; nothing is fetched from anywhere else.
// The SVG is rasterised through an Image from a data: URL, which is not a network request, and the result is cached per id and colour.
const sets = new Map();     // set id -> Promise of the parsed icons.json
const made = new Map();     // `${id}|${color}` -> Promise of the asset

function getSet(set) {
  if (!sets.has(set)) {
    sets.set(set, fetch(`/assets/icons/${encodeURIComponent(set)}/icons.json`).then((r) => {
      if (!r.ok) throw new Error(`there is no icon set "${set}" in this kit (looked for /assets/icons/${set}/icons.json)`);
      return r.json();
    }));
  }
  return sets.get(set);
}

// An alias is another name for an icon, sometimes flipped or turned. Same wrapper as tools/assets.py, so both draw the same picture.
function resolve(data, id, name) {
  const icons = data.icons, aliases = data.aliases || {};
  let h = false, v = false, rot = 0, guard = 0;
  while (!icons[name] && aliases[name] && guard++ < 8) {
    const a = aliases[name]; h = h !== !!a.hFlip; v = v !== !!a.vFlip; rot = (rot + (a.rotate || 0)) % 4; name = a.parent;
  }
  if (!icons[name]) throw new Error(`there is no icon "${id.split(':')[1]}" in ${id.split(':')[0]}; search with: python tools/assets.py find "<words>"`);
  const ic = { width: data.width || 24, height: data.height || 24, left: 0, top: 0, ...icons[name] };
  if (h || v || rot) {
    const cx = ic.left + ic.width / 2, cy = ic.top + ic.height / 2;
    ic.body = `<g transform="translate(${cx} ${cy})${rot ? ` rotate(${rot * 90})` : ''}${h || v ? ` scale(${h ? -1 : 1} ${v ? -1 : 1})` : ''} translate(${-cx} ${-cy})">${ic.body}</g>`;
    if (rot % 2) [ic.width, ic.height] = [ic.height, ic.width];
  }
  return ic;
}

const onlyPaths = (body) => {
  const tags = [...body.matchAll(/<\s*([a-zA-Z]+)/g)].map((m) => m[1]);
  if (!tags.length || tags.some((t) => t !== 'path')) return null;
  const d = [...body.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  return d.length ? d : null;
};

export async function loadAsset(id, { color = '#ffffff' } = {}) {
  const key = `${id}|${color}`;
  if (!made.has(key)) made.set(key, build(id, color));
  return made.get(key);
}

async function build(id, color) {
  const i = id.indexOf(':');
  if (i < 1) throw new Error(`"${id}" is not an asset id; an id looks like tabler:shopping-cart`);
  const set = id.slice(0, i), name = id.slice(i + 1);
  const ic = resolve(await getSet(set), id, name);
  const body = ic.body.replaceAll('currentColor', color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${ic.left} ${ic.top} ${ic.width} ${ic.height}" width="${ic.width}" height="${ic.height}">${body}</svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  try { await img.decode(); } catch { throw new Error(`the icon ${id} could not be turned into a picture`); }
  const k = Math.max(ic.width, ic.height);
  return {
    id, width: ic.width, height: ic.height, paths: onlyPaths(ic.body),
    // the icon fits a size×size box and sits in its middle; the browser draws an SVG image sharp at the size asked
    draw(ctx, x, y, size) {
      const w = ic.width / k * size, h = ic.height / k * size;
      ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
    },
  };
}
