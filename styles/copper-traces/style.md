# مسارات النحاس · Copper Traces

**طابعه:** لوحة إلكترونية مطبوعة تُرى من فوق تمامًا. طبقة عازلة داكنة بلون علامتك، ومسارات نحاس تجري تحتها، ونقاط تلحيم معدنية لامعة، وكتابة بيضاء مطبوعة على اللوحة كما تُطبع أسماء القطع. لا شيء يطير ولا يقفز: كل شيء محفور في مكانه من قبل، والذي يتحرّك هو التيار. نبضة ضوء تجري في المسار، فتصل إلى طرف القطعة، فتشتغل الكلمات المتّصلة بها واحدة بعد الأخرى. والكلام كله يجلس على مساحات صافية من اللوحة أو على جسم شريحة، فلا يُكتب فوق النحاس أبدًا.

**يناسب:** الشركات التقنية، وصانعي الأجهزة والإلكترونيات، والطاقة والاتصالات، ومزوّدي الإنترنت والبرمجيات، وكل علامة تريد أن تشرح كيف «يوصل» شيء إلى شيء: طلب يمرّ بخطوات، أو خدمة تربط طرفين.

**حركته المميِّزة:** التشغيل. الجملة مطبوعة على جسم شريحة طويلة، باهتة كأنها بلا كهرباء، ثم يصعد التيار من أطراف الشريحة ويكنس عرضها من جهة القراءة، فتضيء كل كلمة لحظة يمرّ فوقها. وفي المقارنة يحترق صمّام: ينقطع المسار، وتنطفئ القيمة القديمة ويُشطب عليها، ويتحوّل التيار في فرع مائل إلى الشريحة الثانية فتضيء القيمة الجديدة على لوح معدني.

**ألوانك فيه:**
- لونك الداكن (أيًّا كان، الخلفية أو النص) هو الطبقة العازلة، مشوبًا قليلًا بلون التمييز، فتأخذ اللوحة لون علامتك: خضراء أو فيروزية أو نحاسية.
- لونك الفاتح هو حبر الطباعة على اللوحة، وكل الكتابة به.
- لون التمييز هو المعدن المكشوف (نقاط التلحيم واللوح الكبير)، والتيار المضيء. الكلمة المهمة توضع على لوح من هذا المعدن، وتُكتب بأوضح لونيك عليه.
- النحاس تحت الطبقة العازلة وظلال الحواف كلها مزج من لونك الداكن ولون التمييز.

**يتجنّب:** المنظور والمجسّمات، والكتابة فوق المسارات أو النحاس، وتوهّج يغطي الإطار، والزجاج والواجهات العائمة، والمسارات المتعرّجة أو بزوايا غير 45 و90 درجة، وأكثر من لون ضوء واحد.

## For Claude

- Palette comes from `palette(brand, tokens)` in `look/motion.js`: the darker brand colour (tinted by `tone.mask`) is the mask, the lighter one is silkscreen (`P.silk`, `P.dim`), the accent is metal (`P.gold`) and current (`P.glow`). Text on gold is `P.onGold`. Never write text in the accent.
- Every word sits on a clear area: `M.field` (flat mask with a silk outline) or `M.chip` (epoxy body). Ground copper lives in the top band (y < 240), the bottom band (y > 1296) and the side margins only; keep it there.
- Motion: words are printed but unpowered (a ghost) until current reaches them; `M.power(ctx, t, t0, dur, box, size, P)` lights a word with a halo and a small settle. Tie each word's `t0` to the pulse that feeds it (a sweep across pins, a pulse into a pad). Exits are a power-down: the group dims and lifts (`I`).
- Routes are octilinear only (0/45/90 degrees), built with `M.route` / `M.bus`; current is `M.glow` / `M.pulse` on a route, never a free-floating light.
- Key word: an exposed gold pad (`M.pad` with `lit`) placed under the word a beat after it powers, the word switching to `P.onGold`.
- The ground is etched once into a canvas; per frame only the bus pulses and the drifting key light are drawn. Keep new work out of the per-frame path.
