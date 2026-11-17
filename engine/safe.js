// safe.js · where text may sit on a 1080x1920 reel.
// Meta's Ads Guide for Instagram Reels (read 2026-11-17) says to keep text, logos and key elements out of the top 14%, the bottom 35%
// and 6% on each side: the app's own header, caption, buttons and call-to-action cover them. The pixel values are arithmetic from
// those percentages. Everything a viewer must read sits inside SAFE. A brand's small persistent mark below it is decoration: it may
// be covered, so nothing depends on it being read.
export const SAFE = { top: 270, bottom: 1248, left: 70, right: 1010 };
export const LINE_GAP = 1.6;       // line height as a multiple of the font size: Arabic with marks above and below needs more than Latin's 1.5
