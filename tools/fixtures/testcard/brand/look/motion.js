// How things arrive and leave on the test card: a plain change of opacity, nothing else. It is here to test the mechanics, not to be a look.
// p is 0 before a thing arrives and 1 when it has landed. arrive() returns false while the thing is not there yet, so the caller can skip drawing it.
import { ease } from '/engine/kit.js';

export function arrive(ctx, p) { if (p <= 0) return false; ctx.globalAlpha *= ease.outQuad(p); }
export function leave(ctx, p) { ctx.globalAlpha *= 1 - ease.inQuad(p); }
