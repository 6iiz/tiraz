# المجسم المضوي · Projected Maquette

**الطابع:** غرفة عرض معتمة، وعلى قاعدة داكنة مجسّم أبيض لمدينة صغيرة: كتل بسيطة على شبكة شوارع ونهر يشقّ اللوح. فوقه جهاز عرض يرمي البيانات ضوءًا على المجسّم نفسه: يشتدّ على الأسطح، ويخفّ على الجدران المائلة عنه، ويفيض قليلًا على اللوح حول كل مبنى مضاء. المجسّم لا يتغيّر أبدًا، والذي يتغيّر هو الضوء فقط. والكلام يظهر على الجدار المعتم فوقه كقراءة هادئة: مربّع صغير بلون الطبقة، وسطر رفيع، ثم الجملة.

**لمن يناسب:** العقار والتطوير العمراني، والمعماريون والمكاتب الهندسية، والبلديات والمشاريع الكبيرة، وشركات البيانات والاستشارات، وكل علامة تريد أن تبدو دقيقة وهادئة وتشرح بالأرقام.

**الحركة المميِّزة:** طبقة ضوء واحدة لكل فكرة، ولكل طبقة إيماءتها: حافة ضوء تعبر الطاولة، أو أحياء تضيء واحدًا بعد واحد مع بنود القائمة، أو منسوب ضوء يصعد على الواجهات مع الرقم، أو مسح يعيد تلوين المجسّم كله حين يحلّ الجديد محلّ القديم. الكلمات لا تنزلق: تُشعَل كشريحة عرض، ومضة خافتة ثم تثبت وتتّضح. والعبارة المهمة تضيء بلون علامتك ويمتدّ منها خيط رفيع إلى المبنى الذي تتكلّم عنه. وفي الخاتمة ينطفئ الضوء، ويُعرض شعارك على الجدار، ثم تُضاء أنوار القاعة على المجسّم الأبيض.

**كيف يوزّع ألوان الزبون:**
- اللون الأغمق من لونيك هو الغرفة والقاعدة، والأفتح هو المجسّم الأبيض والكتابة.
- لون التمييز هو ضوء جهاز العرض وحده: على المجسّم، وفي مربّع الطبقة، وفي العبارة المهمة (يُفتَّح بلونك الفاتح إذا لم يكفِ وضوحه على الغرفة). وفي القوائم يتدرّج من لون التمييز نحو الأبيض، درجة لكل بند.
- الرماديات والظلال مزيج من لونيك.

**يتجنّب:** تلوين المجسّم نفسه (اللون ضوء، لا طلاء)، وتغيير الكتل أو تحريكها، وأكثر من طبقتين ضوئيتين معًا، والكتابة فوق المجسّم، والخطوط الشبكية والمسح الليزري، وأي اسم لمدينة أو أرقام لم تأتِ من الزبون.

## For Claude

- Room = the darker brand colour, model = the lighter one, projector = the accent (`pal.beam` is the accent a little toward white). The city is seeded boxes on an 8×5 grid with a river row (`tokens.model`); the camera orbits slowly on the reel clock (`tokens.cam`). Text lives above the model (y < ~1150); never put text over it.
- A part lights the model by passing `lit(b) -> [colour, strength] | null` and/or `level: { h, col, w }` to `ground.draw`. Buildings carry `band` (0–4 across the table) for districts; `ground.pick()` returns a tall front building for a pin; `ground.roof(b, t)` gives its roof on screen.
- Words switch on with `strike` (on, off, on, then focus) inside `kit.drawText`'s `each`; the hook (`at: -0.8`) is fully on before frame 0. No exits: the joint (a widening aperture of projected light) replaces the layer.
- Key words (`*…*`) are set in `pal.key` with an accent glow; a line draws one pin from its first key run to the picked building, which takes full light. One emphasis per phrase (`runs()` merges consecutive key words).
- Leads, titles and labels wrap at their size (`minScale: 1`) rather than shrink below ~48 px.
- Sounds are dry and few: `click` when a slide or district switches on, `tick` for steps, `swish` for washes, `ding` when a figure lands, `thump`/`shimmer`/`swell` in the ending.
