# كرتون الخمسينات · Atomic Toon

**الطابع.** رسوم كرتون مسطّحة من منتصف القرن الماضي، كأفلام التعليم القديمة وكتيّبات الأجهزة المنزلية. الغرفة لا تُرسم، بل تُبنى من سطوح لون: جدار بلون هادئ، ولوح جداري بدرجة أفتح، وشريط أرضية أغمق، وخط أفق متقطّع، وقطعة أثاث أو اثنتان: طاولة على شكل حبّة فاصولياء بثلاث أرجل رفيعة، وسجّادة، ومصباح على ساق، ونجوم ذرّية بأربعة رؤوس. كل شكل مطبوع كأنه سِلّ مُسجّل باليد: اللون المسطّح منزاح قليلًا عن خطّه الحبري الرفيع المتقطّع، ويرتجّ الاثنان رجّة خفيفة كل رسمتين، فتبقى الصورة حيّة وهي ساكنة. الكلام بالحبر على الجدار النظيف، والكلمة المهمة على حبّة فاصولياء بلون علامتك.

**لمن يناسب.** شرح «كيف تفعلها»: الخطوات، والإرشادات، والوصفات، وتعليمات الاستعمال. ويناسب الأجهزة المنزلية والأثاث والديكور، والمخابز والمقاهي ذات الطابع العتيق، ومراكز التدريب، وكل علامة دافئة ومرحة تحبّ الحنين. ولا يناسب الرسائل الجادّة جدًا ولا التقنية الحادّة.

**الحركة المميِّزة.** الحركة «محدودة» كما في كرتون تلك الأيام: لا شيء ينزلق بنعومة. الكلمات والأرقام «تقفز» إلى مكانها في أربع رسمات ثابتة: صغيرة، ثم أكبر قليلًا، ثم تستقرّ. الأرقام داخل ميدالية مستديرة بلون علامتك، يدور حولها طوق نقاط درجةً كل رسمتين، والبطاقة الجديدة في المقارنة تنقلب على محورها، والأسهم المنحنية تُرسم على طولها. وبين المشاهد يُسحب لوح لون مسطّح عبر الشاشة بقفزات متقطّعة كأنه بطاقة تشدّها يد. وفي الخاتمة يصير شعارك نواة ذرّة تدور حولها ثلاثة مدارات.

**كيف يستعمل ألوانك.**
- اللون الأفتح بين لونيك هو **الورق**، والأغمق هو **الحبر**: الخطوط والكلام.
- الجدران والأرضية **مزيج** من الورق ولون التمييز أو الحبر، بلون جدار مختلف لكل مشهد.
- **لون التمييز** للميداليات، وحبّة الفاصولياء خلف الكلمة المهمة، والبطاقة الجديدة، والطاولة، ونواة الشعار. والكلام عليه بالحبر أو الورق، أيهما أوضح.

**ما يتجنّبه.** التدرّجات والظلال الناعمة، والتوهّج والنيون، والحركة الانسيابية بستين رسمة، والخطوط المغلقة الكاملة، والألوان الصارخة، والكلام فوق الأثاث.

---

## For Claude

- Palette from `ground.P` (`motion.palette`): `paper`, `ink`, `accent`, `onAccent`, `walls[]` (one per room), `tint`, `soft`, `grey`. Pass `room` to `ground.create` to pick the wall; neighbouring scenes should use different rooms.
- Every shape goes through `M.cel(ctx, path, { fill, line, width, id, t, gaps })`: the fill slips off register by `M.reg` (re-rolled on twos) and the line is broken and breathes. Give each shape its own `id`. Text is never printed off register (crisp ink on the plain wall).
- Motion is limited animation: `M.pop(t, t0)` (held drawings 0 → 0.55 → 1.12 → 0.96 → 1) with `M.grow`, `M.flip` for cards, `M.arrow` for curved arrows drawn on. No eased glides, no fades.
- Key words: draw `M.blobs(...)` first (the accent kidneys), then the words with `key: P.onAccent`; a blob is never drawn inside the word pass, so it never covers a neighbour.
- Props, the floor and wall ornaments live outside the safe area (ground.js); text sits only on the plain wall planes. Leads and titles go in a paper pill, wrapped with `M.balanced` at ≥ 47 px rather than shrunk.
- The hook must be whole at frame 0: a line's lead, words and key blob have all popped within 0.7 s of `at`.
