# غوص الحجم · Scale Dive

**الطابع.** ليلٌ هادئ بنجوم ثابتة، وفي أسفله عالمٌ داخل عالم: كوكبٌ مضاء يحمل مدارًا، والمدار يحمل خلية، والخلية تحمل ذرّة، والذرّة تحمل الكوكب التالي، والكاميرا تغوص فيها بلا توقف. كل شكل مسطّح بلون واحد ودرجة ظل واحدة، والتوهّج حلقتان صلبتان أفتح قليلًا من الليل، بلا ضباب ولا شفافية. وعلى طرف الشاشة شريط قياس لوغاريتمي يمرّ تحت مؤشر ثابت كأنه عدّاد المسافة. الكلام مكتوب فوق الغوص بخط واضح، والعبارة المهمة تُقفَل عليها حبّة «محطة» بلون تمييزك.

**لمن يناسب.** التعليم والعلوم، والتقنية والبيانات، والصحة والمختبرات، وكل علامة تشرح شيئًا صغيرًا جدًّا أو كبيرًا جدًّا، أو رحلة منتج من أوله لآخره (من الحبة إلى الفنجان، من الفكرة إلى المصنع). يناسب الأرقام والمقارنات بين حجمين. ولا يناسب العلامات التي تريد طابعًا يدويًّا أو دافئًا مثل الورق والقماش.

**الحركة المميِّزة.** الكاميرا لا تمشي إلا إلى الأمام. كل كلمة تأتي من بعيد، صغيرةً قرب نقطة التلاشي، وتكبر إلى مكانها على منحنى لوغاريتمي؛ وفي نهاية المشهد يندفع كل شيء نحو العدسة ويتجاوزها. الانتقال بين المشاهد غوصٌ عبر حلقة: المشهد القديم يتّسع ويعبر، وحلقة بلون التمييز تنفتح من الوسط وفي داخلها المشهد الجديد يكبر من بعيد. وفي الرقم تتسارع الكاميرا بينما يعدّ الرقم، وتنغلق حلقة تصويب عليه لحظة وصوله.

**كيف يستعمل ألوانك.**
- اللون الأغمق بين لون الخلفية ولون النص هو **الليل**، والأفتح هو **الحبر** الذي يُكتب به.
- كل العوالم المتداخلة مزيج قريب من الليل (درجات قليلة نحو الحبر أو نحو لون التمييز)، فيبقى النص فوقها مقروءًا دائمًا.
- **لون التمييز** هو لون «المؤشر»: حبّة المحطة خلف العبارة المهمة، وحلقة التصويب، والمؤشر على شريط القياس، وقرص الشعار. وإن كان قريبًا جدًّا من الليل يُفتَّح حتى يظهر.
- النص على حبّة المحطة بلون الليل أو الحبر، أيّهما أوضح عليها.

**ما يتجنّبه.** التدرّجات اللونية والضباب والتوهّج الناعم، والخطوط الخارجية حول الأشكال، والحركة إلى الوراء أو التصغير للخروج، والزووم داخل ثم خارج، والجزيئات العشوائية.

---

## For Claude

- Ground = the darker brand colour (`pal.night`), ink = the lighter. All world tones are `mix(night, light|sun, ≤0.25)` so text keeps contrast anywhere. `pal.sun` is the accent, lightened until it reaches 3:1 on the night.
- One direction of motion: forward. Entrances grow from the vanishing point in log space (`arrive`), scene exits rush outward past the lens (`rushOut`). Never shrink something away, never zoom out.
- Flat shapes with one shade step (`disc`) and glow as two hard rings (`glow`). No blur, no gradients, no strokes around shapes.
- A key phrase (`*…*`, one word or several) gets exactly one next-stop pill per row (`keyRuns` + `stop`), with dashed rails above and below that crawl while it holds; never one pill per word.
- The dive runs on the reel clock (`clock`), so it never restarts at a cut; a part may push it a little further (`ground.draw(ctx, t, extra)`) during its hero move.
- Lead-ins and labels wrap to two rows (minPx ≥ 44) instead of shrinking. Hook words are staggered with `stagger()` so the whole line is on screen at frame 0 when `at` is −0.8.
