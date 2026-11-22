# ملاحظات مرسومة · Doodle Notes

**الطابع.** صفحة واحدة من الملاحظات المرسومة على ورق منقّط، تُصنع أمام المشاهد. ثلاث أدوات فقط: قلم حبر رفيع يرسم الحدود ويكتب، وقلم تظليل رمادي يعطي الأشكال ظلًا وحجمًا، وقلم فسفوري واحد بلون علامتك للشيء الوحيد المهم. العناوين على شرائط ملفوفة، والنقاط في صناديق مدوّرة لها ظل، والأرقام في شارات دائرية، والانتقال من فكرة إلى أخرى بسهم عريض مرسوم. والصفحة تصعد ببطء كأن العين تتبع القلم نزولًا.

**لمن يناسب.** ملخّصات الجلسات والدورات وورش العمل، والمدرّبون وصنّاع المحتوى، والتخطيط والإنتاجية، والقرطاسية والمكتبات، وكل علامة تريد أن تبدو ودودة ومرتّبة وتقدّم الفكرة كأنها دفتر ملاحظات أنيق.

**الحركة المميِّزة.** ترتيب الرسم الثابت: الحدود أولًا بقلم الحبر، ثم التظليل الرمادي بضربات عريضة مائلة، ثم الكلمات، ثم ضربة الفسفوري خلف الكلمة المهمة. وبين المشاهد تمرّر الصفحة نحو الملاحظة التالية، وفي الخاتمة تبتعد الكاميرا قليلًا فتُقرأ الصفحة كملصق.

**كيف يوزّع ألوان الزبون.**
- اللون الأفتح من لونيك هو الورق، والأغمق هو حبر القلم الرفيع، والنقاط والحبيبات مزيج خفيف منهما.
- الرمادي هو لونك الأغمق مخففًا في الورق، بدرجتين.
- لون التمييز هو القلم الفسفوري: يُمزج بالورق حتى تبقى الكتابة الداكنة فوقه واضحة، ولا يُكتب به نص أبدًا.

**يتجنّب.** الظهور بالتلاشي أو الانزلاق، والمسح (الصفحة تُحفظ ولا تُمسح)، واليد والقلم كأداة ظاهرة، والألوان الكثيرة، والكتابة بلون الفسفوري، وأي شكل بلا حدود مرسومة.

## For Claude

- Ground: the lighter brand colour as paper with a 30 px dot grid (H must stay a multiple of the pitch so the scroll joint is seamless). The page drifts up by `tokens.drift` px/s on `clock`; parts wrap their notes in `ctx.translate(0, ground.drift(t))` so notes ride with the grid.
- Build order for every note is fixed: outline `trace()` (fineliner, `P.ink`), then `shade()` (grey marker, `P.grey` / `P.greyDeep`), then words via `M.writer()`, then `highlight()` behind a key word (drawn before the words, timed after them).
- Text is always `P.ink` (or `P.note` for labels and the old value). `P.hl` is a fill only, never a text colour.
- Shapes: `banner` for leads and titles, `roundBox` for rows and compare values, `circle` badges for numbers and the logo, `fatArrow` from old to new. Keep `align` the same in `layout()` and `drawText()`.
- The ending pulls back (scale 1.14 to 1 around y 760); keep its texts small enough that the start of the pull-back stays inside SAFE.
