# طباعة الريزو · Duotone Press

**الطابع:** كل مشهد طبعة تُسحب للتوّ من مكبس: ورقة بلونك الفاتح على قاعدة مكبس داكنة، بعلامات القصّ عند زواياها وشريط ضبط الألوان في أسفلها. في أعلى الورقة صورة فوتوغرافية بدرجات متصلة مطبوعة بحبرين فقط: لونك الداكن في الظلال، ولون التمييز في الدرجات الوسطى، وبياض الورقة نفسه في الإضاءات، مع حبيبات فيلم ناعمة. الصور مولّدة: منظر جبال، طبيعة صامتة، رواق أعمدة، بحر تحت الشمس. تحت الصورة يُطبع الكلام بالحبر الداكن على الورق المكشوف. لا نقاط شبكية ولا أقراص ولا انزياح طبقات: النغمة متصلة كالصورة الحقيقية.

**يناسب:** المقاهي والمطاعم ذات الطابع الفني، ودور النشر والمجلات، والمصوّرين والاستوديوهات، والفنادق والسياحة، والعلامات التي تحب الحسّ التحريري الراقي. ويناسب الرسائل الهادئة الواثقة والإعلانات التي تريد صورة قبل الكلمة. ولا يناسب الأجواء الصاخبة السريعة.

**الحركة المميِّزة:** السحبة. فوق الطبعة ورقة غطاء، تُرفع من زاوية جهة القراءة العليا على خط طيّ مستقيم، وظهرها الشاحب ينثني فوق الطبعة بظلّ ناعم، وكل ما تجاوزه خط الطيّ صار مطبوعًا: الصورة، ثم كل كلمة كاملة لحظة يمرّ بها الطيّ. عناصر القائمة تُسحب كلٌّ بغطائها الصغير على الإيقاع. وفي المقارنة تخرج السحبة الأولى باهتة ناقصة الحبر ويُشطب القديم، ثم تأتي سحبة ثانية فتظهر الصورة بحبريها كاملين ومعها الجديد. وبين المشاهد تُلقَّم ورقة جديدة من جهة القراءة فوق القديمة.

**كيف يوزّع ألوانك:**
- لونك الأغمق هو **قاعدة المكبس** وحبر الكتابة وظلال الصورة.
- لونك الأفتح هو **الورق** والإضاءات.
- **لون التمييز** هو الحبر الثاني: يملأ الدرجات الوسطى من الصورة، ويظهر في خط تحت الرقم وفي شريط الضبط.
- الكلمة المفتاحية تُكتب بلون الورق داخل شريحة من الصورة نفسها مطبوعة بظلالها فقط (أغمق مزيج من حبريك يبقى معه لون الورق مقروءًا).

**يتجنّب:** النقاط الشبكية والأقراص وانزياح الطبقات، وأي لون ثالث، والكتابة فوق الصورة، والصور التي تحاكي أشخاصًا أو منتجات حقيقية، وتلاشي المشهد كاملًا.

## For Claude

- Palette from `ground.P` (`palette()` in `motion.js`): `paper`, `night`, `accent`, `ink`, `grey`, `deep` (darkest accent mix that keeps paper text at 4.8:1), `back` (the leaf's back), `rule`. Tone curves from `ground.LUT`: `rich` (night → accent → paper), `pale` (under-inked proof), `shadow` (night → deep, for knockouts).
- Photographs come only from `photo(kind, w, h, seed)` (`land`, `still`, `columns`, `sea`) printed through a LUT with `print()`, built in `create()`, shown with `framed()` (slow push). Text never sits on a photograph; it sits on the bare sheet below the window.
- Every reveal is a pull: `peel(rect, rtl)` + `pull()`; draw what is printed inside `pl.clip(ctx, s)`, type with `press()` (whole words, timed by `reach()`), and the leaf last with `pl.flap()`. Keep one pull per scene for the main print; small pulls only for list rows.
- Key words: one knockout strip per run of neighbouring `*key*` words (`runs()`), cut from the `shadow` print, paper-coloured type.
- The hook: a pull of `dur.peel` 0.62 s from `at` -0.8 ends before frame 0. Lines use `balanced()`; lead-ins wrap to two rows (min 45 px) rather than shrink.
- The ground (sheet, fibre, trim marks, control strip) is static and built once; the mark sits on the sheet below the safe area.
