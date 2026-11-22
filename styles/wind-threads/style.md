# خيوط الريح · Wind Threads

**طابعه:** خريطة مطبوعة على ورق دافئ بلون علامتك الفاتح، عليها شبكة خطوط طول وعرض منقّطة باهتة، وفوقها مئات الخيوط الرفيعة بالحبر ترسم ريحًا لا تُرى: تنساب كلها من جهة القراءة عبر الإطار، وتلتفّ في دوّامات واسعة، وتجري عليها ضربات قصيرة أغمق بسرعة الريح في كل مكان. الكلام عائق في وجه الريح: الخيوط تنفرج حول كل سطر، فيجلس الكلام في هدوئه الخاص على الورق.

**يناسب:** الطيران والسفر والسياحة، والشحن والتوصيل واللوجستيات، والطاقة والبيئة، والزراعة والمياه، والاستشارات والبيانات، وكل علامة تريد أن تبدو هادئة وعلمية ورشيقة معًا.

**حركته المميِّزة:** الحمل على الريح. الكلمات تأتي محمولة من جهة الريح، تتباطأ وتستقرّ في مكانها، وتغادر في النهاية مع الريح وهي تتسارع. وتحت العبارة المهمة تُرسم هبّة واحدة بلون علامتك، شريط مستدق ينتفخ في وسطه ويمتدّ تحت العبارة كلها، وتتلوّن الضربات الجارية قربها باللون نفسه. وفي المقارنة يعبر القديمَ خيطٌ داكن من جهة الريح فيبهت، ويُحمل الجديد تحته مع هبّته. وبين المشاهد تهبّ الخريطة الجديدة بحافّة متموّجة تعبر الإطار مع الريح. وفي الخاتمة تتحوّل الريح إلى دوّامة واحدة حول خاتم مطبوع فيه شعارك.

**ألوانك فيه:**
- اللون الأفتح هو الورق، والأغمق هو الحبر للكلام والخيوط والضربات بدرجات مختلفة.
- لون التمييز للهبّة تحت العبارة المهمة وللضربات المارّة بها، وللكلمة المهمة نفسها بعد أن يُعمَّق حتى تُقرأ على الورق.

**يتجنّب:** التوهّج والنقاط المضيئة والخلفيات الداكنة، وتدرّجات قوس قزح، والخيوط التي تمرّ فوق الكلام، والكتابة المائلة، والحركة المرتدّة.

## For Claude

- Palette from `motion.palette`: paper = lighter brand colour, ink = darker; threads, strokes, graticule and the lead are mixes of the two; `key` = accent deepened to 4.5:1 on paper, `gust` = accent deepened to about 2.6:1.
- Every text row is an obstacle: build `M.layout()` rows, turn them into `M.calm()` ellipses, and pass them to `ground.threads(obstacles, seed)` in create(). The threads are integrated once and printed to a canvas; per frame only `comets()` draws (three batched paths).
- The wind blows from the reading side. Words enter and leave with `blow()` (from upwind, settling; out downwind, accelerating). No slant on Arabic.
- One emphasis per key phrase: key words of a row merge into one run (`layout().runs`), each run gets one `ribbon()` and one gust region that colours the passing strokes.
- A line that opens a reel (`at < 0`) squeezes its stagger and ribbon so everything has landed by t = 0. Long lead-ins and labels use `balanced()` with `minPx` 44.
