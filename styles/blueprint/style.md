# مخطط هندسي (blueprint)

## الطابع

لوحة رسم هندسي: ورقة داكنة عليها شبكة دقيقة وإطار مزدوج وعلامات تسجيل في الزوايا، وكل ما يظهر عليها يُرسم بقلم الرسّام بالترتيب الذي يرسم به المهندس. الخطوط تمتد على طولها، والمستطيلات تُتتبَّع حول محيطها، والدوائر تُدار كالفرجار، والكلمات تُكشف خلف قلم رفيع يعبرها من جهة القراءة. لا شيء يتلاشى أو يقفز أو يطير. الرسالة تبدو مدروسة ومقاسة، كأنها خرجت من مكتب تصميم.

## يناسب

الشركات الهندسية والمعمارية والصناعية، والمنتجات التقنية، والخدمات التي تبيع الدقة والتخطيط: التصميم الداخلي، التصنيع، البرمجيات، الاستشارات. ويناسب كل رسالة تشرح "كيف بُني الشيء" أو تقارن بين نسختين.

## الحركة المميزة

الكلمة المفتاحية تُحاط بمستطيل يُتتبَّع بقلم لون التمييز، ثم يقيسها خط أبعاد بعلامتين مائلتين، وتتدلّى منه دائرة إشارة (بالون) كما في الرسومات الفنية. القائمة جدول قطع مرقّم، والمقارنة "مراجعة" على الرسم: القديم خط مخفي متقطع يُشطب، والجديد يُرسم بخط صلب وبجانبه مثلث المراجعة.

## كيف يستعمل ألوانك

- **اللون الداكن** من ألوانك (الخلفية أو النص، أيهما أغمق) هو ورقة الرسم.
- **اللون الفاتح** هو حبر الخطوط والكتابة، وبدرجات أخف للشبكة والملاحظات.
- **لون التمييز** هو قلم واحد فقط: يرسم ما يجب أن تراه العين أولًا (الكلمة المفتاحية، الرقم، القيمة الجديدة، دائرة الشعار). ويُكتب به النص فقط إذا كان مقروءًا بوضوح على الورقة، وإلا كُتب النص بالفاتح وبقي التمييز في الخطوط.

## ما يتجنّبه

الظلال والتدرجات والتوهج، والرسم ثلاثي الأبعاد، والحركة المرنة أو الارتداد، وتلوين أكثر من شيء واحد بلون التمييز في المشهد نفسه.

---

## For Claude

- Everything is a pen stroke: use `poly`, `seg`, `rect`, `circle`, `dim`, `vdim`, `centre` from `motion.js`, each grown by a 0..1 progress. Lines grow along their length; boxes are traced from the top corner on the reading side; nothing fades in or scales.
- Words arrive with `arrive(ctx, p, box, size, rtl, ink.accent)` (plotted behind a 2 px accent pen) and leave with `leave` (erased from the reading side). Return the word colour from `each`; never use globalAlpha on text.
- Colours come only from `inks(brand, tone)` (ground exposes it as `ground.ink`): `sheet`, `light`, `dim`, `accent`, `key`. Text that must stand out uses `ink.key` (the accent only when it reads at 4.5:1 on the sheet). Exactly one accent thing per scene.
- Line weights: 1 px guides at `tone.guide`, 1.5-2 px line work at `tone.line`, 2-3 px accent pen. Dimension ticks are 45-degree slashes, never arrowheads; the only arrowhead is a leader's.
- Use `boxes(kit, fitted, placement)` in `create()` to know where words stand before drawing marks around them. Keep marks in the gaps between rows, never across a word.
- The ground is drawn from a cached picture after the first second; keep heavy drawing out of `draw()`.
