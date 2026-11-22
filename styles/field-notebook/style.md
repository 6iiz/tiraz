# دفتر الحقل · Field Notebook

**طابعه:** صفحة من دفتر عالِم طبيعة، مرسومة بقلم رصاص وقلم تلوين واحد على ورق له ملمس. في أسفل الصفحة مقطع في الأرض: خط التراب وعليه أعشاب، ثم طبقات التربة كل طبقة مظلّلة بخطوط متوازية في اتجاهها الخاص، وحجارة مرسومة بحدودها، وجذر ينمو ببطء نحو الأسفل طوال الريل ويتفرّع. الكلام يُكتب بالقلم أمام المشاهد كلمةً كلمة، والمهم يُظلَّل تحته بقلم لونك ثم يُسطَّر. والبنود بطاقات ورقية مربوطة بخيط إلى ساق نبتة، والرقم قياس على مسطرة مرسومة.

**يناسب:** المشاتل والزراعة والمزارع، والقهوة المختصة والأعشاب والعسل، ومستحضرات العناية الطبيعية، والتعليم والعلوم ومراكز الأطفال، وكل علامة تريد أن تبدو صادقة ودقيقة وقريبة من الأرض، بصوت هادئ وفضولي.

**حركته المميِّزة:** الغوص في الأرض. بين مشهد وآخر لا تُقلب الصفحة: النظر ينزل، فتصعد الصفحة ويمرّ مقطع التربة عبر الإطار، وتطلع الصفحة التالية من تحته. وداخل المشهد كل شيء يُرسم بسرعة اليد: الكلمة من جهة القراءة، والخط على طوله، والظلال خطًا بعد خط. وحين ينتهي الكلام يُمحى بالممحاة بترتيب القراءة.

**كيف يوزّع ألوان الزبون:**
- اللون الأفتح من لونيك هو الورق، واللون الأغمق هو الرصاص، ومنه درجة أخف للتمهيد والعناوين والقيمة القديمة.
- لون التمييز هو قلم التلوين الوحيد: يظلّل تحت الكلمة المهمة، والقيمة الجديدة، وطبقة من طبقات التربة، وورقة البند المهم، وبعض الأعشاب، والشعار. وإن كان باهتًا على الورق يُغمَّق نحو الرصاص حتى يظهر.
- درجات التربة خليط من لونيك ومن لون التمييز، كلها خطوط قلم لا تعبئة.

**يتجنّب:** الغسلات المائية والبقع، والتعبئة المسطّحة، والظلال المرسومة بالتدرّج، والظهور بالتلاشي، والانزلاق والارتداد، والألوان الكثيرة، وازدحام الصفحة بالملصقات.

## For Claude

- Palette from `motion.palette(brand)`: `paper` = lighter brand colour, `graphite`/`soft`/`faint` = darker colour stepped toward the paper, `pen` = accent (darkened toward the ink until it shows on paper), `soil` tones.
- Text is written, never faded in: build a `schedule(f, t0, speed)` and reveal each word with `write()` inside `kit.drawText`'s `each`. A part that opens the reel (`at < 0`) compresses its schedule so the line is whole on the first frame. Exits are `write(..., rub)`: rubbed out in reading order.
- Lines are `pencil(pts, p)` on `wobble()`d points, drawn along their length; tones are `hatchStrokes()` revealed by stroke time. Bake hatching in `create()` (or as a canvas with `hatchCanvas`), never generate it per frame.
- Emphasis = coloured-pencil hatching under the key word, then a graphite underline. Old values are struck through with two ruled pencil lines and stay readable.
- The cutaway sits below the safe area (`tokens.ground.line`); only the root grows with `clock`. Keep text above it.
- The joint is the sink (from rises, to rises in from below). Do not add a page-turn.
- Sounds: `rustle` and `scratch` for writing and hatching, `tick` for ticks and counts, a single `click` when a value is closed.
