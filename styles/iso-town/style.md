# بلدة مجسّمة · Iso Town

**الطابع.** كتاب صور لبلدة صغيرة مرسومة بزاوية أيزومتريك بألوان ورقية مسطّحة: ساحة مبلّطة تملأ الشاشة إلى حوافها، وخلفها ظهور بيوت وأشجار، وأمامها صفوف بيوت بسقوف مائلة ونوافذ مضاءة وأبواب ومداخن يتصاعد منها دخان خفيف، وناس صغار يُرَون من الخلف بلا وجوه يمشون على مهلهم. كل لون بثلاث درجات (السطح أفتح، والوجه الأيسر، والأيمن أغمق)، بلا ظلال ناعمة ولا إضاءة. الكلام يقف على الساحة المفتوحة، والعبارة المهمة تحت مظلّة دكّان بلون تمييزك. ليس إنفوغرافيك كتل، بل حيّ مسكون.

**لمن يناسب.** المحلات والمقاهي والمخابز في الأحياء، والمدارس ورياض الأطفال، والبلديات والخدمات العامة، والعقار السكني، والجمعيات، وكل علامة قريبة من الناس وتشرح شيئًا يوميًّا بهدوء: طريقة الطلب، أين نحن، من يزورنا. ولا يناسب العلامات الفاخرة الداكنة أو التقنية الصارمة.

**الحركة المميِّزة.** كتاب منبثق. لا شيء ينزلق: الكلمة تقف من الصفحة على خط قاعدتها، والبيت يقف من أرضه، والمظلّة تنفكّ من قضيبها إلى الأسفل بحافتها المموّجة، والناس يقفون واحدًا بعد واحد كطابور يكبر مع الرقم. وفي الخاتمة يرتفع سقف البيت كطيّة ورق، ومن داخله تطلع لافتة مستديرة عليها شعارك. وبين المشاهد تنطوي الصفحة التالية من الأعلى فوق السابقة، بظلّ خفيف عند الطيّة.

**كيف يستعمل ألوانك.**
- **اللون الأفتح** بين لونيك هو ورق الساحة وجدران البيوت الفاتحة.
- **اللون الأغمق** هو الحبر، والنوافذ، والشعر وملابس بعض الناس.
- **لون التمييز** في بعض السقوف والمعاطف والنوافذ المضاءة ممزوجًا، وصافيًا في مظلّة العبارة المهمة، وسقف البيت المميَّز في القائمة، ولافتة الشعار.
- النص على المظلّة بلون الحبر أو الفاتح، أيّهما أوضح عليها.

**ما يتجنّبه.** الكتل العائمة على لوح، والدبابيس والأيقونات الإحصائية، والإضاءة والظلال الناعمة، والوجوه والتعابير والمزاح الكرتوني، والعناوين في بطاقات، والحركة المرتدّة.

---

## For Claude

- True isometric (`project`, 30° axes). Houses, trees and people come from `motion.js` (`house`, `tree`, `person`), three paper tones per colour from `pal.three`. The town is cached once per page; per frame only walkers and chimney smoke are added.
- Text stands upright on the open square (SAFE area), where only the faint paving lattice is; the town lives above y≈260 and below y≈1250. Never put text over houses.
- Motion grammar: unfold (`unfold`, hinged on the baseline), stand up (`house` grow, `person` grow), unroll (`awning`), lift (`house` lift). Soft ease, no overshoot. Walkers move at walking pace on the reel clock.
- A key phrase (`*…*`) gets exactly one `awning` per run per row (`keyRuns`); its text is `pal.onAccent`. In a list, the keyed item also gets the accent roof.
- Lead-ins and labels wrap to two rows (minPx ≥ 44) rather than shrink; the hook (`at: -0.8`) is complete at frame 0 (`stagger` keeps every unfold inside 0.72 s).
- Different from `isometric` (dark, block infographic on a board): this is a light, full-bleed, lived-in town; keep it so.
