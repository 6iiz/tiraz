# طاولة المنتج · Product Turntable

**طابعه:** استوديو تصوير منتجات صغير، مجسّم. ورق خلفية متّصل ينحني من الأرض إلى الجدار بلا زاوية، عليه بقعة ضوء ناعمة، وإضاءة صناديق ضوء تعطي لمعة هادئة وظلًّا ليّنًا. في الأسفل منصّة مستديرة سطحها طاولة دوّارة بعلامات تدريج، تدور ببطء وانتظام وعليها علبة منتج بلون علامتك يلفّها شريط ورقي مطبوع عليه شعارك. والكلام مطبوع على بطاقات أسعار ورقية مثقوبة بحلقة معدنية، منظومة في خيط واحد يتدلّى من الأعلى.

**يناسب:** المتاجر الإلكترونية، والمطاعم والمقاهي والمخابز، ومحلات الهدايا والعطور والإكسسوارات، وكل علامة تبيع شيئًا يُمسك باليد وتريد أن تعرض عرضها وسعرها بأناقة وهدوء. ويناسب الأسعار والعروض والمقارنات قبل/بعد، والقوائم القصيرة.

**حركته المميِّزة:** البطاقة تدور على خيطها. تصل كل بطاقة وظهرها إلينا (عليه رمز شريطي)، تلتفّ حول الخيط من الخلف، ثم تستقرّ مواجهة للعدسة بتأرجح صغير يخفت تمامًا قبل القراءة. وحين يُقال الكلام تُدار البطاقات عائدة من الأعلى إلى الأسفل. الرقم سعر على بطاقة كبيرة بلون علامتك يُعاد ترقيمه خطوة خطوة كما تطبع آلة التسعير. والمقارنة تسعير جديد: يُشطب القديم بخط قلم ويبقى مقروءًا، وتُعلَّق تحته بطاقة القيمة الجديدة. وفي الخاتمة تُرفع العلبة عن الطاولة، ويوضع شعارك المجسّم مكانها، وتفرمل الطاولة حتى يقف الشعار مواجهًا لنا، وتتدلّى فوقه بطاقات الاسم والحساب والشعار النصّي. وبين المشاهد يُسحب طول جديد من ورق الخلفية من لفّته من الأعلى إلى الأسفل.

**كيف يوزّع ألوانك:**
- لون خلفيتك هو ورق الاستوديو: علامة داكنة تأخذ استوديو داكنًا خافت الإضاءة، وعلامة فاتحة تأخذ استوديو فاتحًا. بقعة الضوء والأطراف مزيج منه ومن لونيك الآخرين.
- البطاقات دائمًا بالأفتح من لونيك (`bg` أو `text`) والطباعة عليها بالأغمق، فتُقرأ على أي استوديو. والعبارة الخافتة (التمهيد والعنوان والقيمة القديمة) مزيج منهما.
- لون التمييز (`accent`) للصقة الكلمة المهمة، ولبطاقة الرقم والقيمة الجديدة، وللعلبة والشريط حول المنصّة، ولشعارك. والكتابة عليه بالأوضح من لونيك فوقه.
- المنصّة بلون الورق الفاتح، والخيط والحلقات مزيج من لونيك.

**يتجنّب:** قراءة بطاقة وهي مائلة (الدوران بين القراءات فقط)، والظلال التي تنسخ شكل البطاقات على الجدار، والوهج والانعكاسات المعدنية على الكلام، والكتابة بلون التمييز على الورق، وأي لون من خارج علامتك.

## For Claude

- Everything 3D lives in `look/ground.js`: `create()` builds one studio per part (vertex-coloured sweep drawn unlit + a ShadowMaterial catcher on the same sheet, podium with a turntable `table` that turns at `set.spin` rad/s from `t + clock`, product box with a logo band, one 2048 soft key, a PMREM softbox environment). One WebGL renderer and environment are shared by all parts. Level camera, shifted lens: the plane z = 0 maps 1 unit to 1 frame pixel, so tags are placed in frame pixels.
- Text is printed (canvas texture, 2x) on a tag face: `textTag(row, fit, {...})` takes one row of `kit.fit`; key words get an accent sticker in `tone.onAccent`. `hang(tags, { centre })` threads them on one cord at the reading-start edge (hole at `SAFE.right - tag.edge` for RTL) and keeps the stack inside the safe area with `kit.place`.
- Tags move only with `swing(tg, t, { t0, out0 })`: from behind round the cord (always passing behind, never towards the lens) and settled by `t0 + dur.swing`; only a tag within ~15° of square on is reported with `kit.rec`. A hook (`at: -0.8`) finishes its last swing by 0.8 s.
- Tags cast no shadows (a tag-shaped shadow on the sweep reads as a ghost); only the podium, the product and the logo do.
- Colours: `tones()` — studio from bg (dark or light), tags always paper (lighter) with ink print, accent only on stickers, value tags, product, band, logo. No hard-coded hues; the environment panels and the key are neutral.
- Count repaints its tag texture only when the shown value changes (six steps). The ending sets `W3.tableAngle` to brake the turntable to 0 so the logo faces the lens.
- Build once in `create()`; `draw()` only rotates, moves and renders. No randomness except `hash()`.
