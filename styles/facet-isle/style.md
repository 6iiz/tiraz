# الجزيرة المضلعة · Facet Isle

**الطابع:** جزيرة صغيرة معلّقة في السماء، مبنية من أعمدة سداسية مسطّحة الأوجه، تقف في بحر من مثلّثات صغيرة يميل كل منها مع الموج فيلمع وحده. نراها من فوق بزاوية ثابتة بلا منظور، كأنها مجسّم على طاولة، وهي تدور ببطء شديد طوال الريل فيتبدّل ضوء كل وجه وهو يمرّ أمام الشمس. في الثواني الأولى تنبت عليها أشجار مخروطية وبيوت بسقوف مائلة وبرج مراقبة، وفوقها حجران كريمان يطفوان، وفي السماء غيوم مضلّعة تمشي على مهل. الكلام في السماء فوق الجزيرة، والقوائم والمقارنات على ألواح مشطوفة الأطراف كأنها قطع كريستال.

**لمن يناسب:** الألعاب والتطبيقات، وشركات التقنية الودودة، والتعليم والأطفال، والسياحة والمنتجعات، والعقار والمشاريع السكنية، وكل علامة تحب أن تقول «نحن نبني عالمًا صغيرًا متقنًا» بهدوء ولطف.

**الحركة المميِّزة:** الهبوط بنطّة. كل شيء يسقط من فوق ويتجاوز مكانه قليلًا ثم يستقرّ: الكلمات، والألواح، والأشجار وهي تنبت. وفي الأرقام يرتفع عمود الجزيرة الأوسط على أربع نطّات ومعه الرقم يعدّ، وجيرانه الستة يرتفعون خلفه. وفي المقارنة يتشقّق اللوح القديم وينقسم نصفين يميلان ويخفتان، ثم يهبط الجديد. وبين المشاهد ينفتح المشهد التالي من خلايا سداسية تنمو من الجزيرة صعودًا.

**كيف يوزّع ألوان الزبون:**
- لون الخلفية (`bg`) هو السماء، ويميل في أسفلها نحو مسحة خفيفة من لون التمييز.
- لون النص (`text`) للكلام في السماء، ومزيج منه أهدأ للعبارات التمهيدية والعناوين.
- لون التمييز (`accent`) للعشب وأسقف البيوت والحجارة الطافية، وللّوح الذي يقف عليه المهم، وللعمود الذي يحمل الرقم، ولميدالية الشعار في الخاتمة.
- الحجر والرمل والبحر مزائج من ألوانك الثلاثة، والظلّ على كل وجه خطوة نحو لونك الداكن والضوء خطوة نحو لونك الفاتح، فلا لون من خارج هويتك.

**يتجنّب:** التدرّجات الناعمة على الأجسام، والظلال الضبابية، والملمس والصور، والمنظور والأفق، وإمالة الكلام أو تدويره، والكتابة فوق الجزيرة.

## For Claude

- Palette from `motion.palette(brand)`: `bg` sky, `text` words, `muted` leads and titles, `accent` key and hero solids, `panel` list and compare bars; text on a fill uses `P.on(fill)`; key words on the sky use `P.keyText`. Facet shading is `P.tone(base, n·light)`, a step towards the brand's light or dark colour, never a new hue.
- 3D is faked in 2D: convex solids from `prismY`, `prismZ`, `pyramid`, `gem` drawn by `drawSolid` (back faces culled, flat tone per face, painter's order by `depthOf`). Build faces in `create`, not per frame. Keep the island below the safe area (`tokens.isle`), text above it.
- One motion: `drop` (fall with the `B` bounce, about 6 % over) in, `lift` out. Words arrive whole, staggered so the first line is complete before frame 0 when `at` is -0.8. No other bounce curves, no rotation of text.
- A key phrase gets one emphasis: in a line, one accent plinth under the whole run (`runs(layout(...))`) with the words in `keyText`; in a list, one accent inlay. Never one box per word.
- Leads and labels fit with `minPx: 44` and wrap to two rows instead of shrinking further.
- The island turns with the reel's time (`ground.turnAt`); parts that add solids pass them to `ground.draw(ctx, t, extra)` so they sort with the tiles.
- Sounds are soft: `pop` (low/mid/high) on landings, `shimmer` on gems and the payoff, `scratch` on the crack, `swish` on the honeycomb joint.
