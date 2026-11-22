# بوب آرت

**الطابع.** هذا الأسلوب صفحة من مجلة قصص مصوّرة: خلفية فاتحة مطبوعة بنقاط "بن داي" بلون التمييز، تصغر في الوسط وتكبر نحو الأطراف، وألواح قصص بحدود داكنة سميكة وظلال صلبة، وانفجارات نجمية خلف الرقم المهم والكلمة المفتاحية، وخطوط حركة تتطاير حولها. كل شيء يصل بصوت عالٍ، لكن النص العربي يبقى دائمًا على مساحة ممتلئة واضحة، فلا تمرّ الحدود الداكنة فوق الحروف.

**لمن يناسب.** مطاعم الوجبات السريعة والحلويات والمشروبات، ومتاجر الألعاب والأزياء الشبابية، والعروض والتخفيضات، والفعاليات، وكل علامة تريد طاقة ومرحًا ولفت انتباه سريعًا. يناسب الإعلان عن عرض، أو رقم مدهش، أو مقارنة "قبل وبعد". ولا يناسب الخدمات الفاخرة الهادئة ولا الموضوعات الحساسة أو الجادة.

**الحركة المميِّزة.** الأشياء "تفرقع": تقفز من لا شيء، وتتجاوز حجمها قليلًا مع ركلة دوران صغيرة، ثم ترتد إلى مكانها، والألواح تستقر بميل خفيف. وحين يصل العدّ إلى رقمه يضرب الانفجار ضربة أخيرة. وبين المشاهد يظهر المشهد الجديد عبر شبكة من النقاط تكبر من الوسط إلى الأطراف حتى تلتحم. وفي الخاتمة ينفجر نجم كبير يقفز الشعار إلى وسطه، ثم يصل الاسم في لوح مائل.

**كيف يستعمل ألوانك.**
- اللون الأفتح بين لون الخلفية ولون النص هو **الورق**: الخلفية والألواح.
- اللون الأغمق هو **الحبر**: الحدود السميكة والظلال الصلبة وخطوط الحركة ومعظم النص.
- **لون التمييز** هو اللون الصاخب: الانفجارات، وصناديق التعليق، ودوائر الترقيم، ونقاط الخلفية بدرجة أفتح منه.
- النص على لون التمييز يُكتب بلون الحبر أو الورق، أيهما يُقرأ عليه بوضوح أكبر.

**ما يتجنّبه.** النص المكتوب مباشرة فوق نقاط الخلفية، والحدود التي تقطع الحروف، والتدرّجات والتوهّج، والتلاشي البطيء، والزخارف الدقيقة، وأي لون غير ألوانك ومزيجها.

---

## For Claude

- Palette from `ground.P`: `paper, ink, accent, on, soft, dots`. Every readable text sits on a solid fill: a `panel(...)` in paper (ink or soft text) or an accent caption box or burst (`P.on` text). Never on the dot ground.
- Groups (a panel with its words) arrive with `zoom(ctx, in, out, cx, cy, tilt)` between `save`/`restore`; words with `arrive` (pop with overshoot). Tilts stay within about ±0.04 rad. Because of the overshoot, keep text-carrying panels inset from the safe edges (about 40 px), and check stills while they pop.
- A key word gets a burst behind it: measure its box once with `keyBoxes(kit, fitted, opts)` in `create()`, build `burstPath(cx, cy, w/2 + space*0.4, size*0.56, spike)`, and draw it as a fill only, before the words. Give the line extra lead (`lead: 2`) so spikes fit between rows. Outlined bursts (`burst(...)`) are for shapes that hold their own text: a number, the new value, the logo.
- Ink outlines are `T.ink.line` thick with a hard `T.ink.shadow` offset; no soft shadows, gradients or glows. `action(...)` lines are decoration and must stay behind panels.
- The dot ground is built once in `ground.js`; do not draw halftone per frame.
