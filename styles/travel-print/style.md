# بوستر السفر · Travel Print

**الطابع:** ملصق سياحي مطبوع بالشاشة الحريرية على ورق كريمي. كل لون حبر مسطّح معتم يُطبع وحده بسحبة واحدة، فلا تدرّج ولا شفافية: السماء تتغيّر قرب الأفق بأشرطة متدرّجة الدرجات، خطوط تَرِقّ ثم لون جديد. في الأسفل منظر طبيعي من ثلاث سلاسل تلال، كلٌّ منها بحبر واحد ينزاح عن مكانه بضعة بكسلات كما يحدث في الطباعة الحقيقية، وصف صنوبر على أقربها، وشمس من حلقات متّحدة المركز تصعد ببطء على الأفق، وغيوم مسطّحة تنساب في الأعلى. الكلام يُطبع على ورق السماء العاري في الوسط، مصفوفًا في المنتصف كعناوين الملصقات.

**لمن يناسب:** السياحة والسفر والفنادق والمخيّمات، والمطاعم والمقاهي ذات الطابع المحلي، والفعاليات الخارجية والمهرجانات، والمنتجات الطبيعية والمخابز، وكل علامة تريد أن تبدو دافئة ومصنوعة بإتقان قديم وهادئ.

**الحركة المميِّزة:** السحبة. لا شيء يظهر بالتلاشي ولا يطير: ممسحة مطاطية تعبر المساحة من جهة القراءة، أمامها حبّة من الحبر تتدحرج، وخلفها يكون اللون قد نزل كاملًا بحافة رطبة غير مستوية. الكلمة المهمة تأخذ سحبتها الخاصة أولًا: كتلة بلون علامتك، ثم تأتي سحبة الحبر الداكن بالكلام. والانتقال بين المشاهد سحبة واحدة من أعلى الإطار إلى أسفله تطبع المشهد الجديد فوق القديم.

**كيف يوزّع ألوان الزبون:**
- الأفتح من لونَي الزبون (`bg` أو `text`) هو ورق الملصق، والأغمق هو الحبر الأساسي للكلام والتلال القريبة.
- لون التمييز (`accent`) للشمس، ولكتلة الكلمة المهمة، ولخط الشطب، ولخطوط الفصل.
- أحبار السماء والتلال البعيدة والمتوسطة خلطات ثابتة من الألوان الثلاثة، كما يخلط الطابع أحباره قبل الطباعة.
- الكلمة المهمة تُفرَّغ من كتلة اللون (بلون الورق) إذا كان لون التمييز غامقًا بما يكفي، وإلا طُبعت فوقه بالحبر الداكن.

**يتجنّب:** التدرّجات اللونية، والشفافية، والظلال الناعمة، والخطوط المحفورة أو المرسومة حول الأشكال، ونقاط الشبكة النصفية، وأي كلام فوق التلال أو الشمس.

## For Claude

- Inks come from `palette(brand)` in `look/motion.js`: paper = the lighter brand colour, ink = the darker, every other ink a fixed `mix`. Never add a hue; never blend on screen (no alpha fills, no gradients). Sky tone changes are stepped bands.
- Every visible layer arrives through `pull(ctx, p, box, inkColour, P, draw, { rtl, seed })`: one ink per pull, crossing from the reading side (`dir: 'down'` for whole-sheet moves). Pulls of one idea follow each other by about 0.3 s; the key word's accent pull comes before the key-ink pull.
- Off-register is part of the medium: a layer may sit 2-4 px off its partner (accent block under the word, the shade face of a numeral, `P.ghost` under a band). Keep it small; text itself is never doubled.
- Text lives on the bare paper of the sky, centred, above `tokens.floor` (1050 px): the sun and the hills are below it and must never carry text. The information band (key ink, paper text) is the only dark backing.
- Sound is the print shop: `rustle` for each pull, `thump` when the main ink is down, `scratch` for the strike, `tick` for a rolling figure. The joint gets a `swish`.
