# التعريض المزدوج · Ghost Overlay

**طابعه:** صورتان على فيلم واحد. ورق فاتح بلون علامتك الفاتح، وعليه هيئة داكنة لحيوان (رأس أيّل، طائر نورس، حوت) تعمل كنافذة: داخلها منظر طبيعي كامل بالأبيض والأسود، تلال ومن خلفها غابة صنوبر وبيوت صغيرة نوافذها مضاءة بلونك المميِّز، وهو اللون الوحيد في الصورة. حافة الهيئة تغمق نحو الداخل كما يحدث في التعريض الثاني الحقيقي، وتحت الكادر يظهر العالم الخارجي باهتًا جدًا. الحيوان حيّ: الأيّل يتنفّس ويحرّك رأسه، والنورس يضرب بجناحيه، والحوت يحرّك ذيله.

**يناسب:** المقاهي والمحامص، والسياحة والسفر، والمنتجات المرتبطة بمكان أو أصل (مزرعة، جبل، بلد)، والعلامات التي تحكي قصة الأصل والحنين: «كل فنجان فيه ريحة بلاد».

**حركته المميِّزة:** التطابق. كل كلمة تصل كصورتين: طيف باهت ونسخة أوضح منزاحتين عن بعضهما، تنزلقان حتى تنطبقا فتصيرا صورة واحدة حادة. والكلمة المفتاحية نفسها نافذة: حروفها مملوءة بغروب بلونك فوق تلال داكنة، يتحرّك داخلها أبطأ من الحروف، وتحتها خط رفيع بلونك كضوء مصباح. وفي الخاتمة يصير شعارك آخر نافذة، يدخل ومنظره منزاح عن نسخة باهتة من المنظر نفسه حوله، ثم ينزلق حتى يصير الداخل والخارج صورة واحدة.

**ألوانك فيه:**
- الأفتح بين لونيك هو الورق، والأغمق هو الحبر. فيبقى الأسلوب طباعة فاتحة مع أي هوية.
- كل درجات المنظر مزيج من الورق والحبر، من سماء فاتحة إلى صنوبر داكن.
- لون التمييز (`accent`) ضوء فقط: نوافذ البيوت، وغروب الكلمة المفتاحية، والخط تحتها، ونقطة كل بند في القائمة.

**يتجنّب:** تعبئة الهيئة بلون مسطّح أو نقش، والكتابة فوق النافذة، والحركة المرتدّة، والوميض، والهيئة الجامدة التي تنزلق كالبطاقة، وأكثر من لون واحد للضوء.

## For Claude

- Paper = the lighter of `colors.bg` / `colors.text`, ink = the darker (`palette` in `look/motion.js`); every grey is `mix(paper, ink, k)`; the accent is lamplight only.
- Text never sits on a window: the scene's silhouette lives in the lower part of the frame (mostly below `SAFE.bottom`), text in the upper part on plain paper.
- Every text arrives through `twice()` (a ghost pass and a print pass via `register`); exits lose register. Never fade text in place, never bounce.
- Key runs come from `keys(kit, f, pos, P, T, dir)`: their letters take the dusk pattern and one lamp rule per run (`runs()` merges a multi-word key phrase into one emphasis).
- Windows are `window(ctx, path, place, tex, tx, ty, P, p)` with the landscape built once in `create` (`landscape()`); the landscape drifts at `tokens.drift.inside`, the shape at `tokens.drift.shape` (two speeds). Silhouettes are `stag(nod)`, `gull(beat)`, `whale(swing)`: keep them alive with a slow sine of the clock.
- The hook must be fully registered at frame 0: all word arrivals in `line.js` end within about 0.8 s of `at`.
- Sound: soft kinds only (`rustle`, `swish`, `shimmer`, `tick`, `click`); the shimmer marks the moment of register or the lamp glow.
