# خط المصنع · Factory Flow

**طابعه:** مصنع مرسوم من الأمام ومقطوع كبيت الدُّمى، واقف في الليل بسقف منشاري ومدخنة. في داخله غرف، كل غرفة محطة عمل بإطار ملوّن، وتصل بينها أنابيب غليظة، وتحت المنطقة الآمنة أرض المصنع: سير يحمل صناديق، وتروس تدور، وعاملان صغيران بلا وجوه. ألوان مسطّحة، وخطوط حدود سميكة، وظلّ مسطّح مزاح قليلًا، ولا شيء ناعم أو متوهّج. الكلام يُكتب داخل الغرف المضاءة أو على لوحات معدنية مثبّتة بالبراغي.

**يناسب:** المصانع والإنتاج، والمطابخ المركزية، وخدمات التوصيل والتخزين، والوكالات التي تشرح «كيف نشتغل»، وكل علامة تحكي عملية تحوّل شيئًا إلى شيء على مراحل.

**حركته المميِّزة:** المكبس. الكلمات تصل كالبضاعة: تركب السير من جهة القراءة وتقف في أماكنها واحدة بعد الأخرى، ثم ينزل مكبس من السقف على الكلمة المهمة ويختمها، فتصير على ملصق بلونك. وفي القائمة يسقط صندوق في الأنبوب طابقًا طابقًا، وكل طابق يصله تُضاء غرفته ويبدأ عمله. وفي المقارنة تُرفض القيمة القديمة ويُطفأ ضوء غرفتها، ويمرّ الصندوق في آلة تدور تروسها، ويخرج في الغرفة الجديدة فتُختم القيمة الجديدة.

**ألوانك فيه:**
- لونك الداكن هو الليل خارج المصنع، والجدران والغرف درجات من لونك الفاتح فيه، تفتح حين يُضاء الضوء.
- لونك الفاتح للكتابة داخل الغرف، وللوحات المعدنية التي يُكتب عليها بلونك الداكن.
- لون التمييز لإطارات الغرف، والأنابيب، وملصق الختم الذي تقع عليه الكلمة المهمة (تُكتب عليه بأوضح لونيك).
- الصناديق والتروس والفولاذ مزيج من لون التمييز ولونيك الآخرين.

**يتجنّب:** المنظور والأيزومتري، والتدرّجات والتوهّج، والوجوه والتعابير على العمال، واليد التي ترسم، والكتابة على الجدار مباشرة بلا غرفة أو لوحة، والارتداد المطاطي.

## For Claude

- Palette from `palette(brand, tokens)` in `look/motion.js`: the darker brand colour is the night, `room`/`off`/`wall` are steps of the lighter colour into it, the accent is frames, pipes and the stamp label; plaques are `P.plaque` with `P.onPlaque` lettering; text on the accent is `P.onAccent`.
- Every readable word sits inside a lit room (`M.room`) or on a plaque (`M.plaque`). Everything solid is drawn with `M.shape`: thick outline plus a flat offset shadow, no blur.
- Motion grammar: words `M.ride` in on the belt from the reading side (whole words, staggered), and ride on out at the exit; a room's light comes on (`lit`) before its contents arrive; the key word is stamped by `M.press` and set on `M.label` at the moment of the hit. A crate (`M.crate`) falls down a pipe with `G` to say which station starts next.
- The ground's belt, crates, gears and smoke run on the reel clock, so a held line is never still; the rest of the factory is drawn once.
- The joint is the roller shutter, a tone of the wall (never a flash). Keep the works floor (belt, gears, workers) below the safe area.
