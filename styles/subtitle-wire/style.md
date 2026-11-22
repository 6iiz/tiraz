# خبر الترجمة · Subtitle Wire

**طابعه:** خبر من أخبار المنصّات يُفهم والصوت مطفأ. لقطة تملأ الإطار كله تقوم مقام التصوير الحقيقي (حشد عند الغروب خارج التركيز، أو طريق من فوق بأضواء سيارات تنزل نحو العدسة، أو صفحة المصدر نفسها)، تغمق نحو الأسفل، وعليها ترجمة ضخمة هي بطل المشهد. الكلام يُرمى على الشاشة مقطعًا مقطعًا، كلمة أو كلمتين في المرة، والكلمة المهمة على رقعة بلونك. وقبل أن يظهر الرقم تُرى الورقة التي جاء منها وقلم التظليل يمرّ على سطره.

**يناسب:** الحسابات التي تنشر أخبارها أو أرقامها للجمهور مباشرة: المتاجر الإلكترونية، والمطاعم والمقاهي، والمبادرات، والإعلام المحلي، وكل علامة يُشاهَد محتواها في التصفّح السريع بلا صوت.

**حركته المميِّزة:** الرمية. المقطع لا يصعد ولا يتلاشى، بل يهبط على الشاشة من حجم أكبر قليلًا ويثبت في سُبع ثانية، والمقطع التالي على نصف النبضة التالية. ولا شيء يغادر وحده: كل مشهد ينتهي بقطع حادّ مع دفعة تقريب قصيرة.

**ألوانك فيه:**
- لونك الأغمق هو درجة اللقطة والظلّ الذي يغمرها تحت الترجمة، ولونك الأفتح هو لون الترجمة وبطاقة العنوان الصغيرة.
- لون التمييز رقعة خلف الكلمة المهمة، وقلم التظليل على الورقة، وخط الشطب، وشارة القناة في الأعلى. وما يُكتب عليه يُختار تلقائيًا من لونيك الآخرين بحسب أيّهما أوضح.
- البنود السابقة في القائمة تخفت إلى درجة بين لونيك.

**يتجنّب:** الشريط السفلي التلفزيوني والمذيع والجداول، والعناوين المتوسّطة مع النقاط، وظهور الكلام حرفًا حرفًا، والترجمة فوق لقطة لم تُغمَّق تحتها، وأكثر من كلمة مهمة في السطر.

## For Claude

- Palette from `motion.js palette()`: footage graded to the darker brand colour, captions in the lighter one, accent only for the keyword block, the highlighter, the strike and the bug; text on accent is `P.onAccent`.
- The ground is full-bleed footage plus a scrim: always call `ground.draw(ctx, t, top)` with the y where the words begin, so they stand on dark. Footage is procedural (`crowd`, `road`, `documentShot`), built once; it is the only thing that drifts.
- Captions go through `caption()` with `chunks(fitted, tokens.caption.chunk)`: whole chunks land at once with `slam()` (from `tokens.slam` × size, `outExpo`, `dur.slam`), chunks `caption.gap` apart. Never per letter, never a fade-in as the main move.
- Labels, lead-ins, titles and the handle are `chip()`s (light block, dark text, an accent edge). They are small; the caption is the hero.
- Numbers: cut to the source document first (`shot: 'document'`), then slam the figure and roll it in ~18 shrinking steps.
- No exits: scenes end on the joint, a 0.16 s hard cut with a punch-in (`joint.js`). The bug (`mark.js`) is the accent block with the short name, top corner, outside SAFE.
