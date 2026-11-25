// Origami-fold motion. Paper has two moves only, both computed from time:
//  - stand: a sheet lies tipped towards the lens on its bottom crease and swings up to face you (a card being stood up);
//  - crease: a sheet comes folded as a pleat (a zig-zag of panels) and opens panel after panel from its reading-start edge; each
//    crease snaps flat with a small give past flat and back, the way a fold that was pressed hard springs open.
// A sheet's whole arrival is one number p (0 folded and lying, 1 flat and standing); every angle below is a function of p.
import { clamp, ease } from '/engine/kit.js';

export const DEG = Math.PI / 180;
export const E = ease.outCubic;
export const EI = ease.inOutCubic;
// a pressed crease springing open: overshoots flat a little, settles exactly on 1 at q = 1
export const snap = (q) => { q = clamp(q); return q >= 1 ? 1 : 1 - Math.exp(-6.5 * q) * Math.cos(8 * q) * (1 - q); };

// how far panel k (of n, counted from the reading-start edge) has opened at sheet progress p
export const panelQ = (p, k, n, wave) => (n > 1 ? clamp((p - k * wave / (n - 1)) / (1 - wave)) : clamp(p));
// the angle of panel k off the sheet's plane (radians): `open` degrees when folded, `rest` degrees left in the paper when flat
export const crease = (p, k, n, { open, rest, wave }) => ((open - rest) * (1 - snap(panelQ(p, k, n, wave))) + rest) * DEG;
// the swing up from lying: `deg` degrees towards the lens at p = 0, standing at p = 0.6
export const stand = (p, deg) => deg * DEG * (1 - E(clamp(p / 0.6)));
// a quick flex of a landed sheet (0 -> 1 -> 0): its creases bend and spring back once
export const flex = (q) => (q <= 0 || q >= 1 ? 0 : Math.sin(Math.PI * q) * Math.exp(-2.2 * q));
