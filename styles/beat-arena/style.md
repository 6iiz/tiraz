# ساحة الإيقاع · Beat Arena

**طابعه:** برنامج مسابقات ملوّن يمشي على إيقاع ثابت. مسرح بلون علامتك عليه خطوط مائلة تنزلق ببطء، أو شمس أشعة تدور، أو نقاط، وكل جزء من الريل «جولة» بخلفية مختلفة. الكلام مكتوب على بطاقات ورقية مستديرة بحدّ حبر سميك وظلّ صلب مزاح، والمقدّمة على شريط حبر صغير مثبّت فوق البطاقة. وتحت، على أرضية المسرح، متسابقان صغيران كالألعاب يحفظان الإيقاع: واحد ينادي ويقفز على النبضتين الأولى والثانية، والآخر يردّ على الثالثة والرابعة.

**يناسب:** المطاعم والمقاهي ومحلات الحلويات المرحة، والألعاب والتطبيقات، والعروض والمسابقات والهدايا، ومحتوى الأطفال والعائلات، وكل علامة تحب أن تبدو خفيفة الظل وسريعة.

**حركته المميزة:** الختم على النبضة. البطاقة تنطّ إلى مكانها بقفزة صغيرة، ثم تُختم الكلمات واحدة واحدة على أنصاف النبضات، والعبارة المهمة تُختم كلها ملصقًا واحدًا بلونك تحيط به خطوط سرعة كالانفجار الصغير. في العدّ تقفز اللوحة مع كل خطوة، وحين يصل الرقم تنقلب إلى لونك: فزت بالجولة. وفي المقارنة يُشطب القديم ويُختم بعلامة خطأ، والجديد يُختم بعلامة صح.

**ألوانك فيه:**
- لون التمييز (`accent`) هو المسرح كله، ونقوشه درجة أفتح أو أغمق منه، وأرضيته مزيج منه ومن لونك الداكن.
- الأفتح من لونيك ورق البطاقات، والأغمق حبر الكتابة والحدود والظلال.
- الملصق المهم بلونك، والكتابة عليه بالحبر أو بالورق، أيّهما أوضح.

**يتجنّب:** التدرّجات والتوهّج والظلال الناعمة، والوميض أو تبديل لون الإطار كله، والكتابة مباشرة على النقوش بلا بطاقة، وملصقًا لكل كلمة من العبارة المهمة، وارتدادًا كبيرًا يهزّ السطر وهو يُقرأ.

## For Claude

- Colours: `palette()` in `look/motion.js`. Stage = `accent`; pattern = `accent` mixed 17% toward ink or paper (whichever is farther); paper/ink = the lighter/darker of `bg`/`text`; text on accent = `onAccent`. No other hue.
- Every readable text sits on a backing: paper card (`card`), ink banner (`ribbon`) or accent sticker. Never on the stripes/dots/sunburst.
- Each part has its own set (`ground.create({ set })`): line = stripes, count/ending = sunburst, list = dots, compare = split. Keep it so: a new part picks a set, never a new colour.
- Motion grammar: `pop` (in, ≤ 6% over-swing inside the pop), `shrink` (out, accelerating), `nod` (5% swell on each bar while holding), `burst` (ink speed-lines when something is won). Times land on `tokens.beat` (0.35 s) or half of it.
- A `*key phrase*` gets ONE sticker over the whole run (`keyRunsRows`), and `nudge` moves its words and the words after it by `GAP` so the outline never touches a neighbour; `balanced` never wraps inside a key phrase and never leaves an orphan word. Leads and titles stay ≥ 44 px and wrap to two rows instead of shrinking.
- The hook must be whole at t = 0: line words all land within `at + 0.18 + tokens.dur.words`; keep `at ≤ -0.8` for an opening line.
- The contestants live in `ground.js` below `SAFE.bottom`; they are decoration and keep global time. Do not put text near the floor.
- Sound: pop/tick/click for stamps, `impact` once when a number lands or a round is won, `error` for the struck value, `success` in the ending.
