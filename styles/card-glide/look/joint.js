// The card-glide joint: the one-take camera whips from this place on the desk to the next. Both frames lie side by side on one desk and
// slide together, the reading direction leading; the camera lifts a little mid-whip (the frame shrinks by a few percent) and the fast
// part smears into a few faint trailing copies, like motion blur. No cut, no fade: the desk carries on.
import { ease, mix, contrast } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const { bg, text } = brand.colors, light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  const desk = mix(light, dark, look.tokens.tone.desk), dir = brand.dir !== 'ltr' ? 1 : -1;
  return {
    draw(ctx, from, to, p) {
      if (p <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      const q = ease.inOutCubic(p), arc = Math.sin(Math.PI * p), s = 1 - 0.07 * arc, smear = 150 * arc * arc;
      ctx.save(); ctx.fillStyle = desk; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
      const put = (dx, a) => { ctx.globalAlpha = a; ctx.drawImage(from, dir * W * q + dx, 0); ctx.drawImage(to, dir * W * (q - 1) + dx, 0); };
      put(0, 1);
      for (let i = 1; i <= 3; i++) put(-dir * smear * i / 3, 0.22);
      ctx.restore();
    },
  };
}
