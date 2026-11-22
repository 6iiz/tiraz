# الألوان المائية · Wet Brush

**طابعه:** صفحة من دفتر رسّام على ورق قطني دافئ، ترسم نفسها أمامك. كل ما على الصفحة طبقات شفافة من لون علامتك، تتراكب فتغمق حيث تلتقي، ولها حافة أغمق حيث تجمّع الصبغ وهو يجف، وفيها حُبيبات وبقع رجعت إليها المياه. لا خطوط ولا إطارات: كل شيء ضربة فرشاة. في زاوية الصفحة بقعة لون كبيرة تنتشر على الورق المبلول، وفي أسفلها غسلة عريضة متدرّجة من لونك ولون الحبر، وكلاهما يزحف ببطء طول الريل كأن الماء لم يجفّ بعد.

**يناسب:** المقاهي والمخابز ومحلات الحلويات، والزهور والنباتات، والقرطاسية والكتب ومشاغل الأطفال، والعلامات اللطيفة الدافئة التي تريد أن تبدو مصنوعة باليد وبهدوء وفضول.

**حركته المميزة:** الفرشاة تمرّ والكلام يظهر خلفها. ضربة عريضة شاحبة من لونك تعبر السطر باتجاه القراءة، وكل كلمة تظهر لحظة تصلها الفرشاة، أولًا بلون الصبغ المبلول ثم تجف إلى لون الحبر. والكلمة المهمة تأخذ ضربة ثانية أقوى من اللون فوق الأولى، وتتطاير حولها قطرات صغيرة. وفي المقارنة يُرفع القديم عن الورق بضربة ماء نظيف تترك منه أثرًا باهتًا. وبين المشاهد تمسح ضربة ورق مبلول عريضة الصفحة القديمة وتكشف الجديدة.

**ألوانك فيه:**
- اللون الأفتح بين لونَي الخلفية والنص هو الورق، والأغمق هو الحبر الذي تجف إليه الكلمات.
- لون التمييز (`accent`) هو الصبغ: كل الضربات والبقع والقطرات طبقات شفافة منه، بقوى مختلفة.
- ما يُكتب فوق ضربة قوية من لونك يُختار بين لونيك الآخرين بحسب الأوضح، والقوة تُخفَّف تلقائيًا إن لزم ليبقى الكلام مقروءًا.

**يتجنّب:** الخطوط المرسومة والإطارات والأيقونات، والألوان المسطّحة المعتمة، والحواف الحادة، والحركة المنزلقة أو المرتدّة، والكتابة بلون التمييز مباشرة على الورق، وأي لون لا يأتي من ألوانك.

## For Claude

- Paper is the lighter of `bg`/`text`, ink the darker (`ground.pal`). Pigment is `pal.accent`, always glazed with `multiply` through `lay()`, `bloomSprite` or `splash()`. Text on a strong band is `pal.on(pal.tint(0.75))`; quiet text is `pal.quiet(k)` (4.5:1 on paper).
- No vector lines anywhere: shapes are band sprites (`band()`), round pools (`bloomSprite()`) and drops. Build sprites once in `create`; animate only how much of them is laid (`lay(..., p)`, eased with `BR`) or their spread.
- Words are never moved: they `develop()` when the brush front reaches them (`passTime()` from the band's x and times), showing in `pal.wet` and drying to their final colour. Use `boxes()`/`keySpans()` to time words and place key strokes.
- Key word: a second band at `tone.key` over the row's pale band (`tone.band`), and drops when the brush lifts. One strong stroke per line.
- Lifting (compare, joint) is a stroke of paper drawn `source-over` with `lay(..., 'source-over')`; paper over paper keeps the brightness steady.
- Sound: brushes and water, not clicks: `swish` per stroke, `rustle` for washes and the joint, a low `pop` for drops, `shimmer` once in the ending.
