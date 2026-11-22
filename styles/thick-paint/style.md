# الدهان السميك · Thick Paint

**طابعه:** لوحة زيتية كثيفة تُبنى بسكين الألوان أمام المشاهد. الإطار كله قماش مغطّى بضربات سكين عريضة مائلة الأطراف، لكل ضربة حافة مضيئة من فوق وحافة معتمة من تحت، فترى سماكة الدهان. أسفل الإطار خط ماء مرسوم بضربات أفقية مسطّحة، وفوقه أربعة أضواء تتدلّى تحتها انعكاسات من لطخات قصيرة تلمع واحدة بعد أخرى، والضوء المائل يتنقّل ببطء فوق نتوءات الدهان. الكلام نفسه مدهون: حروف لها جسم وظل، تُفرَد بمرور السكين.

**يناسب:** المطاعم والمقاهي ذات الطابع الدافئ، والمعارض والمشاغل الفنية، والعطور والحِرَف، والفنادق الصغيرة، وكل علامة تريد أن تبدو غنية ومصنوعة باليد وواثقة، بصوت هادئ وثقيل.

**حركته المميِّزة:** مرور السكين. لا شيء يظهر بالتلاشي ولا ينزلق: حافة مائلة تعبر من جهة القراءة، وعليها حافّة دهان طازج مدفوع أمام النصل، وخلفها يكون الدهان قد فُرد. والخروج كشطٌ بالسكين في الاتجاه نفسه. وحين يتغيّر شيء، لا يُشطب: تمرّ عليه ضربة عريضة من دهان الأرضية فتدفن وسطه. وبين المشاهد تعبر ضربة واحدة كبيرة الإطار كله، وخلفها المشهد التالي مدهون.

**كيف يوزّع ألوان الزبون:**
- اللون الأغمق من لونيك هو القماش، وضربات الأرضية كلها درجات قريبة منه.
- اللون الأفتح هو الدهان الذي تُكتب به الكلمات، ومنه خليط خافت للتمهيد والعناوين والقيمة القديمة.
- لون التمييز هو اللون الصافي الوحيد: لوح مدهون تحت الكلمة المهمة، وشريحة البند المهم، والقيمة الجديدة، ومربّع الشعار، وانعكاسات الأضواء. والكتابة فوقه باللون الذي يُقرأ عليه.
- الإضاءة والظل على الحواف هما لون الدهان نفسه مدفوعًا قليلًا نحو الأبيض أو الأسود.

**يتجنّب:** التلاشي، والانزلاق، والارتداد، والتوهّج، والتدرّجات الناعمة المصنوعة بالمزج (التدرّج يكون بخطوات من ضربة إلى ضربة)، وحُبيبات الفيلم، وأكثر من لون صافٍ واحد، والضربات الدوّامية التي تغلي في كل مكان.

## For Claude

- Palette from `motion.palette(brand)`: `ground` = darker brand colour, `paint` = lighter, `accent`, `onAccent` chosen by contrast, `muted`, `plane`/`plane2` (ground stepped toward paint). Ridge light and lip shade are the same colour mixed a few percent toward white/black; never another hue.
- Every surface is a `plane()` (rows of knife `stroke()`s) built once in `create()`, never per frame. The ground canvas is cached per palette at module level.
- One motion grammar: `knife(ctx, box, p, q, rtl, draw, lip)` lays (p) and scrapes off (q) anything, from the reading side, with `K` (in-out cubic). Multi-row text gets one pass per row (`each` returns `b.row === r`).
- All text goes through `relief()` (shadow pass, lit pass, then the paint; the first two are `decor`) or `reliefNumber()`. Keep opaque colours: no globalAlpha on text.
- Emphasis = an accent slab under the key word (drawn in the shadow pass via `under`). A change = a slanted band of ground paint across the old value (`T.cover`), never a thin strike.
- Static paint stays static; only the raking light layer and the reflection dabs move with `clock`. Do not add drifting strokes.
- Sounds: `swish` for each knife pass, `rustle` for small laid text, `scratch` for the burying stroke, `thump` for a slab or logo pressed in.
