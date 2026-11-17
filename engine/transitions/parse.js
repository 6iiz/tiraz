// parse.js · reads the header comments and the uniform lines of one gl-transitions .glsl file.
// Shared by the index builder (Node) and the runner (browser), so both see the same parameters and defaults.
// The file is treated as data: nothing in it is executed here, only matched with patterns.

// Header: "// Author:", "// License:", "// Description:", "// Tags:" lines, the first of each kind wins. The whole file is scanned because StereoViewer
// puts two uniform lines above its header, and Shockwave indents its header by a space.
export function parseHeader(src) {
  const out = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*\/\/\s*(Author|License|Licence|Description|Tags)\s*:\s*(.*)$/i);
    if (m) { const k = m[1].toLowerCase().replace('licence', 'license'); if (!(k in out)) out[k] = m[2].trim(); }
  }
  return out;
}

// Plain arithmetic only (some defaults are written like 1.0/3.0). The pattern guards the Function call: digits, dots, operators, brackets.
function num(s) {
  const t = s.trim();
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return Number(t);
  if (/^[\d.\s+\-*/()eE]+$/.test(t)) { try { const v = Function(`"use strict";return (${t})`)(); if (Number.isFinite(v)) return v; } catch {} }
  return NaN;
}
// Splits "a, b" at top-level commas.
function args(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
}

const SIZE = { vec2: 2, vec3: 3, vec4: 4, ivec2: 2, ivec3: 3, ivec4: 4 };
// Turns the text after "= " into a JS value for the GLSL type, or null when it cannot be read.
export function parseDefault(type, text) {
  if (text == null) return null;
  const t = text.trim().replace(/;$/, '').trim();
  if (type === 'bool') return t === 'true' ? true : t === 'false' ? false : null;
  if (type === 'float' || type === 'int') { const v = num(t); return Number.isNaN(v) ? null : v; }
  if (SIZE[type]) {
    const m = t.match(/^[iu]?vec\d\s*\((.*)\)$/s); if (!m) return null;
    const v = args(m[1]).map(num); if (v.some(Number.isNaN)) return null;
    if (v.length === 1) return Array(SIZE[type]).fill(v[0]);          // vec2(0.5) means both components
    return v.length === SIZE[type] ? v : null;
  }
  return null;
}

// Every `uniform <type> <name>;` with its default from a trailing `// = value` or `/* = value */`, plus the "@range(min, max[, step])" and "@param"
// comment lines directly above it when the file has them.
export function parseUniforms(src) {
  const params = [], lines = src.split(/\r?\n/); let note = null, range = null;
  for (const line of lines) {
    const c = line.match(/^\s*\/\/\s*@(range|param)\b(.*)$/);
    if (c) {
      if (c[1] === 'range') { const r = c[2].match(/^\(([^)]*)\)\s*(.*)$/); if (r) { range = r[1].split(',').map(num); if (range.some(Number.isNaN)) range = null; note = r[2].trim() || note; } }
      else note = c[2].trim();
      continue;
    }
    const u = line.match(/^\s*uniform\s+(\w+)\s+(\w+)\s*(?:\/\*\s*=?\s*(.*?)\s*\*\/)?\s*;\s*(?:\/\/\s*=\s*([^;]*?))?\s*(?:;\s*)?(?:\/\/.*)?$/);   // a few files write "// = 0.4 ; // note"
    if (u) {
      const [, type, name, inline, trailing] = u;
      const p = { name, type, default: type === 'sampler2D' ? null : parseDefault(type, inline ?? trailing) };
      if (range) p.range = range;
      if (note) p.note = note;
      params.push(p); note = null; range = null;
    } else if (line.trim() !== '' && !/^\s*\/\//.test(line)) { note = null; range = null; }
  }
  return params;
}

// A zero of the right type, for a uniform that has no default in its file.
export function zeroOf(type) {
  if (type === 'bool') return false;
  if (SIZE[type]) return Array(SIZE[type]).fill(0);
  return 0;
}
