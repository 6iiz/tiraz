# مكعّبات بتنبني · Cube Build

**طابعه:** ورشة بناء صغيرة على طاولة عمل. أرضية بلون خلفيتك عليها شبكة إنشاء خافتة وعلامات صليب صغيرة، وعلى أطرافها أكوام قليلة من مكعّبات احتياطية. كل كلمة مهمة مبنية من مكعّبات صغيرة حقيقية لها وجه وجانب وظلّ، مرصوفة على شبكة دقيقة بما يكفي ليبقى كل حرف عربي واضحًا بنقاطه ووصلاته وحركاته. العبارات التمهيدية والتسميات مكتوبة مسطّحة فوق الطاولة بخطّك.

**يناسب:** شركات المقاولات والبناء والتطوير، ومراكز التعليم والبرمجة للصغار، واستوديوهات الألعاب، وكل علامة تريد أن تقول «نبنيها خطوة خطوة» بشكل مرح ومتقن معًا. ويناسب الأرقام التي تكبر والمقارنات بين «قبل» و«بعد».

**حركته المميِّزة:** البناء. المكعّبات تُرمى من جهة بداية القراءة، تتقلّب في قوس قصير، وتهبط على خاناتها بترتيب القراءة ثم تنضغط ضغطة صغيرة وهي تستقرّ. والرقم يعدّ بأن تقفز مكعّباته من شكل الرقم القديم إلى شكل الجديد، تتدحرج ربع دورة في الطريق، وتأخذ لون علامتك في الخطوة الأخيرة. وفي المقارنة يُشطب القديم بصفّ من مكعّبات لونك فوقه، ثم ينهار ركامًا على الطاولة، ومن الركام نفسه يُعاد بناء القيمة الجديدة. وبين المشاهد يُرصف المشهد التالي بلاطة بلاطة من الأسفل إلى الأعلى. وفي الخاتمة يُبنى شعارك من مكعّبات تنزل من فوق، صفًّا فوق صفّ كجدار.

**كيف يوزّع ألوانك:**
- لون الخلفية (`bg`) هو الطاولة، والشبكة عليها مزيج خافت منه ومن لون النص.
- لون النص (`text`) هو لون المكعّبات العادية، فتظهر دائمًا على الطاولة، فاتحة كانت أو داكنة.
- لون التمييز (`accent`) لمكعّبات الكلمة المهمة (وهي أعلى من غيرها)، وللقيمة الجديدة، ولخطوة العدّ الأخيرة، ولحجارة القائمة، ولشعارك. إن كان قريبًا من لون الطاولة فُتِّح نحو لون النص حتى يُقرأ.
- القيمة القديمة بمزيج رمادي من لونيك يبقى مقروءًا وهو مشطوب.

**يتجنّب:** المكعّبات الضخمة التي تضيّع نقاط الحروف، والنص الصغير المبني من مكعّبات (يُكتب مسطّحًا)، والمعدن والانعكاسات والتوهّج، والنسخ المموّهة من الكلام، وميل الكاميرا على الكلام، وأي لون من خارج العلامة.

## For Claude

- `look/ground.js` builds one world per part: a shifted-lens camera solved so the mat (z = 0) maps 1 unit to 1 frame pixel (layout stays in frame pixels), one shadow-casting key light (2048), the gridded mat, a few supply piles outside the safe area, and a shared WebGL renderer for the whole reel.
- Text becomes cubes with `W3.voxels(kit.fit(...), { x0, x1, y, align, pitch })`: the browser shapes and paints the words (lightly stroked by `vox.grow` so dots and marks survive), the painting is sampled on a square grid, and every covered cell is one instance of an InstancedMesh (`W3.pool`). Pitch is `size × vox.k` (about 18 cubes per em): don't voxelise text under ~80 px; leads, labels, titles, the handle and the slogan are flat (`W3.flat`, ≥ 44 px).
- `cubes.js` `builder()` throws a set in along the reading order (`fly.window`, `fly.dur`), snaps it, runs the hold ripple and lifts it off at `out0`; `rec()` reports each row to the check only while it is readable. Morphs (count steps, compare rebuild) use `pair()` + `hop()` from `motion.js`.
- The hook: arrivals finish inside 0.8 s of `at` (window 0.38 + flight 0.34), so `at: -0.8` is whole on frame 0.
- Colours only from `palette(brand)`: mat = bg, cubes = text, key = accent (lifted if close to bg), old = grey mix with contrast ≥ 3.2. Neutral tone mapping keeps the accent true.
- Build once in `create()`; `draw()` only writes instance matrices and renders. No randomness except `hash()`.
