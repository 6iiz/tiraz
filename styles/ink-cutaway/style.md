# المقطع بالحبر · Ink Cutaway

**الطابع.** لوحة رسم فنّي على ورق فاتح بشبكة باهتة وإطار مسطَّر. الجسم مرسوم بالحبر بخطوط لها مراتب: الحدّ الخارجي أثقلها، والحواف الداخلية أوسط، والقطع الصغيرة أرفع وأفتح. لا ضوء ولا ظلال ولا لمعان، فقط درجات رمادية خفيفة تفصل السطوح. في جانب الجسم نافذة مقطوعة تُظهر ما بداخله، وسطوح القطع مظلَّلة بخطوط مائلة. ولون واحد فقط بمعنى واحد: المسار الذي يجري داخل الجسم، وهو نفسه الخط الذي يصل إلى الكلمة المهمّة.

**لمن يناسب.** الصناعة والهندسة والسباكة والتكييف والطاقة، والأجهزة الطبية، والمنتجات التي فيها «شيء يجري في الداخل»: ماء أو هواء أو حرارة أو بيانات، وكل علامة تشرح كيف يعمل منتجها بهدوء ودقّة. ولا يناسب الحملات الصاخبة ولا الأجواء الليلية.

**الحركة المميِّزة.** القطع: خط مستوى القطع (خط متقطّع بنقطة، بسهمين في طرفيه) يعبر الجسم، وخلفه تنفتح النافذة ويظهر الداخل. الكلمات تُحبَّر من جهة القراءة كأن القلم يمرّ عليها، وتُمحى في الاتجاه نفسه عند الخروج. المسار يجري في الداخل بأسهم صغيرة، يخرج من فوهة الجسم، وينزل على الهامش ليصير خطًا ثقيلًا تحت الكلمة المفتاحية ينتهي بسهم. في القائمة تُثبَّت فقاعات مرقّمة على الرسم ويُكتب كل بند في جدول القطع بالرقم نفسه. في المقارنة سدادة تقطع المسار، فيُشطب القديم بخط متقطّع (خط مخفي) وتختفي السدادة ويجري المسار إلى الجديد. وبين المشاهد يعبر خط قطع أفقي الصفحة كلها. والخاتمة جدول عنوان يُسطَّر خانةً خانة، وشعارك يُرسم كقطعة: حدّ ثم تظليل ثم حبر كامل.

**كيف يوزّع ألوانك.**
- اللون الأفتح بين لونيك هو **الورق**، والأغمق هو **الحبر**.
- الرماديات والدرجات كلها مزيج من الورق والحبر.
- **لون التمييز** للمسار وحده: داخل الجسم، وفي الطريق إلى الكلمة، وتحتها. ويُغمَّق نحو الحبر بقدر ما يلزم ليظهر على الورق.
- الكلمة المفتاحية بدرجة لون التمييز (مغمَّقة حتى تُقرأ)، وتحتها خط المسار، مرة واحدة للعبارة كلها.

**يتجنّب.** الظلال والتوهّج والتدرّجات والعمق الضبابي، واستعمال لون التمييز زينةً أو خلفية، والكتابة فوق الرسم، والحركة المرتدّة، وتحريك الكاميرا.

## For Claude

- Palette from `motion.palette(brand)`: `paper` = lighter of bg/text, `ink` = darker; `tone1..3`, `grey`, `thin` are mixes. `path` is the accent darkened toward ink to 3:1 on paper; `key` to 4.5:1. The accent means the path and nothing else.
- Line hierarchy is fixed in `specimen()`: silhouette ≈ 4 px ink, edges ≈ 2.2 px, small parts ≈ 1.2 px grey. Hidden things (the path inside the shell, the plug being removed, the old value's strike) are dashed; visible ones solid.
- `specimen(ctx, pal, g, state)` draws the whole object from `state` (draw, cut, flow, flowP, plug); it returns the anchor points for balloons and the outlet. It is plain strokes and fills, cheap per frame. Text never sits on the drawing: the drawing is on the upper sheet, text below.
- Words go through `inked()` (a clip that opens from the reading side), never fades. The hook must be fully inked at frame 0 when `at` is −0.8 (word steps are squeezed into 0.45 s).
- A key word or phrase gets `pal.key` and one underline per run of key words (`keyRuns`); `pathToKey()` routes the path from the outlet down the margin to the last key run.
- Long lead-ins and labels wrap onto a second row at ≥ 44 px (`minPx: 44`), never shrink below that.
