# الشبكة المجسّمة · Grid Monolith

**طابعه:** النظام السويسري وقد صار عمارة. أرضية فاتحة من كتل مربعة مصفوفة على ستة أعمدة، نراها من علٍ بعدسة مُزاحة فتبقى الخطوط مستقيمة ويظهر لكل كتلة جانبان. الكتل تعلو وتهبط على الإيقاع، وتحت كل سطر ترتفع منصّة تتبع حافته. الكلمات ألواح مجسّمة تنزلق واحدة بعد الأخرى من بوابة على سطرها في اتجاه القراءة، ثم تستقرّ وتنضغط قليلًا كأنها أُقفلت في مكانها. وحين ينتهي الكلام تهبط المنصّة وتغوص الكلمات معها في الأرض.

**يناسب:** الاستوديوهات والمكاتب المعمارية والهندسية، والشركات التقنية، وكل علامة تريد أن تبدو هادئة ودقيقة وواثقة ومبنية بعناية. ويناسب الرسائل التي فيها نظام أو خطوات أو أرقام.

**حركته المميِّزة:** الاستثناء. كل شيء يتحرّك على الشبكة وينضبط عليها، إلا وحدة واحدة بلون علامتك. تقف هذه الوحدة في كل مشهد في خانة من الشبكة، وفي الخاتمة تخرج منها بحركة مستقيمة ثابتة السرعة غير منضبطة على الخطوط، تكبر في طريقها، ثم تغوص في منصّتها ويُبثق شعارك المجسّم من موضعها نفسه.

**كيف يوزّع ألوانك:**
- الأفتح من لونيك (`bg` أو `text`) هو الأرضية والكتل، فالأرضية فاتحة دائمًا.
- الأغمق منهما هو حبر الكلمات، وبه تُصبغ كتل قليلة قائمة في الأرض.
- العبارة المهمة تُرفع على كتلة من الحبر وتُكتب بلون الأرضية، كتلة واحدة للعبارة كلها.
- لون التمييز (`accent`) لا يُكتب به شيء: هو الوحدة الوحيدة الخارجة على النظام، ثم شعارك.
- الرماديات والفواصل بين الكتل مزيج من لونيك.

**يتجنّب:** التلاشي والارتداد والدوران، والتوهّج والانعكاسات المعدنية، وزوايا الكاميرا المائلة على الكلام، وأي لون ثانٍ للإشارة، وأكثر من حركة غير منضبطة واحدة في الريل.

## For Claude

- Everything 3D lives in `look/ground.js`: `create()` builds one world per part (scene, instanced floor blocks, sun with one 2048 shadow map, shifted-lens camera); one WebGL renderer is shared by all parts of a reel. Layout is in frame pixels: the camera frustum is solved so the reading plane (`Zt` = stage + text depth) maps 1 unit to 1 px, so `place(slab, { row })` puts text exactly on grid rows (`rowY(j)`, six square cells per row across the safe area).
- Text is `W3.slab()` (extruded via `text3d`, no bevel, front in the colour, sides a lighter mix for crisp edges). Readable things move only by `W3.pose()`: words slide out of a clipping gate at their reading-start edge, lock with a small press, key runs lift on an ink block; exits sink along the line of sight so the screen box never leaves the safe area. `pose`/`still` call `kit.rec` every frame.
- Every text row gets a stage (`W3.stage(i, j, fn)`) under its cells; free cells breathe on the beat (`T.floor.rise`), a few standing ink blocks are sprinkled but never on reserved cells or under the mark.
- Colours: paper = lighter of bg/text, ink = darker, accent only on the unit and the logo. Never text in the accent.
- The only linear, unsnapped move is the unit's break-out in `ending.js`; don't add a second.
- Hook: line arrivals finish within 0.8 s of `at` (step shrinks for long lines), so `at: -0.8` is whole on frame 0.
- Build once in `create()`; `draw()` only moves and renders. No randomness except `hash()`.
