# كتاب البوب أب · Fold Out

**الطابع:** كتاب بوب أب مفتوح على مكتب تحت ضوء مصباح. اللوح العلوي واقف كخلفية مسرح: سماء مطبوعة وشمس وغيوم وتلال من ورق مقصوص، ناعمة قليلًا كأنها خارج تركيز العدسة. والصفحة السفلى أرضية المسرح، عليها درب متعرّج مطبوع وزهور صغيرة، وعليها قطع واقفة: أشجار وبيت وسياج وشجيرات. كل قطعة ورقة مسطّحة لها خط حبر غامق متموّج قليلًا كقصّ اليد، وحافة ورق عريضة فاتحة، وسماكة كرتون رمادية تحتها، وظلّ ناعم على الصفحة. الكلام مطبوع على بطاقات ورق تقف أمام الخلفية، والعبارة المهمة على ملصق بلون علامتك.

**لمن يناسب:** متاجر الأطفال والألعاب، والحضانات والمدارس ومراكز الأنشطة، والمكتبات وكتب الأطفال، والحلويات والمخابز، والتطبيقات المرحة، والفعاليات العائلية، وكل علامة تريد أن تشرح شيئًا ببساطة ولطف كأنها تحكي قصة.

**الحركة المميِّزة:** كل شيء مثبّت بمفصلة في حافته السفلى: البطاقة ترقد مسطّحة ثم تقفز واقفة، تتجاوز الوقوف قليلًا ثم تستقرّ، وتكون أغمق وهي مائلة عن المصباح. والملصق الملوّن تحت العبارة المهمة ينفتح كجناح على مفصلته بعد لحظة. وعند الخروج تنطوي البطاقة إلى الصفحة أسرع مما وقفت. القطع الواقفة على الأرضية تتنفّس وتتمايل قليلًا، وضوء المصباح ينزلق على الصفحة ببطء. وبين المشاهد تُقلب الصفحة: ترتفع من حافتها الحرّة وتقترب من العدسة وتنقلب فوق الكعب، ويظهر المشهد التالي تحتها.

**كيف يوزّع ألوانك:**
- اللون الأفتح هو ورق الكتاب وحواف القطع، وبطاقات الكلام.
- اللون الأغمق هو الحبر (ممزوجًا بقليل من لون التمييز كي لا يكون أسود صِرفًا) ولون الكلام على البطاقات.
- لون التمييز للشمس والأشجار وسقف البيت والملصقات والشارة، وتدرّجاته الفاتحة للتلال والدرب والزهور. والكلام عليه بأوضح لونيك فوقه.
- غلاف الكتاب لون التمييز مُغمَّقًا، والمكتب لونك الداكن.

**يتجنّب:** الأشكال المدوّرة ثلاثية الأبعاد، والتدرّجات اللامعة، والأسود الصِّرف، والخطوط الهندسية المثالية، والكلام المكتوب مباشرة على الخلفية بلا بطاقة، والحركة المطاطية الكثيرة (القفزة الصغيرة للمفصلة فقط).

## For Claude

- Palette from `ground.P` (`motion.palette`): `paper`, `card`, `ink`, `dark` (text), `soft` (lead-ins), `accent` with `on` (the brand colour that reads best on it), `tintA/B/C` (decoration only), `page`, `floor`, `board`, `cover`, `desk`.
- Every text sits on a piece built with `card()` or `piece()` and drawn with `stand(ctx, piece, x, base, s, inner)`, where the text is drawn inside `inner` so it rises and folds with its card. `s` comes from `pop()` on the way in and `fold()` on the way out; nothing else moves a card.
- The book is fixed: backdrop 40–1040 × 144–1262, spine at `SPINE` (1262), floor below. Set pieces stand only on the floor (below the safe area); text cards stand in front of the backdrop.
- Key phrases: `isolate()` the fitted text, one accent sticker per run from `keyRuns()`, opened with `flip()`; the key words flip with it and are drawn in `P.on`. Skip `w.ph` spacers.
- Lead-ins wrap to two rows rather than shrinking. Lines land (card up, sticker open) within 0.65 s of `at`.
- Sounds: `pop` (low for a card, high for a sticker), `swish`, `rustle` for the page turn, `ding` on a number.
