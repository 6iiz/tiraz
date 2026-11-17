// scroll.js · mechanics for a page that answers the visitor's scroll and hand (guides/web.md section 12).
// It holds no look: every distance, duration, angle and ease is the brand's decision, written in the page's own stylesheet and script.
// Most helpers only set a CSS custom property, so what moves and how stays in the stylesheet.
// Copy this file into the site folder (site/kit/scroll.js) and import it from there. All of it is an enhancement: the page must be
// complete and readable with JavaScript off, and calm under reduced motion (sections 7, 8 and 12).
//
//   import { reduced, range, damp, progress, pinned, onScroll, onFrame, pointer, sectionState, seen, depth, lean, count } from './kit/scroll.js';

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (v, a, b) => clamp((v - a) / (b - a));                              // 0..1 while v goes from a to b
export const damp = (now, to, speed, dt) => lerp(now, to, 1 - Math.exp(-speed * dt));     // eases `now` toward `to` the same way at any frame rate

// How far an element has travelled through the window: 0 when its top edge meets the bottom of the window, 1 when its bottom edge
// leaves the top. A moment tied to this number moves only when the visitor scrolls, and at their speed.
// `top` and `bottom` are the pixels of the window that something fixed already covers (a band that stays at the top of a phone
// screen, a bar at the bottom): the element then travels through what is left.
export function progress(el, { top = 0, bottom = 0 } = {}) {
  const r = el.getBoundingClientRect(), view = innerHeight - top - bottom;
  return clamp((innerHeight - bottom - r.top) / (view + r.height));
}

// For a tall section with a `position: sticky` screen inside it: 0 when the screen sticks, 1 when it lets go.
// The scroll itself is never held or slowed: the section is simply tall, and scrolling on always leaves it.
// `top` and `bottom` as in progress(), for a screen that sticks below a band or above a bar.
export function pinned(el, { top = 0, bottom = 0 } = {}) {
  const r = el.getBoundingClientRect(), span = r.height - (innerHeight - top - bottom);
  return span <= 0 ? 0 : clamp((top - r.top) / span);
}

// Calls fn() once now, then at most once a frame while the page scrolls or the window changes size. Returns a function that stops it.
export function onScroll(fn) {
  let asked = false;
  const run = () => { asked = false; fn(); };
  const ask = () => { if (!asked) { asked = true; requestAnimationFrame(run); } };
  addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
  ask();
  return () => { removeEventListener('scroll', ask); removeEventListener('resize', ask); };
}

// A loop for what moves by itself or eases toward the hand: fn({ t, dt }) every frame, in seconds. It sleeps while the tab is hidden.
// Under reduced motion it calls fn once with dt 0 and never again, unless `always` is set (then standing still is the caller's job).
export function onFrame(fn, { always = false } = {}) {
  if (reduced() && !always) { fn({ t: 0, dt: 0 }); return () => {}; }
  let id = 0, start = 0, last = 0, stopped = false;
  const tick = (now) => {
    if (stopped) return;
    if (!start) start = last = now;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;        // a long pause never turns into a jump
    fn({ t: (now - start) / 1000, dt }); id = requestAnimationFrame(tick);
  };
  const wake = () => { cancelAnimationFrame(id); if (!document.hidden && !stopped) id = requestAnimationFrame(tick); };
  document.addEventListener('visibilitychange', wake); id = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(id); document.removeEventListener('visibilitychange', wake); };
}

// Where the pointer is, from -1 to 1 across the window (or across one element), 0,0 in the middle. The values are raw:
// ease them with damp() inside onFrame(). `active` is false until the pointer has moved and after it leaves; a finger leaves when
// it lifts, so nothing stays leaning toward the last place a phone was touched. `type` is 'mouse', 'touch' or 'pen', and `down`
// is true while a button or a finger is pressed: a scene that follows a drag on a phone reads x while down is true and eases back
// after (keep touch-action: pan-y on what is dragged, so the page still scrolls up and down). `startX` and `startY` are where the
// press began, so how far a drag has gone is x - startX.
export function pointer(el) {
  const p = { x: 0, y: 0, active: false, down: false, type: '', startX: 0, startY: 0 };
  const move = (e) => {
    const r = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    p.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); p.y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    p.active = true; p.type = e.pointerType || 'mouse';
  };
  const on = el || window, lift = (e) => { p.down = false; if (e.pointerType === 'touch') p.active = false; };
  on.addEventListener('pointermove', move, { passive: true });
  on.addEventListener('pointerdown', (e) => { move(e); p.down = true; p.startX = p.x; p.startY = p.y; }, { passive: true });
  addEventListener('pointerup', lift, { passive: true }); addEventListener('pointercancel', lift, { passive: true });
  (el || document.documentElement).addEventListener('pointerleave', () => { p.active = false; });
  return p;
}

// The state of the world follows the section on one line of the window: when a matching section crosses that line, its
// data-<attr> (or its id) is written to <html data-<attr>="…">. The stylesheet does the rest: custom properties under
// :root[data-<attr>="…"], and a transition on the colours that change. fn(value, section) is called on every change.
// `line` is where the line sits, 0 at the top of the window and 1 at the bottom (0.5, the middle, unless something fixed covers
// part of the window: then it is the middle of what is left).
export function sectionState(selector, { attr = 'state', fn = null, line = 0.5 } = {}) {
  const root = document.documentElement, sections = [...document.querySelectorAll(selector)];
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const at = clamp(line, 0.01, 0.99) * 100;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { const v = e.target.dataset[attr] || e.target.id; if (v && root.dataset[attr] !== v) { root.dataset[attr] = v; if (fn) fn(v, e.target); } }
  }, { rootMargin: `-${at}% 0px -${100 - at}% 0px` });
  sections.forEach((s) => io.observe(s));
}

