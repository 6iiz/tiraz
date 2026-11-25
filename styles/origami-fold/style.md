# ورق مطوي · Origami Fold

**الطابع.** طاولة من كرتون سميك طُوي مرّة ثم فُتح، فبقيت عليه شبكة طيّات حقيقية: قمم ووديان صغيرة يلتقطها ضوء مصباح ناعم من الأعلى، فيظهر النقش وتتغيّر ظلاله ببطء وأنت تنظر. وعلى الطاولة كل كلمة ورقة مستقلة مطبوعة بالحبر، فيها ألياف الورق وآثار الطيّ، ترمي ظلًا خفيفًا لأنها مرفوعة قليلًا عن الكرتون. الكلمة المهمة ورقة ملوّنة بلون علامتك. وكل مشهد يُفتح كبطاقة معايدة.

**لمن يناسب.** المخابز والحلويات، ومحلات الهدايا والتغليف والقرطاسية، والمدارس ومراكز التعليم والدورات، والمكتبات وكتب الأطفال، والمناسبات والأعراس والأعياد، وكل علامة تريد إحساسًا يدويًا دافئًا ومرتّبًا معًا. لا يناسب الرسائل العاجلة الصاخبة ولا التقنية الباردة.

**الحركة المميِّزة.** الورقة تصل مطويّة كالمروحة ومائلة نحوك على حافتها السفلى، فتقف وتنفتح طيّةً بعد طيّة من جهة بداية القراءة، وكل طيّة تنفرد بسرعة وتتجاوز الاستواء قليلًا ثم تستقرّ، كما يفعل الورق المكبوس. الكلمات تنفتح بترتيب القراءة، والورقة الملوّنة حين تستقرّ تنثني انثناءة واحدة وترتفع قليلًا فيعمق ظلّها. الرقم ورقة كبيرة تنفتح ببطء، وكل طيّة تنفرد تقدّم الرقم ربعًا حتى يكتمل مع آخر طيّة. القيمة القديمة يشطبها شريط ورق ينفتح فوقها ثم تميل إلى الخلف وتبقى مقروءة. وبين المشاهد ينفتح المشهد السابق كغلاف بطاقة على كعبه نحوك ويخرج من الإطار. وفي الخاتمة بطاقة معايدة تقف مغلقة وعلى غلافها شعارك مضغوطًا في الورق، ثم ينفتح غلافها فيقفز شعارك من داخلها قطعةَ ورق مقصوصة، وتحته الاسم والحساب والشعار مطبوعة.

**كيف يستعمل ألوانك.**
- الأفتح بين لون الخلفية ولون النص هو **الورق** الذي تُطبع عليه الكلمات، والأغمق هو **الحبر**.
- الطاولة تتبع خلفية علامتك: كرتون داكن لعلامة داكنة، وكرتون بلون الخيش لعلامة فاتحة.
- **لون التمييز** ورق الكلمة المهمة والرقم والقيمة الجديدة وغلاف البطاقة وشعارك، ويُطبع عليه بالحبر أو بالورق، أيّهما أوضح عليه.
- الورق القديم والرماديات ودرجات الظلّ مزيج من ألوانك.

**ما يتجنّبه.** الكتابة على الطاولة مباشرة، والورق المائل وقت القراءة، والتوهّج واللمعان المعدني، والطيّات المتبقية التي تكسر الكلمة، وأي لون من خارج العلامة.

---

## For Claude

- Everything 3D lives in `look/ground.js`: `create()` builds one world per part (creased table with real relief, one soft lamp with one 2048 PCF shadow map, a shifted-lens camera solved so the plane the sheets rest on maps 1 unit to 1 frame px). One WebGL renderer (alpha, no tone mapping so paper shows the brand's exact colours at rest) is shared by every part and by the joint.
- Text is printed into paper textures with `kit.fit` + `kit.drawText` (at `tokens.tex` × resolution), never on the table. `W3.row(text, { size, kind, whole })` makes one sheet per word, one sheet per run of key words (accent paper), or one strip for the whole text (leads, titles). `W3.measure()` gives the width with paper margins before building; parts shrink the size until every row fits the safe width.
- A sheet's whole arrival is one number p: `sheet.pose(p, { z, flex, tilt, wave })` = stand up on the bottom crease + zig-zag pleat opening panel by panel from the reading-start edge, each crease a damped snap (`motion.js`). `pose` records the text box with `kit.rec` (rest rect; the plane maps exactly).
- Hook: line sheets all open inside `dur.window` (0.74 s) after `at`, so `at: -0.8` is whole on frame 0; the key flex comes after.
- Colours: `palette(brand)`; paper = lighter of bg/text, ink = darker, table follows bg; ink on the accent is whichever of the two contrasts more; the strike ribbon is the accent when it contrasts with the old paper, else the ink.
- Joint: the outgoing frame is a textured card cover hinged on the reading-start edge, swinging 90° towards the lens out of frame; the incoming scene under it with a sliding spine shadow. No flash.
- Build once in `create()`; `draw()` only sets angles and renders. No randomness except `rng(seed)` / `hash()`.
