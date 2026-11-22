# النقش النحاسي · Burin Plate

**طابعه:** لوحة محفورة على النحاس ومطبوعة على ورق قديم مخطّط بخطوط الصناعة الخفيفة، كلوحات كتب العلوم القديمة. أثر ضغط اللوح ظاهر على الورق بحافة بارزة، وإطار من خط سميك وخيط رفيع، وشريط زخرفي من خطوط متموّجة متشابكة في الرأس. في أسفل اللوحة عيّنة: كرة تُحفر أمامك بالترتيب الكلاسيكي، محيط يتغيّر سُمكه، ثم خطوط تلتفّ مع الشكل، ثم خطوط تتقاطع معها في الظل، ثم ظلّها على الأرض. لا يوجد لون رمادي مصمت: كل درجة مصنوعة من خطوط.

**يناسب:** العيادات والصيدليات والمختبرات، والمكتبات ودور النشر، والمحاماة والاستشارات، والعطور والمجوهرات والساعات، وكل علامة تريد أن تبدو متقنة وموثوقة وعريقة.

**حركته المميزة:** البناء بالخطوط. كل كلمة تُحفر على ثلاث مراحل: خطوط متوازية رفيعة يقطعها الإزميل من جهة القراءة، ثم خطوط تتقاطع معها، ثم تصير حبرًا مصمتًا. والخطوط والقواعد تُحفر بطولها، رفيعة في أولها، تنتفخ في وسطها، وتدقّ في آخرها. واللون يأتي في الآخر وباليد: غسلة شفافة بلونك تنفرش فوق الكلمة المهمة بعد أن يجفّ الحبر، وحافتها أغمق كالألوان المائية. وفي المقارنة يُلغى القديم كما تُلغى لوحة مستهلكة: بخطّين محفورين على شكل X. والانتقال قلب صفحة في مجلّد اللوحات.

**ألوانك فيه:**
- لونك الأفتح هو الورق، ولونك الأغمق هو حبر الحفر: الكتابة والخطوط كلها.
- لون التمييز لا يُكتب به أبدًا: هو الغسلة المائية الشفافة فوق الكلمة المهمة، وفوق الجديد في المقارنة، وداخل دائرة الشعار، وعلى العيّنة.
- الرماديات (أثر اللوح، الخيوط الرفيعة، الكلام الثانوي) مزيج من لونيك.

**يتجنّب:** المساحات الرمادية المصمتة، والخطوط المتساوية السُّمك كالرسم الهندسي، والتدرّجات الرقمية والظلال الناعمة والتوهّج، والكتابة بلون التمييز، والتلاشي، والكتابة فوق العيّنة أو الشريط الزخرفي.

## For Claude

- Palette from `palette()` in `look/motion.js`: paper = the lighter brand colour, ink = the darker; `accent` appears only as `wash()` (multiplied, about a third opaque, darker rim), laid after the ink it covers is solid. Never set text in the accent.
- Every word arrives through `engrave(c, p, box, size, color, rtl)` inside `kit.drawText`'s `each`: a sweep from the reading side in the hatch pattern, then the crossed pattern, then solid. Numbers and the logo use the same stages via `inkFor()`.
- Every line drawn is `swell()` (fine–thick–fine); rules are `ornament()` (cut from the middle outward); circles are `roundel()` (heavy + hairline).
- Layout is a plate: centred lettering, rules with lozenges, numbered roundels. Text stays inside the safe area, between the engine-turned band (y 126–224) and the specimen (below the safe area).
- Exit: `wiped()` clears the plate from the far side; the joint turns a leaf from the bound (reading) side. Both stay at paper brightness, so no flash.
- The ground's specimen is cut during the reel's first 2.5 s and washed at 2.6–3.4 s (on `clock`); its families are built once per brand. The band at the head shifts phase slowly so held frames stay alive.
