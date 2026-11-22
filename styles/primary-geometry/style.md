# الأشكال الأولية · Primary Geometry

**الطابع:** آلة من أشكال مسطّحة تعمل على أرضية ليلية. الشاشة مقسومة إلى خلايا مربعة بخطوط إنشاء خافتة وعلامات فرجار صغيرة، وفي كل خلية قطعة: ربع دائرة، نصف دائرة، مثلث قائم، مربع، ذراع، أو حلقة تدور عليها نقطة. كل قطعة تدور ربع دورة (أو ثُمنها) على عدّ خاص بها من النبضات ثم تقفل في مكانها بطقّة حادّة، فلا تتشابه لحظتان والآلة لا تتوقف أبدًا. الكلام لا يطفو فوق هذه الحركة: كل نص يقف على لوح من ورق لونك الفاتح، واللوح نفسه يُبنى من مثلثين قائمين يدوران ويلتحمان.

**يناسب:** الشركات التقنية والهندسية، والمنتجات التي فيها آلية أو خطوات، والاستوديوهات والوكالات التي تحب الدقة واللعب معًا، والتطبيقات وأدوات العمل، وكل رسالة تقول «نظام يشتغل». ولا يناسب الأجواء الهادئة الناعمة ولا الرسائل العاطفية.

**الحركة المميِّزة:** المربّع الطابع. بعد أن يلتحم اللوح، يتدحرج مربع صغير بلون التمييز على سطر الكتابة من جهة القراءة إلى آخره، وكل كلمة تظهر كاملة لحظة يصلها. القائمة أذرع تقف عمودية ثم تهوي ربع دورة وتقفل أفقية، والعدّ يملأ قرصًا بربع ملوّن عند كل خطوة، والقديم في المقارنة يُشطب بذراع يهوي عليه. وبين المشاهد تدور خلايا الشبكة ربع دورة واحدة تلو الأخرى فتحمل المشهد الجديد.

**كيف يوزّع ألوانك:**
- لونك الأغمق (بين `bg` و`text`) هو **الأرضية الليلية** دائمًا، حتى لو كانت خلفيتك فاتحة.
- لونك الأفتح هو **ورق الألواح** التي يقف عليها كل نص، والنص عليها بلونك الأغمق.
- **لون التمييز** هو القطعة المتحركة: المربع الطابع، وكتلة الكلمة المفتاحية، وأرباع القرص، وذراع الشطب، وبعض قطع الآلة.
- القطع الأخرى مزيج من الأرضية مع الورق (رمادي إردوازي) أو مع لون التمييز (لون عميق).

**يتجنّب:** الكتابة مباشرة فوق قطع الآلة، والتلاشي والتدرّجات والظلال والتوهج، والارتداد، والدوران الحرّ بزوايا عشوائية (كل دوران ربع أو ثمن دورة)، والزوايا المستديرة، والأرضية الفاتحة.

## For Claude

- Palette from `ground.P` (built by `palette()` in `motion.js`): `night` (the darker brand colour, always the ground), `paper` (plates), `accent`, `ink` (text on paper), `grey` (quiet text on paper), `light` (quiet text on night), `on` (text on accent), `slate`/`onSlate`, `deep`, `line`. No other colours.
- Every readable text sits on a plate: `stage(ctx, rect, pin, pout, fill, content)` builds it from two right triangles that turn a quarter and lock; it leaves by splitting along the seam. Text on the bare night ground is allowed only on a night backing that hides the machine (see the compare label).
- Words are set only through `typeset()`: the rolling accent square reveals each word whole; consecutive `*key*` words on one row share ONE accent block (`runs()`). Do not animate words any other way.
- Motion grammar: `SNAP` (1-(1-p)^5) for every arrival, `OUT` for exits, rotations in multiples of `Q` (90 deg) or Q/2. The machine (`ground.js`, `TILES`) steps on `tokens.beat` via `steps()` and runs on `clock`; keep the middle rows mostly empty so plates own the centre, and keep the mark's corner clear.
- Lines use `balanced()` so no row is a lone word; a lead-in wraps to two rows (min 45 px) rather than shrinking.
- The hook is complete at frame 0 when `at` = -0.8: stage 0.28 s, rows 0.24 s each, 0.07 s apart. Keep any new text timing inside that budget.
