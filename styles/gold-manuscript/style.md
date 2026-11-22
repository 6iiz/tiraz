# المخطوطة الذهبية · Gold Manuscript

**طابعه:** الإطار كله صورة مرسومة بيد مُذهِّب قديم. أرضية صبغ معدني عميق عليها شبكة معيّنات دقيقة، وفي كل تقاطع نقطة ذهب، وفي كل معيّن ثلاث لآلئ بيضاء صغيرة. حول الصورة حاشية من رقائق ذهب مرصوفة مربعات بخطوطها الفاصلة، وصف لآلئ، وزهرة رباعية في كل زاوية. الكلام مكتوب بالحبر على ألواح من رقّ فاتح بحواف حبر ثابتة، والعناوين على شرائط بأطراف مشقوقة بحبر أحمر.

**يناسب:** العطور والبخور والتمور الفاخرة، ودور النشر والخطّاطين، والتراث والمتاحف، والمجوهرات اليدوية، وكل علامة لها حكاية وصنعة وتريد أن تبدو ثمينة وقديمة الأصل.

**حركته المميزة:** الرسم بترتيب الرسّام، ولمعة الذهب. كل شكل يُرسم أولًا بخط حبر يدور حوله، ثم يُملأ لونه، ثم تُنقَّط لآلئه واحدة واحدة. والكلام يُكتب بالقلم كلمةً كلمة من جهة القراءة. الذهب يُرصف مربعًا مربعًا، ثم يمرّ عليه ضوء فتلمع مربعاته واحدًا بعد الآخر بينما يبقى الصبغ حوله مطفأ. وبين المشاهد تُرصف رقائق ذهب على الإطار في موجة مائلة تكشف الصورة التالية.

**ألوانك فيه:**
- لونك الأغمق هو الحبر: كل الخطوط والكتابة.
- لونك الأفتح هو الرقّ واللآلئ البيضاء.
- لون التمييز يُعطي الأرضية صبغها العميق (ممزوجًا بالحبر)، ويصير ذهبًا حين يُرفع نحو الفاتح، وحبرًا أحمر للعناوين.
- الكلمة المهمة تُكتب بالحبر على فرشة من رقائق الذهب.

**يتجنّب:** التدرّجات التي تجسّم الأشكال، والظلال الناعمة، واللون الأصفر المصمت بديلًا عن الذهب، والكتابة على الأرضية المزخرفة مباشرة، والحركة السريعة أو المرتدّة، وأي رموز دينية.

## For Claude

- Ink = the darker brand colour, vellum/white lead = the lighter, field = `mix(ink, accent, tone.field)`, leaf = the accent raised toward the light until ink reads on it at 5:1. No other colours.
- Every shape is painted with `painted()`: outline first, then fill, then the inner band, then pearls. Keep outlines firm (3.5 px or more).
- Gold is only ever `leaf()`: squares with seams, a few bole squares, laid with `draw(laid)`; it shines only when a light passes (`passing`, or `sweep` once across a key word after it is written). Never a flat gold fill.
- Text is always on vellum (panels, ribbons, roundels), written with `pen()` word by word from the reading side at `tokens.pen` px/s. Titles, leads and the slogan are in `pal.rubric`; key words sit on a leaf bed in ink.
- Calm tempo: no bounce, no shake; parts leave by fading whole in `dur.out`.
- The joint is the diagonal run of leaf squares; keep the leaf alpha band narrow so the frame does not flash.
