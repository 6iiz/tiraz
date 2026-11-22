# البوب آرت · Ben-Day Burst

**الطابع:** ملصق مطبوع بالشاشة الحريرية بروح فن البوب: كتل لونية مسطّحة معتمة، وحقل واحد من نقاط كبيرة جدًا مثبّتة على الورقة تكبر وتصغر على قطر، وأشياء أيقونية جريئة (مصباح، فنجان، جوهرة، قلب) مملوءة بلون مسطّح ومحدّدة بخط داكن سميك، والتعبئة منزاحة قليلًا عن خطّها كما في الطباعة الحقيقية، مع لمعة بلون الورق. الطبعة نفسها تتكرر جنبًا إلى جنب بتلوينات مختلفة، كورقة إصدارات متسلسلة. الكلام يُطبع على الورق المكشوف بخط ثقيل، والكلمة المهمة على كتلة بلون التمييز بإطار داكن.

**يناسب:** الحلويات والمشروبات والوجبات السريعة، والأزياء والإكسسوارات، والمعارض والفعاليات، والمنتجات ذات الشخصية الجريئة، والعروض التي تقوم على شيء واحد يُرى ويُتذكّر. ولا يناسب الخدمات الرسمية الهادئة ولا الموضوعات الحساسة.

**الحركة المميِّزة:** السحبة بالممسحة. كل طبعة تُسحب لوحًا بعد لوح من جهة القراءة: الكتلة، ثم النقاط، ثم التعبئة، ثم الخط الداكن، وشفرة داكنة تركب حافة اللوح الأخير. وعلى عدّ هادئ تُسحب كل طبعة من جديد بالتلوين التالي فوق القديمة، فالورقة تتجدد دائمًا. الكلام تعبره الشفرة نفسها وكل كلمة تنزل كاملة خلفها. والعدّ طبعة واحدة كبيرة تُسحب أربع مرات متتالية والرقم يكبر مع كل سحبة داخل نقطة ورقية عملاقة. وبين المشاهد تمرّ الشفرة على الإطار كله ومعها خط من حبر لون التمييز، فتترك الملصق الجديد خلفها.

**كيف يوزّع ألوانك:**
- لونك الأفتح هو **الورق** ولمعة الأشياء والنقطة العملاقة.
- لونك الأغمق هو **الحبر الأساسي**: الخطوط السميكة، والشفرة، والكتابة، وكتل القائمة الداكنة.
- **لون التمييز** هو الحبر الصارخ: كتل الطبعات، والنقاط، وكتلة الكلمة المفتاحية، ونقاط الترقيم.
- درجتان مزيجتان: فاتحة (الورق مع لون التمييز) وعميقة (الحبر مع لون التمييز) للنقاط والتلوينات.

**يتجنّب:** ألواح القصص المصوّرة وفقاعات الكلام والانفجارات النجمية وكلمات الأصوات، والظلال الناعمة والتدرّجات والشفافية، والكتابة فوق النقاط، وتبديل الكتل الكبيرة بين الداكن والفاتح بسرعة (يومض).

## For Claude

- Palette from `ground.P` (`palette()` in `motion.js`): `paper`, `night` (key lines, blade, text), `accent`, `tint`, `shade`, `on(fill)`, `onAccent`. Colourways are `P.ways` ([block, dots, fill]); keep them light-to-middle blocks so re-pulls never flash. `P.faded` is the "before" print.
- Prints come only from `printTile()` / `cycling()`: plates pulled from the reading side, page-fixed dot sheets from `ground.dots` (one per colour, built once per scene), objects from `OBJECTS` (`bulb`, `cup`, `gem`, `heart`) in a 200 box, fill offset off-register, `night` key line. Anything drawn by `extra` on a re-pulled print must be `fixed` (it stays put).
- Text never sits on dots or prints: it is printed on the bare sheet (or on a flat slab) with `pullText()`; the blade crosses all rows from the reading side and each word appears whole. One accent block with a key border per run of neighbouring `*key*` words (`runs()`).
- Lines use `balanced()`; lead-ins wrap to two rows at 45 px or more instead of shrinking. The hook's prints and text finish before frame 0 when `at` = -0.8.
- The ground is bare paper with a band of the tint dot screen below 1380 px (decoration); the mark sits above that band.
