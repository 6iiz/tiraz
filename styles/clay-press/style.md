# صلصال · Clay Press

**الطابع:** عالم صغير من الصلصال على طاولة فاتحة، مبني بثلاثة أبعاد حقيقية. الكلمات والأرقام والشعار قطع صلصال طرية بحواف مدوّرة وسطح مطفأ فيه آثار أصابع ونتوءات خفيفة، تحت ضوء دافئ من الأعلى يرمي ظلالًا ناعمة على الطاولة. الحركة تمشي على طريقة تحريك الدمى صورةً صورة: اثنتا عشرة وضعية في الثانية، وبين الوضعية والتي بعدها لا يتحرك شيء. المزاج ودود ودافئ ومرِح.

**يناسب:** المقاهي والمخابز ومحلات الحلويات، ومنتجات الأطفال والألعاب، والمدارس والأنشطة، والعلامات العائلية والمحلية، وكل علامة تريد أن تبدو قريبة وخفيفة الظل ومصنوعة باليد. ويناسب الرسائل البسيطة المبهجة، ولا يناسب الأخبار الجادة ولا لغة المؤسسات الرسمية.

**حركته المميزة:** السقوط والانضغاط. كل كلمة تسقط على الطاولة، فتنبطح لحظة اللمس ثم تعود وتتمايل حتى تستقر. الكلمة المهمة قطعة صلصال سمينة بلون التمييز، تسقط قبل جيرانها وتنضغط أكثر منهم. وفي المقارنة تمرّ أسطوانة صلصال فوق القيمة القديمة فتفردها رقيقة كالعجين، ثم تسقط القيمة الجديدة سمينة تحتها. وبين المشاهد ينفتح ثقب متموّج في وسط الطاولة يكشف المشهد التالي. وفي الخاتمة تسقط كتلة صلصال بلون التمييز، وينزل شعارك عليها كالختم فينغرس فيها، ثم يسقط اسمك وحسابك وشعارك تحتها.

**ألوانك فيه:**
- الأفتح بين لون الخلفية ولون النص هو **الطاولة**، دائمًا، مهما كانت هويتك.
- الأغمق هو **صلصال الكلام**، بعد تليينه قليلًا بلون الطاولة حتى تظهر عليه الإضاءة.
- **لون التمييز** للكلمة المفتاحية، وللرقم الكبير، وللقيمة الجديدة، ولحبّات القائمة، وللكتلة التي يُختم فيها الشعار.
- مزيج الداكن والفاتح للمقدّمات والعناوين الصغيرة والقيمة القديمة والأسطوانة.
- الضوء أبيض دافئ محايد، فلا يضيف لونًا من عنده.

**يتجنّب:** اللمعان والمعدن والزجاج، والحركة الناعمة المستمرة (كل شيء يتحرك بوضعيات متقطعة)، والتلاشي، والخطوط الرفيعة، والنصوص المسطّحة فوق الطاولة إلا العلامة الصغيرة أسفل الشاشة.

## For Claude

- Built on `/engine/three3d.js`. `ground.js` is the world: one shared WebGL canvas for every scene on the page, one THREE scene per part, the light table, lights, clay materials, and builders (`word`, `text`, `logo`, `slab`, `ball`, `drop`). Build every piece in `create()`; `draw()` only calls `world.frame(ctx, t, update)`.
- `world.frame` steps time in poses (`motion.js`, `FPS` = 12, counted on the reel clock) and renders only when the pose changes; between poses it repeats a cached picture. Never animate outside `update(tq, k)`, and never read `t` inside it: use `tq`.
- Text: fit with `kit.fit` (rows, size), then `world.text(fitted, …)` lays out one clay piece per word from the pieces' own widths. Return `[[objects, text], …]` from `update` so the safe-area check measures every row; pieces in the air are skipped by the measure.
- Motion vocabulary only: `drop` (fall along the line of sight, squash on contact, damped wobble), `hop` for exits (crouch, then up and out), the roller for deletions, the stamp for the logo. Key pieces fall a pose earlier with `amp` 1.6 or more. Stagger by whole poses.
- Kept inside the style: our own glyph extrusion (`solidText`, cached geometry, bevel tuned for clay) with outlines split by the non-zero rule (`solidsByWinding`), our own SVG reader for the logo (`svgPath`, arcs included), and Latin words shaped left to right. They were written when the base still misread some Kufam counters and arc logos; the base is fixed now, and these stay because they are tested here and give the bevel control clay needs.
- Colour: table = lighter brand colour, ink = darker mixed 16 % toward the table, accent untouched; tone mapping is Neutral so the accent keeps its hue. Never add a hue.
