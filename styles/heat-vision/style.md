# الكاميرا الحرارية · Heat Vision

**طابعه:** كل شيء يُرى بعين كاميرا حرارية في غرفة ليلية. الصورة شبكة خشنة من الخلايا، ناعمة الحواف، فيها رجفة حسّاس خفيفة وظلال عدسة، وكل خلية لونها درجة حرارتها على سلّم واحد مبنيّ من ألوان علامتك: البارد هو لونك الداكن، والدافئ لون التمييز، والأسخن لونك الفاتح. في أسفل الإطار أجسام دافئة تتنفّس، وعلى جانبه أنبوب ساخن ونافذة باردة. وفوق الصورة أدوات الكاميرا نفسها: سلّم الألوان على الحافة، وزوايا عدسة التصويب، وصناديق القياس. والكلام يُقرأ دائمًا داخل صندوق قياس داكن، فلا يُكتب أبدًا فوق الصورة المزدحمة.

**يناسب:** الطاقة والعزل والتكييف والصيانة، والصحة واللياقة، والأمن والسلامة، والمطاعم والمخابز التي تبيع «الساخن»، والتقنية التي تريد أن تقول «نحن نرى ما لا يُرى».

**حركته المميِّزة:** التسخين. لا شيء ينزلق إلى مكانه؛ كل كلمة تكون في موضعها من البداية، لكنها تبدأ بقعة ضبابية بلون متوسّط ثم تسخن على السلّم حتى تصير أسخن ما في الصورة وأحدّه. والعبارة المهمة تدخل «منطقة العتبة»: شريط مسطّح بلون علامتك، ثم تنطبق عليه زوايا متتبِّع النقطة الأسخن. وعند الخروج يبرد الكلام وينطفئ. وبين المشاهد تُعيد الكاميرا أخذ العيّنة: تتكسّر الصورة إلى خلايا أكبر ثم تتّضح المشاهد التالية من الحبّة الأخشن.

**كيف يوزّع ألوانك:**
- الأغمق من لونيك (`bg` أو `text`) هو البارد: أرضية الغرفة وصناديق القياس.
- الأفتح منهما هو الأسخن: الكلام المقروء وقمّة السلّم.
- لون التمييز (`accent`) هو منتصف السلّم الدافئ، وهو لون شريط العتبة خلف العبارة المهمة؛ والكلام فوقه بالأوضح من لونيك.
- كل درجات السلّم مزج بين هذه الثلاثة، فلا يظهر لون ليس من علامتك.

**يتجنّب:** ألوان قوس قزح الجاهزة، وأي كتابة فوق الصورة الحرارية بلا صندوق، والانزلاق والارتداد، والأرقام المختلقة على الشاشة (القراءات رموز لا أرقام)، والوميض.

## For Claude

- One heat ramp per brand (`palette()` in `look/motion.js`): cold = darker of bg/text, then a grey step, accent, a mix toward hot, hot = lighter of bg/text. The sensor picture, the scale bar, the warming text and the mark all read from it. Never add a hue.
- Readable text always sits in a measuring box (`areaBox`): dark plate at 84 %, corner brackets. The picture behind may move; the plate stays calm.
- Entrances are warming, not moving: `heat(t, t0, rise)` + `warm()` give colour along the ramp and a blur that clears. Exits cool (`heat` with `t1`). No slides, no bounces.
- Emphasis = isotherm (`isotherm`, a flat accent band behind the whole key run) + tracker corners (`tracker`). One band per run of key words (`keyRuns`), so a multi-word key phrase is one band, not one per word.
- The hook (`at < 0`) plays its warming faster so that it is complete on the first frame; keep that when you change timings.
- The ground adds warm sources where a part asks (`ground.draw(ctx, t, extra)`): use it to make the subject warm the room, sparingly.
- Readings are symbols (`▲ ▼ MAX SP AR`), never invented temperatures. The only real number on screen comes from the spec.
- The sensor picture is a 64-cell-wide canvas recomputed per frame (cheap) and scaled up smoothly; don't raise its resolution much, and never loop over the full frame.
