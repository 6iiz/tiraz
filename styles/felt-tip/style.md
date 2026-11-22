# قلم الفلوماستر · Felt Tip

**طابعه:** ورقة بيضاء مطفية من دفتر، تملأ الإطار كله، وقلم فلوماستر أسود عريض الرأس وقلم ثانٍ بلون علامتك، بلا يد ولا قلم ظاهر. كل كلمة تُكتب كما يكتب الناس بالفلوماستر: يُرسم حدّها أولًا ثم تُلوَّن من جهة القراءة. الحبر حبر حقيقي: حيث يعبر خطّان يغمق اللون، وحيث تمرّ الكتابة السوداء فوق اللون تصير أغمق. كل فكرة على ورقة لوحدها: سؤال، رقم محاط بدائرة، قائمة مربعات تُعلَّم بصحّ، قيمة قديمة مشخبطة وسهم إلى الجديدة. وفي أسفل الورقة يد خفية تخربش حلقات متتالية وهي تفكّر.

**يناسب:** الدروس والشروحات والمدرّبين، والاستشارات، والتطبيقات والخدمات التي تشرح «كيف»، وصنّاع المحتوى التعليمي، وكل علامة تريد أن تبدو واضحة وصادقة وبسيطة، كأنها تشرح لك على ورقة على الطاولة.

**حركته المميِّزة:** نزع الورقة. لا شيء يخرج عن الورقة ولا يُمحى: حين تنتهي الفكرة تُنزع الورقة كلها من الدفتر، تنطوي من زاويتها السفلى البعيدة نحو الزاوية العليا فيظهر ظهرها الفارغ وظل رفيع على الطيّة، وتحتها الورقة التالية جاهزة.

**كيف يوزّع ألوان الزبون:**
- اللون الأفتح من لونيك هو الورق، واللون الأغمق هو القلم الأسود، ومنه رمادي للتمهيد والعناوين والقيمة القديمة.
- لون التمييز هو القلم الملوّن وحده: يلوّن تحت الكلمة المهمة (بلمسة خفيفة حتى تبقى الكلمة مقروءة)، ويدور حول الرقم، ويعلّم المربعات بصحّ، ويسطّر القيمة الجديدة، ويلوّن الشعار. وإن كان فاتحًا لا يظهر على الورق يُغمَّق نحو الأسود.
- لا لون ثالث: الدرجات الأغمق تأتي من تراكب الحبر نفسه.

**يتجنّب:** السبورة اللامعة والمغناطيس والقلم الطائر، والورق المنقّط أو المسطّر، وأقلام التظليل الرمادية، والظلال والتوهّج، والتلاشي والانزلاق، وإظهار يد أو قلم، والإطارات المطبوعة المستقيمة.

## For Claude

- Palette from `motion.palette(brand)`: `paper` = lighter brand colour, `ink` = darker, `grey` = ink toward paper, `pen` = accent darkened until it shows on paper, `back` = the peeled sheet's reverse.
- Every mark goes through `marker(ctx, pts, p, colour, width, alpha)` (multiply, round nib, touch-down dot). Build point lists once in `create()` with `hand()`, `box()`, `loop()`, `fillIn()`; animate only `p`.
- Words are lettered with `schedule()` + `letter()` inside `kit.drawText`'s `each` (outline traced, then filled, multiply). A part that opens the reel compresses its schedule with `hurry()` so the line is whole on the first frame.
- Parts have no exits: the sheet leaves by the peel (`joint.js`). Keep the peel's shadow at 0.16 or less.
- Emphasis grammar: key word = tinted colour-in block (`T.pen.tint`), number = coloured loop, list = black box + coloured tick, change = black scribble over the grey old value, arrow, new value underlined twice in colour. One meaning per mark; no second accent.
- The doodle under the safe area is the only thing that moves while a sheet holds (`tokens.doodle`, points per second).
- Sounds: `scratch` for lettering and strokes, `tick` for ticks and counts, `swish` for a loop, one `click` when a sheet's point lands, `rustle` for the peel.
