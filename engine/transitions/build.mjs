// build.mjs · fills vendor/gl-transitions/ from a read-only copy of the gl-transitions repository and writes index.json and LICENSES.md.
//   node engine/transitions/build.mjs --src <folder with the .glsl files>
// Only files whose own header says MIT or a BSD licence are copied, unchanged. Everything else, and every file that failed to compile
// (listed in excluded.json by the authors' compile test, which is not part of the kit), is left out and listed with its reason in LICENSES.md.
// The .glsl files are read as text and never run.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { parseHeader, parseUniforms } from './parse.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), KIT = path.resolve(HERE, '../..');
const VENDOR = path.join(KIT, 'vendor/gl-transitions'), EXCLUDED = path.join(HERE, 'excluded.json');
const argv = process.argv.slice(2), src = argv[argv.indexOf('--src') + 1];
if (!src || argv.indexOf('--src') < 0) { console.error('build: pass --src <folder holding the .glsl files>'); process.exit(1); }
const srcDir = path.resolve(src), repo = path.dirname(srcDir);
const compileFailures = fs.existsSync(EXCLUDED) ? JSON.parse(fs.readFileSync(EXCLUDED, 'utf8')) : [];
const failed = new Map(compileFailures.map((f) => [f.name, f.reason]));

const git = (...a) => { try { return execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };
const commit = git('rev-parse', 'HEAD'), commitDate = git('log', '-1', '--format=%cs'), remote = git('remote', 'get-url', 'origin');

const licenceClass = (l) => (!l ? null : /^MIT\b/i.test(l) ? 'MIT' : /^BSD\s*2/i.test(l) ? 'BSD-2-Clause' : /^BSD\s*3/i.test(l) ? 'BSD-3-Clause' : 'other');
fs.mkdirSync(VENDOR, { recursive: true });
for (const f of fs.readdirSync(VENDOR)) if (f.endsWith('.glsl')) fs.unlinkSync(path.join(VENDOR, f));   // start clean so a removed file does not linger

const left = [], index = [], counts = {};
for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.glsl')).sort((a, b) => a.localeCompare(b))) {
  const name = file.replace(/\.glsl$/, ''), text = fs.readFileSync(path.join(srcDir, file), 'utf8'), h = parseHeader(text), cls = licenceClass(h.license);
  if (!h.license) { left.push([name, 'no licence line in the header']); continue; }
  if (cls === 'other') { left.push([name, `another licence: ${h.license}`]); continue; }
  if (failed.has(name)) { left.push([name, `failed to compile or to pass the test: ${failed.get(name)}`]); continue; }
  fs.copyFileSync(path.join(srcDir, file), path.join(VENDOR, file));      // byte for byte: the header is the attribution
  counts[cls] = (counts[cls] || 0) + 1;
  index.push({
    name, file: `vendor/gl-transitions/${file}`, author: h.author || null, license: cls, licenseLine: h.license,
    ...(h.description ? { description: h.description } : {}), ...(h.tags ? { tags: h.tags.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
    params: parseUniforms(text),
  });
}
fs.copyFileSync(path.join(repo, 'LICENSE'), path.join(VENDOR, 'LICENSE'));
// `fade` is the kit's own 2D cross-fade (run.js): it needs no WebGL and no file. It comes first in the list; it is not counted among the vendored files.
const own = { name: 'fade', builtin: true, author: 'tiraz', license: 'own code', description: 'A plain cross-fade drawn with the 2D canvas; works without WebGL.', tags: ['fade', 'blend', 'calm'], params: [] };
fs.writeFileSync(path.join(HERE, 'index.json'), JSON.stringify({ source: { repository: remote, commit, commitDate }, transitions: [own, ...index] }, null, 1) + '\n');

const total = index.length + left.length;
const md = `# gl-transitions (vendored)

Source: ${remote}
Commit: ${commit} (${commitDate})
The \`LICENSE\` file next to this one is the repository's own (MIT, "2017-present gl-transitions contributors"). Each \`.glsl\` file keeps its author and licence line in its own header; the files are copied byte for byte.

Files in the source folder: ${total}. Copied: ${index.length}. Left out: ${left.length}.

## Copied, by licence (read from each file's header)

${Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

The two BSD files keep their full copyright notice and conditions inside the file; do not strip them.

## Left out

${left.length ? left.map(([n, r]) => `- ${n}: ${r}`).join('\n') : 'None.'}

Regenerate with \`node engine/transitions/build.mjs --src <gl-transitions>/transitions\`. The compile test that fills excluded.json is not part of the kit: render a still of a transition on your own machine before you rely on it.
`;
fs.writeFileSync(path.join(VENDOR, 'LICENSES.md'), md);
console.log(`copied ${index.length} (${JSON.stringify(counts)}), left out ${left.length}`);
