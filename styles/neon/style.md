# نيون (neon)

## الطابع

لافتات نيون على جدار داكن من الطوب. الكلام لا يتحرك بل يُضاء: الأنبوب معلّق على الجدار مطفأً كزجاج باهت، ثم يشتعل ويتقطّع ضوؤه مرات قليلة قبل أن يثبت، ويفيض ضوؤه على الجدار خلفه. لكل أنبوب تقطّعه الخاص، فيبدو المشهد حيًّا كواجهة محل في الليل. الوهج ناعم ومحسوب، ونواة الحروف حادّة دائمًا حتى يبقى الخط العربي واضحًا.

## يناسب

المقاهي والمطاعم ومحلات الليل، والأزياء والموسيقى والفعاليات، والعروض المحدودة، وكل علامة تريد طاقة شبابية دافئة ونبرة قريبة من الشارع.

## الحركة المميزة

الاشتعال المتقطّع: الكلمات تشتعل واحدة بعد الأخرى بتقطّع لكل منها. وفي المقارنة "تموت" اللافتة القديمة: تتقطع ثم تبقى باهتة بلا وهج، ويشتعل الجديد تحتها بلون التمييز. والانتقال بين المشاهد انقطاع كهرباء قصير ثم عودة.

## كيف يستعمل ألوانك

- **اللون الداكن** هو الجدار.
- **اللون الفاتح** هو أنبوب النيون الأول (أبيض دافئ) لمعظم الكلام.
- **لون التمييز** هو الأنبوب الثاني: بنواة ساخنة تميل إلى الفاتح ووهج بلون التمييز الصافي، للكلمة المفتاحية والرقم والقيمة الجديدة والشعار وإطار الجملة الأولى. إذا كانت النواة لا تُقرأ بوضوح على الجدار صارت فاتحة وبقي الوهج بلون التمييز.

## ما يتجنّبه

الوهج الذي يطمس الحروف، والوميض السريع على الشاشة كلها، والحركة والانزلاق، وكثرة الألوان: أنبوبان فقط.

---

## For Claude

- Nothing moves; brightness does the work. Use `flick(p, seed)` to ignite, `douse(p, seed)` to switch off and `die(p, seed, rest)` for a tube that fails. Give every tube its own seed so stutters differ. Never use Math.random.
- Text is a tube made in `create()`: `sign(kit, fitted, placement, { base: pal.white, key: pal.hot }, pal, T, glass?)`, then `sign.draw(ctx, i => brightness)`. Shapes (frames, arrows, rules) are `shape(x, y, w, h, path, tube, pal, T, width)`. Both build their blur once; `draw()` only lays pictures and the sharp core.
- Light on the wall is `ground.spill(ctx, x, y, w, h, colour, b)` at the tube's brightness; keep it soft (tokens.tone.spill).
- Colours come only from `palette(brand, tokens)` (ground exposes it as `ground.pal`): `white` and `hot` tubes, `unlit` glass, `dead` for a failed sign that must still be read. Two tube colours only.
- Readability: the core is always drawn sharp on top of its bloom; keep `glow.nearA` modest; check a still at full size after any change to the glow tokens.
- No whole-frame flicker: only signs stutter. The joint dims the frame to the wall colour, never to a lighter colour.
