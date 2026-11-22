# شرح الآيباد · Stylus Notes

**الطابع:** شاشة رسم رقمية داكنة كالزجاج، مضيئة من الداخل، عليها شبكة نقاط خفيفة، وأحدهم يشرح عليها بقلم إلكتروني. الكتابة تتوهّج قليلًا كحبر رقمي، والخطوط المرسومة (دائرة التحديد، علامة الصح، الشخبطة، السهم) ضربات ناعمة يرقّ طرفاها حسب ضغط القلم ويلمع تحتها ضوء خفيف. ولا يظهر جهاز ولا يد ولا أي أداة من تطبيق: فقط سنّ القلم، حلقة صغيرة ونقطة مضيئة، تمشي على ما يُكتب ثم ترتفع وتحوم.

**لمن يناسب:** الشرح والتعليم والدورات، والاستشارات، والتقنية والتطبيقات، وكل علامة تريد أن تبدو كأنها تشرح لك بنفسها خطوة خطوة، بهدوء وثقة ولمسة عصرية.

**الحركة المميِّزة:** القلم يكتب كل كلمة من جهة القراءة وسنّه يمرّ عليها، ثم يعود فيرسم دائرة تحديد متوهّجة واحدة حول العبارة المهمة كلها. وبين الأفكار لا يُقلب شيء ولا يُمسح: إصبعان على الزجاج يقرّبان اللوحة قليلًا ويسحبانها جانبًا مع ميل خفيف، فتظهر الفكرة التالية مكتوبة على اللوحة نفسها. وفي الخاتمة يرسم القلم حدود شعارك بخط واحد ثم يُملأ.

**كيف يوزّع ألوان الزبون:**
- اللون الأغمق من لونيك هو زجاج الشاشة (مائل قليلًا نحو لون التمييز)، والأفتح هو الحبر الرقمي والتوهّج.
- لون التمييز هو قلم الشرح: دائرة التحديد، وعلامة الصح، والشخبطة، والخط المتموّج تحت الرقم، والكلمة المهمة نفسها، ويُفتَّح بلونك الفاتح إذا لم يكفِ وضوحه على الزجاج.
- الرمادي (للمقدّمات والقيمة القديمة) مزيج من لونيك.

**يتجنّب:** أي جهاز أو إطار أو شريط أدوات أو شعار تطبيق، واليد، والورق والحبر الحقيقي، والاهتزاز في الخطوط بعد رسمها، والظهور بالتلاشي، وأكثر من دائرة تحديد للعبارة الواحدة.

## For Claude

- Glass = the darker brand colour (`pal.glass`, a hair toward the accent), ink = the lighter one; strokes use `pal.key` (the accent lightened until it reads on the glass) with an accent glow. The ground is one cached image plus two slow light pools and a reflection.
- Every word is written with `inkWord` inside `kit.drawText`'s `each`, on a timetable from `schedule()` (time per word follows its width). The stylus tip follows `tipPath(events, t)` across words and strokes, and hovers when done. The hook (`at: -0.8`) is fully written and lassoed before frame 0.
- Key words (`*…*`) are inked in `pal.key`; each run of consecutive key words on a row gets exactly one `lasso` (a rounded-square loop whose sides stand in the word gaps), drawn after the words.
- Marks are pressure-tapered strokes (`ink`): `box` + `check` for list items, `scribble` to strike the old value, `arrow` from old to new, `underline` under a number. Finished marks never move; only the joint moves the canvas (pan + pinch + a few degrees of turn).
- Leads, titles and labels wrap at their size (`minScale: 1`) rather than shrink below ~48 px.
- Sounds are soft: `tick` for writing, `swish` for lassos and pans, `click` for checks, `scratch` for the scribble.
