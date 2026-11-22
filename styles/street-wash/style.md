# اسكتش الشارع · Street Wash

**طابعه:** صفحة من دفتر رسم في الشارع: قلم حبر رفيع يرتجف قليلًا، يتجاوز الزوايا ولا يُغلق الأشكال تمامًا، وفوقه ألوان مائية شفافة مرميّة بسرعة، منزاحة عن الخطوط ببضعة بكسلات وفائضة عنها أحيانًا. في أسفل الصفحة شارع يُرسم أمامك: واجهات أبنية، ونوافذ مقترحة بخطّين، وعمود إنارة، وشجرة، ثم تُلوَّن بغسلات تتفتّت عند حافة الورق، وطائران يعبران السماء فوق الأسطح. والكلام مكتوب باليد على الصفحة نفسها.

**يناسب:** المطاعم والمقاهي ذات الحي والطابع، والسياحة والفنادق الصغيرة، والعقار والعمارة، والمعارض والمشاغل والدورات، وكل علامة تحكي عن مكان وتريد أن تبدو قريبة وعفوية وذكية في آن.

**حركته المميزة:** الخط أولًا ثم اللون. كل كلمة تُكتب باتجاه القراءة كأن القلم يمرّ عليها، والكلمة المهمة يدور القلم حولها بحلقة غير مغلقة، ثم تسقط خلفها لطخة من لونك منزاحة عن الحلقة. الرقم يُحاط بمربّع مرسوم وتُرمى فيه غسلة، ويشير إليه سهم من تحته. القائمة مربّعات صغيرة تُرسم ثم تُعلَّم بإشارة صح، والقديم يُشطب بخربشة سريعة ويُشار منه بسهم إلى الجديد. وبين المشاهد تُقلب صفحة الدفتر نحو الكعب.

**ألوانك فيه:**
- اللون الأفتح بين لونَي الخلفية والنص هو ورق الدفتر، والأغمق هو حبر القلم (مع لمسة خفيفة جدًا من لونك).
- لون التمييز (`accent`) هو الغسلة المائية: خلف الكلمة المهمة، وفي مربّع الرقم ومربّعات القائمة، وعلى بعض واجهات الشارع. وتُخفَّف قوتها تلقائيًا إن لزم ليبقى الحبر مقروءًا فوقها.
- واجهات أخرى تأخذ غسلة رمادية شفافة من لون الحبر.

**يتجنّب:** الخطوط المستقيمة المثالية والأشكال المغلقة بدقة، والألوان المعتمة المسطّحة، والفرشاة العريضة بلا خطوط، والتدرّجات الرقمية والتوهّج، والحركة المنزلقة أو المرتدّة، وتلوين الصفحة من حافة إلى حافة.

## For Claude

- Paper is the lighter of `bg`/`text`, ink the darker; pen lines are `pal.line`. The accent appears only as a wash (`patch()` + `drop()`, multiplied and shifted off its line), at strength `pal.washA(tokens.tone.wash)` so ink stays 4.5:1 on it.
- Line first, then wash: every shape is a pen stroke (`pen`, `box`, `loop`, `scribble`, `tick`, `arrow`) drawn along its length with `draw`/`drawAll`; its wash drops 0.2 to 0.4 s later. Build strokes and patches once in `create`.
- Words are written with `write()` inside `each`: a clip uncovers the whole word in the reading direction; words never move or split. Time them with `schedule()` (longer words take longer, short pen lifts between). Latin handles are written left to right.
- Key word: a `loop` round it after it is written, then a wash behind it. One key per line.
- The street, the birds and the binding shadow live in `ground.js`, below the safe area; keep text off them. The joint is a page turn toward the binding on the reading side.
- Sound: pen and paper: `scratch` for writing and crossing out, `tick` for ticks, a low `pop` for washes, `rustle` for the page turn.
