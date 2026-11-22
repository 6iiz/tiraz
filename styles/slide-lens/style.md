# تحت الميكروسكوب · Slide Lens

**طابعه:** كأنك تنظر من عدسة مجهر. طاولة عمل داكنة، وعليها دائرة كبيرة مضيئة هي حقل الرؤية، وفيها شريحة زجاجية عليها نسيج مصبوغ: خلايا متلاصقة بجدران رقيقة ونوى صغيرة، وألياف بينها، كلها بدرجات باهتة من لونك حتى يُقرأ الكلام فوقها. الشريحة تزحف ببطء تحت العدسة ولا تقف أبدًا، وتحت الدائرة قراءة صغيرة بقوة التكبير ومسطرة قياس. الكلام مطبوع على الزجاج بالحبر الداكن، في وسط الحقل.

**يناسب:** العيادات والمختبرات، والصيدليات ومستحضرات العناية بالبشرة، والمنتجات التي تقوم على مكوّن أو تركيبة، والتعليم والعلوم، وكل علامة تريد أن تقول «دقّقنا في التفاصيل».

**حركته المميِّزة:** التركيز. لا شيء ينزلق ولا يقفز: الكلمة تكون مغبّشة وباهتة وأكبر قليلًا، ثم يُضبط عليها البؤرة فتتّضح، كلمة بعد كلمة. والكلمة المهمة تُقاس: تنتشر تحتها بقعة صبغة خفيفة، وتُرسم حولها حلقة واحدة بلون علامتك تحيط بالعبارة كلها مهما كان عدد كلماتها، وتنغلق بأربع علامات صغيرة. وبين المشاهد يُغلق الحاجز القزحي للعدسة جزئيًا ويُدار البرج إلى عدسة أخرى، ثم ينفتح على تكبير جديد. وفي المقارنة تنتقل البؤرة من القديم إلى الجديد: القديم يلين ويبهت ويُشطب بخط رفيع، والجديد يتّضح تحته وتُحاط به الحلقة. وفي الخاتمة يبتعد المجهر: يصغر الحقل حتى يصير شريحة مستديرة على الطاولة يتّضح فيها شعارك.

**ألوانك فيه:**
- اللون الأفتح بين لونيك هو الزجاج المضيء، والأغمق هو الطاولة والحبر.
- الخلايا والألياف مزيج خفيف من الزجاج ولون التمييز.
- لون التمييز للحلقة وعلامات القياس، وللكلمة المهمة بعد أن يُعمَّق حتى تُقرأ على الزجاج.

**يتجنّب:** الألوان من خارج علامتك، والحركة المرتدّة والانزلاق، والكتابة خارج الحقل المضيء (إلا الخاتمة على الطاولة)، وتعدّد الحلقات على عبارة واحدة، والنص الصغير المقروء خارج المنطقة الآمنة.

## For Claude

- Palette from `motion.palette(brand, tokens)`: glass = the lighter brand colour, bench/ink = the darker one, `key` = accent deepened toward ink to 4.5:1 on glass, `ring` = accent deepened to about 2.4:1. Never another hue.
- Text lives inside the lens (`tokens.lens`: centre 540,765, radius 520), centred, at most `tokens.textW` wide; the lens chord is narrower near the rim, so keep blocks around the centre (`kit.place(h, lens.cy)`).
- Every word enters by `focus()` (blur + slight scale + quick opacity) and leaves the same way out of focus. No slides, no bounces.
- One emphasis per key phrase: `keyRuns()` merges consecutive key words of a row into one run, and each run gets one `ring()`. A line that opens a reel (`at < 0`) squeezes its word stagger and ring so all is landed by t = 0.
- Long lead-ins and labels use `balanced()` with `minPx: tokens.minPx` (44): they wrap to two even rows rather than shrinking.
- The section texture, its soft copy and the vignette are built once per brand (module cache in `ground.js`); the magnification per scene comes from `clock`. The joint's iris blades are a mid tone between bench and glass so the frame does not flash.
