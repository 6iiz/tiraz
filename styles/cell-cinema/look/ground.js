// The cell-cinema ground: one plain, generic spreadsheet window that never leaves the frame. A title bar and a toolbar of grey glyphs, the
// name box and formula bar (their contents are written by each part), the column letters and row numbers, the light sheet with its grey
// grid, and the tab bar and status bar at the bottom. No product's interface, name or colours: everything is a mix of the brand's two
// colours. The window is built once into a canvas; `drawSheet(ctx, z)` redraws only the sheet at another zoom (the ending zooms out).
import { mix, rgba } from '/engine/kit.js';
import { palette, sheet, colName } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand), rtl = brand.dir !== 'ltr', F = T.shell, g = T.grid;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const grid = (c, z) => {
    const S = sheet(T, W, rtl, z);
    c.fillStyle = P.light; c.fillRect(0, g.top, W, g.bottom - g.top);
    c.fillStyle = P.grid;
    for (let i = 0; i <= S.cols + 1; i++) { const R = S.rect(i, 0); c.fillRect(Math.round(rtl ? R.x + R.w : R.x), g.top, 1, g.bottom - g.top); }
    for (let r = 0; r <= S.rows; r++) c.fillRect(0, Math.round(S.yOf(r)), W, 1);
    // headers: letters across, numbers down (on the reading side)
    const hx = rtl ? W - g.head : 0;
    c.fillStyle = P.head; c.fillRect(hx, g.top, g.head, g.bottom - g.top); c.fillRect(0, g.top - g.headH, W, g.headH);
    c.fillStyle = P.shellLine; c.fillRect(0, g.top - 1, W, 1.5); c.fillRect(rtl ? hx : g.head - 1, g.top - g.headH, 1.5, g.bottom - g.top + g.headH);
    c.save(); c.fillStyle = P.shellText; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr';
    const fs = Math.max(9, Math.round(18 * Math.min(1, z * 1.3)));
    c.font = `500 ${fs}px "${mono}"`;
    for (let i = 0; i < S.cols; i++) { const R = S.rect(i, 0); c.fillText(i < 26 ? colName(i) : '', R.x + R.w / 2, g.top - g.headH / 2); c.fillStyle = P.shellLine; c.fillRect(Math.round(rtl ? R.x : R.x + R.w), g.top - g.headH, 1, g.headH); c.fillStyle = P.shellText; }
    for (let r = 0; r < S.rows; r++) { if (z < 0.7 && r % 2) continue; c.fillText(String(r + 1), hx + g.head / 2, S.yOf(r) + S.rh / 2 + 1); }
    c.restore();
  };
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  // title bar and toolbar
  x.fillStyle = P.shell; x.fillRect(0, 0, W, F.toolY);
  for (let i = 0; i < 3; i++) { x.fillStyle = P.shellLine; x.fillRect(W - 40 - i * 46, 22, 18, i === 0 ? 18 : i === 1 ? 2 : 14); }
  x.fillStyle = P.shellLine; x.fillRect(W / 2 - 110, 26, 220, 10);
  x.fillStyle = P.shell2; x.fillRect(0, F.toolY, W, F.toolH);
  x.save(); x.font = `700 24px "${mono}"`; x.textBaseline = 'middle'; x.textAlign = 'center'; x.direction = 'ltr';
  const tools = ['B', 'I', 'U', '|', 'A', '|', '%', '.0', '|', '#', '=', '|', '+', '-'];
  let tx = 30;
  for (const s of tools) {
    if (s === '|') { x.fillStyle = P.shellLine; x.fillRect(tx, F.toolY + 16, 1.5, F.toolH - 32); tx += 22; continue; }
    x.fillStyle = P.light; x.fillRect(tx, F.toolY + 12, 48, F.toolH - 24); x.strokeStyle = P.shellLine; x.lineWidth = 1; x.strokeRect(tx + 0.5, F.toolY + 12.5, 47, F.toolH - 25);
    x.fillStyle = P.shellText; x.fillText(s, tx + 24, F.toolY + F.toolH / 2 + 1); tx += 58;
  }
  x.restore();
  // name box and formula bar frames
  x.fillStyle = P.shell; x.fillRect(0, F.barY - 10, W, F.barH + 20 + (g.top - g.headH - F.barY - F.barH - 10));
  x.fillStyle = P.light; x.fillRect(F.nameX, F.barY, F.nameW, F.barH); x.fillRect(F.fxX, F.barY, W - F.fxX - 12, F.barH);
  x.strokeStyle = P.shellLine; x.lineWidth = 1.5; x.strokeRect(F.nameX, F.barY, F.nameW, F.barH); x.strokeRect(F.fxX, F.barY, W - F.fxX - 12, F.barH);
  x.save(); x.font = `italic 600 26px "${mono}"`; x.fillStyle = P.shellText; x.textBaseline = 'middle'; x.direction = 'ltr'; x.textAlign = 'left';
  x.fillText('fx', F.fxX + 16, F.barY + F.barH / 2); x.restore();
  x.fillStyle = P.shellLine; x.fillRect(F.fxX + 58, F.barY + 10, 1.5, F.barH - 20);
  grid(x, 1);
  // tab bar and status bar
  x.fillStyle = P.shell; x.fillRect(0, g.bottom, W, H - g.bottom);
  x.fillStyle = P.shellLine; x.fillRect(0, g.bottom, W, 1.5);
  x.fillStyle = P.shell2; x.fillRect(0, g.bottom + F.tabH, W, 1.5);
  const tabX = rtl ? W - 90 - 260 : 90;
  x.fillStyle = P.light; x.fillRect(tabX, g.bottom, 260, F.tabH - 6); x.fillStyle = P.accent; x.fillRect(tabX, g.bottom + F.tabH - 10, 260, 4);
  x.fillStyle = P.shellLine; x.fillRect(rtl ? tabX - 140 : tabX + 280, g.bottom + 12, 120, F.tabH - 30);
  return {
    palette: P, F, mono,
    tabX,
    drawSheet(ctx, z) { grid(ctx, z); },
    draw(ctx, t) { ctx.drawImage(cv, 0, 0); },
  };
}
