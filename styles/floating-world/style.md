# الأوكيو-إي · Floating World

**طابعه:** طبعة خشبية يابانية قديمة على ورق ياباني فيه ألياف ظاهرة. سماء بلونك في أعلى الورقة ممسوحة باليد حتى تذوب في الورق، وتلال مسطّحة، وبحر من أقواس متكرّرة بخط أسود محفور، وشرائط ضباب تنساب ببطء. الكلام مكتوب داخل خانات عنوان بإطار أسود سميك وخيط رفيع داخله، كما تُكتب عناوين الطبعات، والختم بلونك في رأس الورقة.

**يناسب:** المطاعم والمقاهي ذات الطابع الشرقي، والشاي والعطور والحِرَف، ودور النشر والمعارض والسياحة، وكل علامة تريد أن تبدو هادئة وعريقة ومصنوعة بعناية.

**حركته المميزة:** اللفيفة. كل خانة تنفتح من جهة القراءة كما تُفرد لوحة معلّقة، وأمامها عصا خشبية تتدحرج، فتنكشف الكلمات بترتيب قراءتها. وتغادر بأن تُلفّ من الطرف الآخر. وبين المشاهد تمرّ اللفيفة كلها جانبيًا، ويفصل بين اللوحتين شريط من ورق التركيب الأغمق. وفي المقارنة يزحف الضباب على القديم فيغيب فيه، ثم تنفرد خانة الجديد بلونك.

**ألوانك فيه:**
- لونك الأفتح هو الورق، ولونك الأغمق هو الحبر الأسود: الخطوط المحفورة والكتابة.
- لون التمييز هو لوح اللون: السماء، والبحر بدرجتين، والختم، وكتلة الكلمة المهمة. يُطبع منزاحًا قليلًا عن خطّه الأسود ثم يستقرّ، كما في الطباعة بألواح متعددة.
- الضباب والتلال وورق التركيب مزيج من ألوانك.

**يتجنّب:** الظلال والتوهّج والمنظور المجسّم، والكتابة على السماء أو البحر مباشرة، والحركة المرتدّة أو القذف، والتلاشي حركةً رئيسية، وأي لون ليس من ألوانك.

## For Claude

- Paper = the lighter of `colors.bg`/`colors.text`, key ink = the darker, colour block = `accent`; text on the accent uses `P.on`. Everything comes from `palette()` in `look/motion.js`.
- Every readable text sits inside a `cartouche` (paper field, 4 px key line, hairline inset) or on plain paper between the sky (ends near y 240) and the hills (start below the safe area). Never set text on the sky, the hills or the sea.
- Arrival = `scroll()`: the panel unrolls from the reading side with `R`, a roller (`rod`) at the moving edge; exit = rolled up from the far side with `OUT`. Lead-ins and handles unroll without a roller. No per-word bounces or fades.
- Key word: `keyBlock` (accent wiped lighter at its foot, under an exact 2 px key line), printed off register by `tokens.reg` times a factor that settles to 1.
- Seal: `seal()` (accent square, logo cut out in `P.on`), stamped with a scale that settles from 1.2; one big seal per reel, in the ending.
- Ground is built once per brand (fibres, bokashi sky per pixel, hills, wave strip) and only drifts with `clock`: mist 9–16 px/s, sea 22 px/s.
- Joint: the scroll pans sideways in the reading direction with a mounting strip between prints; keep the strip a mid tone (no flash).
