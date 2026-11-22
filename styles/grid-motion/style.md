# الموشن السويسري · Grid Motion

**طابعه:** طباعة متحركة على شبكة. الإطار كله بلون علامتك، عليه شبكة من أربعة أعمدة وصفوف ثابتة، والكلام فيه هو الذي يتحرك: حروف ضخمة ثقيلة، كل سطر منها على سكّته الأفقية الخاصة، يندفع من طرف الإطار ويقف فجأة في مكانه على الشبكة. السطور المتتالية تأتي من جهتين متعاكستين فتنزلق كعربات قطار، وفي الخروج تكمل طريقها وتعبر الإطار بدل أن تختفي. وتحت الإطار تزحف الكلمة المهمة مرة أخرى بحجم هائل وبدرجة خافتة من الحبر، فلا يتوقف شيء عن الحركة.

**يناسب:** العلامات الجريئة الواثقة، والحملات والإطلاقات، والوكالات والاستوديوهات، والموضة والرياضة والموسيقى، وكل رسالة قصيرة تُقال بصوت عالٍ وبجمل قليلة الكلمات.

**حركته المميزة:** إعادة التدفق. الكلام لا يظهر ولا يتلاشى، بل يتحرك على سككه: السطر يدخل منزلقًا ويقف، والقيمة الجديدة في المقارنة تدخل من جهة القراءة وتدفع القديمة أمامها خارج الإطار كشريط واحد، والرقم يدور صاعدًا كعدّاد، وفي الخاتمة تمشي كتلة الشعار على الأعمدة خطوة خطوة.

**ألوانك فيه:**
- لون التمييز (`accent`) هو الأرضية كلها.
- الحبر هو أوضح لونيك الآخرين على لون التمييز، وبه يُكتب كل شيء. وإن لم يكن أيٌّ منهما مقروءًا بما يكفي، تُمال الأرضية قليلًا نحو اللون الآخر حتى يُقرأ الحبر.
- العبارة المهمة تُكتب بلون الأرضية على كتلة مصمتة من الحبر، كتلة واحدة للعبارة كلها مهما كان عدد كلماتها.
- خطوط الشبكة والكلمة الزاحفة في الأسفل درجات خفيفة من مزج الحبر بالأرضية.

**يتجنّب:** التلاشي والارتداد والدوران، وتحريك الحروف منفردة، والتدرّجات والظلال والتوهّج، وأي لون ثالث، والكتابة الصغيرة المزدحمة، وتصغير المقدّمة الطويلة (تنزل على سطرين بدل أن تصغر).

## For Claude

- Colours come only from `palette(brand)` in `motion.js` (ground exposes it as `ground.pal`): `ground` (the accent, nudged until ink reads at 4.6:1), `ink`, `line`, `ghost`, `soft`. Never draw text in any other colour; key words are `pal.ground` on an `M.slab(...)` of `pal.ink`.
- The only motion for readable things is a whole row on its horizontal track: `M.travel(W, pIn, pOut, M.rowDir(g, rtl))`, applied by translating each word in `each` by its row's offset. Rows never move vertically, never fade, never scale. Exits carry on in the entry direction (`OUT`).
- Key phrases: compute boxes once with `M.layout` and merge them with `M.keyRuns`; one slab per run, so a multi-word phrase gets one emphasis.
- The hook: every arrival of a line finishes within 0.7 s of `at` (row step and slide are shortened for long blocks), so a line at `at: -0.8` is whole on frame 0.
- Long leads wrap to a second row at ≥ 88 % of `tokens.size.lead` (never below ~46 px); they are not forced onto one row.
- Every scene runs `M.ticker` at y 1600 (below the safe area, `decor: true`) with its hero word in `pal.ghost`; that is what keeps holds alive. Keep it tonal.
- The ground is a single cached picture; the joint shears ten bands of the next page in from alternating sides.