// Adds a class to each matching element the first time it comes into view, for an entrance that plays once. Hide nothing in the
// default state: write the hidden start as `html.js .x:not(.seen)`, so a page without JavaScript shows everything. This function
// adds the `js` class itself (a layout that needs the class before the first paint adds it from a line in the page's head, see
// guides/web.md section 12). Under reduced motion every element gets the class at once. An element that takes the keyboard focus
// before it was seen, or holds what took it, is finished at once: focus never lands on something still hidden.
// An element inside a screen that stays in the window (position: sticky or fixed) may sit below the line the others cross for as long
// as the screen holds, so it counts as seen once most of it is in the window. On a page that already stands as plain as it was
// written (window.pageIsPlain: the script took too long, section 12), every element is finished at once and nothing is hidden again.
export function seen(selector, { cls = 'seen', margin = '0px 0px -12% 0px' } = {}) {
  const els = [...document.querySelectorAll(selector)];
  if (window.pageIsPlain) { els.forEach((e) => e.classList.add(cls)); return; }
  document.documentElement.classList.add('js');
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add(cls)); return; }
  const done = (el) => { el.classList.add(cls); io.unobserve(el); held.unobserve(el); };
  const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) done(e.target); }, { rootMargin: margin });
  const held = new IntersectionObserver((entries) => { for (const e of entries) if (e.intersectionRatio >= 0.6) done(e.target); }, { threshold: 0.6 });
  const stays = (el) => { for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const how = getComputedStyle(p).position; if (how === 'sticky' || how === 'fixed') return true; } return false; };
  els.forEach((e) => { io.observe(e); if (stays(e)) held.observe(e); });
  document.addEventListener('focusin', (ev) => {
    for (const e of els) if (!e.classList.contains(cls) && e.contains(ev.target)) done(e);
  });
}

// Depth from flat layers: each element with data-depth="0.2" … "0.6" gets --shift, the pixels it should lag behind its section as
// the page scrolls. The stylesheet uses it: transform: translate3d(0, var(--shift, 0px), 0). Small far things take a low number
// (and may be blurred a little), large near things a high one. Nothing moves under reduced motion.
export function depth(selector = '[data-depth]') {
  const els = [...document.querySelectorAll(selector)];
  if (!els.length || reduced()) return () => {};
  return onScroll(() => {
    for (const e of els) {
      const r = (e.closest('section') || e.parentElement).getBoundingClientRect();
      const off = r.top + r.height / 2 - innerHeight / 2;                                  // 0 when the section is centred in the window
      e.style.setProperty('--shift', (off * parseFloat(e.dataset.depth || '0')).toFixed(1) + 'px');
    }
  });
}

// A card that leans toward the pointer: sets --lean-x and --lean-y (degrees, at most `max`) on the element while the pointer is over
// it and eases them back when it leaves. The stylesheet decides the rest, for example
// transform: perspective(900px) rotateX(var(--lean-x, 0deg)) rotateY(var(--lean-y, 0deg)). Only where a pointer can hover.
export function lean(el, { max = 6, speed = 9 } = {}) {
  if (reduced() || !matchMedia('(hover: hover)').matches) return () => {};
  const p = pointer(el); let x = 0, y = 0, stop = null;
  const wake = () => {
    if (stop) return;
    stop = onFrame(({ dt }) => {
      x = damp(x, p.active ? -p.y * max : 0, speed, dt); y = damp(y, p.active ? p.x * max : 0, speed, dt);
      el.style.setProperty('--lean-x', x.toFixed(2) + 'deg'); el.style.setProperty('--lean-y', y.toFixed(2) + 'deg');
      if (!p.active && Math.abs(x) < 0.02 && Math.abs(y) < 0.02) { stop(); stop = null; }   // at rest: the loop ends until the pointer returns
    });
  };
  el.addEventListener('pointerenter', wake);
  return () => { el.removeEventListener('pointerenter', wake); if (stop) stop(); };
}

// A number that counts up to the value written in the page, once, when it is first seen. The final text is put back exactly as it
// was written (the fact as it stands in facts.md), with its separators and its digit system. Under reduced motion nothing counts.
// Set it up when the page mounts. A number that is already in front of the visitor when this is called stays as written: counting
// it would show it, take it back to zero and bring it up again. One that seen() still hides, or that is below the window, counts.
export function count(el, { duration = 900, ease = (t) => 1 - Math.pow(1 - t, 3) } = {}) {
  const original = el.textContent, m = original.match(/[\d٠-٩][\d٠-٩.,٫٬]*/);
  if (!m || reduced() || window.pageIsPlain || !('IntersectionObserver' in window)) return;
  const here = el.getBoundingClientRect();
  const shown = !el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true });
  if (shown && here.width > 0 && here.bottom > 0 && here.top < innerHeight) return;
  const arabic = /[٠-٩]/.test(m[0]), latin = m[0].replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const sep = (latin.match(/[,٬](?=\d{3}(\D|$))/) || [''])[0], dec = latin.includes('.') || latin.includes('٫') ? (latin.split(/[.٫]/)[1] || '').length : 0;
  const value = parseFloat(latin.replace(/[,٬]/g, '').replace('٫', '.'));
  if (!isFinite(value)) return;
  const show = (v) => {
    let s = v.toFixed(dec); if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    if (arabic) s = s.replace(/\d/g, (d) => String.fromCharCode(0x660 + +d));
    el.textContent = original.replace(m[0], s);
  };
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect(); const t0 = performance.now();
    const step = (now) => { const t = clamp((now - t0) / duration); if (t < 1) { show(value * ease(t)); requestAnimationFrame(step); } else el.textContent = original; };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(el);
}
