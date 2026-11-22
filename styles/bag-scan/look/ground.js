// The Bag Scan ground: a screening console. The bright field of the scanner (the brand's lighter colour, a touch dimmed) with a faint
// line-scan texture, framed by plain console chrome in the darker colour: a status bar on top with the material legend (four swatches,
// thin to dense), a row of function keys at the bottom, and the line sensor itself, a thin accent line on the side the belt comes from.
// Below the text the belt keeps carrying loose objects (a bottle, keys, a phone, a coiled cable), drawn as the beam sees them.
// `items(ctx, offset)` draws that stream shifted by the belt; parts call it with their own belt offset. Uses `clock` for the stream.
import { mix } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), rtl = brand.dir !== 'ltr', dir = rtl ? 1 : -1, G = look.tokens.console;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const sensorX = rtl ? W - G.side : G.side;
  // the field with its scan texture, once
  const field = document.createElement('canvas'); field.width = W; field.height = H;
  { const c = field.getContext('2d'); c.fillStyle = pal.screen; c.fillRect(0, 0, W, H);
    c.fillStyle = mix(pal.screen, pal.dark, 0.035); for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
    // the chrome
    c.fillStyle = pal.chrome; c.fillRect(0, 0, W, G.top); c.fillRect(0, H - G.bottom, W, G.bottom);
    c.font = `600 24px "${mono}"`; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillStyle = pal.chromeInk;
    c.textAlign = 'left'; c.fillText('LANE A  ·  BELT', 40, G.top - 50);
    const sw = [pal.organic, pal.organic2, pal.mixed, pal.metal];
    sw.forEach((s, i) => { c.fillStyle = s; c.fillRect(W - 40 - (4 - i) * 52, G.top - 66, 40, 32); });
    c.strokeStyle = pal.chromeInk; c.lineWidth = 1;
    const keys = ['ZOOM', 'HI', 'LO', 'O2', 'INV', 'MARK'], kw = (W - 80 - 5 * 14) / 6, ky = H - G.bottom + 40;
    c.font = `700 22px "${mono}"`; c.textAlign = 'center';
    keys.forEach((k, i) => { const x = 40 + i * (kw + 14); c.strokeRect(x + 0.5, ky + 0.5, kw, 56); c.fillStyle = pal.chromeInk; c.fillText(k, x + kw / 2, ky + 29); });
  }
  // the loose objects, each drawn once in its own canvas as the beam sees it
  const obj = (w, h, paint) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d'), w, h); return cv; };
  const bottle = obj(260, 110, (c) => { c.fillStyle = pal.organic2; c.beginPath(); c.roundRect(10, 15, 190, 80, 30); c.fill(); c.fillRect(190, 40, 50, 30);
    c.fillStyle = pal.mixed; c.fillRect(232, 36, 22, 38); c.strokeStyle = pal.mixed; c.lineWidth = 4; c.beginPath(); c.roundRect(10, 15, 190, 80, 30); c.stroke(); });
  const phone = obj(220, 130, (c) => { c.fillStyle = pal.mixed; c.beginPath(); c.roundRect(6, 6, 200, 112, 18); c.fill();
    c.fillStyle = pal.metal; c.fillRect(40, 26, 120, 72); c.fillStyle = pal.dark; c.fillRect(170, 30, 16, 16); c.fillRect(170, 54, 16, 16); });
  const keysO = obj(200, 120, (c) => { c.strokeStyle = pal.metal; c.lineWidth = 9; c.beginPath(); c.arc(50, 60, 34, 0, Math.PI * 2); c.stroke();
    c.fillStyle = pal.metal; c.fillRect(80, 52, 100, 16); for (const x of [120, 140, 162]) c.fillRect(x, 64, 10, 18); });
  const coil = obj(260, 120, (c) => { c.strokeStyle = pal.mixed; c.lineWidth = 6; c.beginPath();
    for (let x = 10; x < 250; x += 2) { const y = 60 + Math.sin(x * 0.18) * 32; x === 10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
    c.fillStyle = pal.metal; c.fillRect(0, 50, 18, 22); c.fillRect(242, 50, 18, 22); });
  const stream = [[bottle, 0, 1370], [keysO, 330, 1440], [phone, 560, 1350], [coil, 860, 1430], [bottle, 1180, 1460], [phone, 1430, 1380]];
  const period = 1700;
  return {
    pal, dir, sensorX, top: G.top, bottomY: H - G.bottom,
    draw(ctx) { ctx.drawImage(field, 0, 0); },
    // the stream of loose objects under the text: part of the scanned image, so it moves only with the belt (`offset`, screen px,
    // positive = to the right). Each scene starts the stream at another phase.
    items(ctx, offset = 0) {
      const phase = (clock * 397) % period;
      ctx.save(); ctx.beginPath(); ctx.rect(0, G.top, W, H - G.top - G.bottom); ctx.clip();
      for (const [cv, x, y] of stream) {
        const u = (((x + phase + dir * offset) % period) + period) % period - 200, xx = rtl ? u : W - u - cv.width;
        if (xx < W && xx + cv.width > 0) ctx.drawImage(cv, xx, y);
      }
      ctx.restore();
    },
    // the line sensor: a thin accent line on the belt's entry side, brighter while the belt runs
    sensor(ctx, running = 0) {
      ctx.save(); ctx.fillStyle = pal.mixed; ctx.globalAlpha = 0.55 + 0.45 * running;
      ctx.fillRect(sensorX - 2, G.top, 4, H - G.top - G.bottom);
      ctx.globalAlpha = 0.25 * running; ctx.fillRect(sensorX - (rtl ? 26 : -4), G.top, 22, H - G.top - G.bottom);
      ctx.restore();
    },
  };
}
