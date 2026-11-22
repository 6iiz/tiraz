# إيقاع الظلال · Shadow Beat

**طابعه:** غروب مصنوع من لونك وحده: سماء تبدأ عميقة في الأعلى وتصفو نحو الأفق، وشمس كبيرة على خط البحر تغيب شيئًا فشيئًا طوال الريل، وماء يعكسها بعمود من اللمعات. على رصيف فوق الماء ثلاثة راقصين سود كالظلال يغيّرون وقفتهم مع كل نبضة، وانعكاسهم يتكسّر في الموج. والكلام نفسه ظلّ أسود آخر على السماء المضيئة.

**يناسب:** المقاهي والمطاعم على البحر أو على السطوح، والسياحة والفنادق، والموسيقى والحفلات، والرياضة والرقص، والعطور، وكل علامة تريد طاقة على الإيقاع بمزاج دافئ وأنيق.

**حركته المميزة:** التجمّد على النبضة المهمة. الكلمات تقف في أماكنها بضربة قصيرة على أنصاف النبضات ثم تثبت، والراقصون يبدّلون وقفتهم على كل نبضة. وحين تنزل العبارة المهمة، على قطعة سوداء والكلام فيها بلون الشمس، يتجمّد الراقصون على وقفتهم وتتوقف اللمعات والغيوم، ولا يتحرك إلا الشمس وهي تنزل. وفي الخاتمة تطلع شمس ثانية من الأفق وفيها شعارك كظلّ.

**ألوانك فيه:**
- لون التمييز (`accent`) هو السماء والبحر، يُفتَّح نحو لونك الفاتح حتى يصير الكلام الأسود عليه واضحًا بنسبة تباين عالية، ويُعتَّم نحو الداكن في أعلى السماء وفي عمق الماء.
- لونك الداكن هو كل الظلال: الراقصون والرصيف والكلام والقطع السوداء.
- لونك الفاتح هو قرص الشمس ولمعاتها، والكتابة داخل القطعة السوداء.

**يتجنّب:** أي تفصيل داخل الظل، والحدود والتدرّجات على الأشكال السوداء، والكتابة على الماء الداكن، والانزلاق والتلاشي الطويل، والوميض، وسماء باهتة لا يقرأ عليها الأسود.

## For Claude

- The sky colour is computed in `palette()`: the accent mixed toward paper until `contrast(ink, sky) ≥ tokens.sky.contrast` (6.2). Every read text is ink on that sky (y 270–1248 is always sky), or sun-coloured inside an ink slab. Never put text below `tokens.horizon`.
- Motion grammar: `snap` (three-frame 6% swell, then still) on half-beats; no drift on text. Exits sink below the horizon (`sink`, clipped at the waterline).
- The freeze is the signature: each part passes `freeze: [t0, t0 + tokens.dur.freeze]` to `ground.draw` at its key moment (key phrase, number landing, new value). Use it once per part.
- A `*key phrase*` is ONE ink slab over the whole run (`keyRuns` + `slab`), words in `pal.sun`. `balanced` keeps it on one row and avoids orphans. Leads/titles ≥ 44 px, two rows rather than shrinking.
- Opening line: all words land within `at + 0.1 + tokens.dur.words` (0.65 s), so `at = -0.8` gives a whole hook at frame 0.
- Dancers live in `ground.js` on the jetty below the safe area and run on reel time (`clock`); the ending holds `poseUp`. Keep text away from y > 1248.
- Sound: soft kinds. `swish`/`thump` per word or item, `shimmer` on each freeze, `impact` once when a number lands or the new value appears, `rustle` when the dancers start again, `whoosh` on the whip-pan joint.
