# لونين وبس · Two-tone Grain

**الطابع:** عالم ثلاثي الأبعاد صغير مرسوم بحبرين فقط، كشاشات الحواسيب الأولى التي لا تعرف إلا الأسود والأبيض. لا رمادي على الشاشة أبدًا: كل درجة كثافةٌ من نقاط مرتّبة في نمط ثابت، وكل نقطة مربع صغير ظاهر. الكاميرا تنزلق فوق سهل لا ينتهي من مربعات الشطرنج نحو الأفق، وفي السماء كوكب مخطّط يدور ببطء، والنقاط ملتصقة بالأسطح نفسها فتدور مع الكوكب وتجري مع الأرض بدل أن ترتجف فوقها. الكلام يظهر داخل نوافذ كنوافذ أنظمة التشغيل القديمة: إطار بنقطة واحدة، وشريط عنوان مخطّط فيه مربع الإغلاق، وظل صلب من نقاط.

**لمن يناسب:** الشركات التقنية والبرمجيات وأدوات المطوّرين، والألعاب المستقلة، والاستوديوهات الرقمية، والمحتوى الذي يحب الحنين إلى الحواسيب القديمة، وكل علامة تريد أن تبدو ذكية ومختلفة وواضحة جدًا.

**الحركة المميِّزة:** التنقيط. لا شيء يتلاشى ولا ينزلق: النوافذ تظهر عبر نمط النقاط مستوى بعد مستوى، والكلمات تُكتب واحدة واحدة خلف مؤشر مربّع يقف مكان الكلمة لحظة ثم تحلّ هي محلّه. الزمن نفسه متقطّع، خمس عشرة خطوة في الثانية. وحين يُلغى شيء، يُشطب بخط ثم تُغطّى نافذته بنصف نقاط كأنها صارت معطّلة. والانتقال بين المشاهد تنقيط للإطار كله من مشهد إلى آخر.

**كيف يوزّع ألوان الزبون:**
- الأغمق من لونَي الزبون هو الحبر والأرضية، والأفتح هو النقاط والإطارات والكلام.
- لون التمييز (`accent`) هو القيمة الثالثة الوحيدة: كتلة خلف الكلمة المهمة، وحقل الجديد في المقارنة، والمربع الذي يحمل الشعار، وشريط العدّاد حين يكتمل.
- لا خلطات بين الألوان أبدًا: كل بكسل واحد من الثلاثة كما هو.

**يتجنّب:** الرماديات والتدرّجات الناعمة والشفافية، والحواف المنعّمة في الرسوم، والحركة الانسيابية، والتوهّج والظلال الناعمة، والكلام خارج النوافذ.

## For Claude

- Exactly two inks (`palette(brand)`: ink = the darker brand colour, paper = the lighter) plus the accent as a flat third value. Never `mix`, never `globalAlpha` on graphics; tone is dot density from `BAYER` via `dots()`/`screen()`/`dissolve()`.
- The ground renders a 270x480 buffer (one dot = 4 px) at most once per 15 fps step and scales it up without smoothing. Its dither thresholds are tied to world or surface coordinates; keep it that way, a screen-space pattern on a moving surface reads as noise.
- Time is stepped: use `step(t)` for every animated quantity, `snap()` for every rectangle. Appearance is `dissolve(ctx, p, rect, draw)`, text goes in word by word with `typed(...)` (block cursor for one step). Never fade text.
- All reading text sits inside a `plate()` window (ink body, paper frame); lead-ins and titles go in the title bar's gap. Nothing to read on the world itself.
- Sounds are machine sounds: `type` per word, `click` per list row, `glitch` when a window opens and on the joint, `error` for the strike, `toggle` for the new value.
