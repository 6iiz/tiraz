# القص الأحمر · Crimson Cut

**طابعه:** ورق ملوّن مقصوص بالمقص على طريقة زهور النوافذ الشعبية. الأرضية ورقة مصبوغة بلون خلفيتك، بحُبيباتها وأليافها، وعلى حافتيها العليا والسفلى شريط مسنّن، وفي زواياها أربع زهور ورقية نصفها خارج الورقة تدور ببطء شديد. البطل ورق أحمر بلون علامتك: وردة متناظرة ثمانية الأضلاع، كل تفاصيلها ثقوب مقصوصة لا خطوط مرسومة، ولكل قطعة حافة قصّ فيها ضوء خفيف من أعلى وظل من أسفل، وظل ورقي قصير تحتها. الكلام يُلصق لصقًا على الورقة، والمهم منه على لافتات بذيلَي سنونو أو على بطاقة حمراء.

**يناسب:** المناسبات والأعياد والهدايا، والحِرف والمنتجات اليدوية، والحلويات والمخابز والمطاعم ذات الطابع التراثي، ومحلات الزينة والورد، وكل علامة تريد دفئًا واحتفالًا وأثر يد.

**حركته المميزة:** الطيّ ثم الفتح. تظهر شريحة مطويّة من الورق الأحمر (ثُمن الوردة)، ثم تنفتح بضربات متتالية «طَق!»: ربع، فنصف، فوردة كاملة، وكل نصف يقلب فوق خط طيّه ويُظهر ظهر الورقة الأفتح وهو واقف. الكلمات تُلصق كلمة كلمة على رسمتين في الثانية الواحدة اثنتي عشرة مرة، أكبر قليلًا ثم مسطّحة. وفي المقارنة يمرّ المقص بخط مسنّن عبر بطاقة القديم فيسقط نصفها قصاصةً، ثم تُلصق بطاقة حمراء مطويّة وتنفتح على الجديد. وبين المشاهد تُقشَّر الورقة القديمة وتطير عن الجديدة. وفي الخاتمة تتساقط القصاصات ببطء على هوامش الورقة.

**ألوانك فيه:**
- لون الخلفية (`bg`) هو الورقة المصبوغة، ولون النص (`text`) هو الكتابة عليها. وإذا كان لون التمييز قريبًا جدًا من الخلفية تبادل اللونان، لأن البطل يجب أن يكون من عائلة ورق غير عائلة الأرضية.
- لون التمييز (`accent`) هو الورق الأحمر: الوردة، وبطاقة الكلمة المهمة، وبطاقة الجديد، والقصاصات.
- درجة أعمق منه (ممزوجة بالأغمق من لونيك) للّافتات التي تحمل الكلام، كي يثبت الكلام الفاتح عليها؛ ودرجة أبعد (ممزوجة بالخلفية) للزينة البعيدة على الحواف.

**يتجنّب:** الخطوط المرسومة والتدرّجات داخل القطع، والتوهّج، والظلال الطويلة، ووضع الأحمر على الأحمر بلا فاصل، والثقوب التي تترك جزيرة معلّقة، والانزلاق الأملس للكلام (الكلام يُلصق ولا ينزلق)، وإمالة الكلام.

## For Claude

- Paper families come from `papers(brand)` in `look/motion.js`: `ground` (dyed paper), `txt`, `red` (accent, the hero), `deep` (banners, text on it is `onDeep`), `far` (border and corner flowers). Text on red is `onRed`.
- Every piece is built once into an offscreen canvas with `finish()` (grain, a light rim up-left, a dark rim down-right, a tight paper shadow) and laid with `lay()`. Rosettes come from `rosette(R, colour, ri, seed)`: one half-wedge of cuts mirrored 16 times; `ri` leaves a solid centre for a number or a logo. Cut rings are dashed so no island falls out.
- Motion: words and pieces `paste()` on twos (1.15 for one step, then flat); rosettes `unfold()` in three snaps `tokens.unfold.gap` apart; exits drop on twelve-a-second steps (`steps12`). No slides, no fades, no bounce, no rotated text.
- A key word sits on its own red card (in a line) or shows through a window of ground paper cut out of its banner (in a list).
- Sound: soft paper kinds. `rustle` for a sheet, `swish` for each unfold, `click` for a paste, `scratch` for the scissors, `drop` for the falling offcut, one `impact` on the opened red card and on the logo.
