# عرض الزجاج · Clear Showcase

**طابعه:** استوديو أسود لا نهاية له، وفيه قطعة واحدة متخيَّلة من الزجاج الشفاف تطفو وتدور ببطء. الزجاج لا يُرى إلا بحوافّه: خط رفيع ساطع يرسم حدوده، وتحته انشقاق خفيف بلون علامتك كأنه تفكّك الضوء عند الحافة. وفي داخله أجزاء معتمة تُرى كما في واجهة عرض: حلقة توجيه للضوء يدور فيها مذنَّب صغير بلونك، ولبّ دقيق بخطوط رفيعة. وكل بضع ثوانٍ يعبر خلفها شريط ضوء طويل، فيُرى عبر الزجاج منحنيًا وأسطع. الكلام في الوسط بوزن خفيف هادئ، ويدخل بشدّ بؤرة لا بانزلاق.

**يناسب:** الإطلاقات والمنتجات الفاخرة، والإلكترونيات والأجهزة، والساعات والعطور والمجوهرات، والتقنية التي تريد أن تبدو ثمينة ودقيقة، وكل علامة تقدّم قطعة واحدة بطلة.

**حركته المميِّزة:** الشريط الضوئي. يعبر خلف القطعة فيضيئها من داخلها، وهو نفسه ما يحمل الانتقال بين المشاهد: خط ضوء رقيق يقطع الإطار ويكشف المشهد التالي خلفه. وفي القائمة منظور مفكَّك: ألواح زجاج تنزل متباعدة، ثم تنطبق على الضربة ويجري الضوء على حوافها.

**ألوانك فيه:**
- الأغمق من لونيك يُدفع نحو الأسود فيصير الاستوديو؛ والأفتح هو الكتابة وحواف الزجاج وشريط الضوء.
- لون التمييز محجوز للضوء وحده: المذنَّب، والانشقاق عند الحواف، والحافة المضيئة فوق الكلمة المهمة، والانعكاس الخافت على الأرض.
- الكلمة المهمة على لوح زجاج مصنفر؛ تُكتب بلونك إن كان مقروءًا عليه، وإلا كُتبت بالفاتح على لوح مُشرَب بلونك.

**يتجنّب:** أي شكل منتج حقيقي معروف أو شعار أو واجهة، والأرضية البيضاء، وخط الأفق، والتوهّج الذي يغمر الإطار، وألوان قوس قزح على الأسطح أو الكلام، والحركة السريعة أو المرتدّة، والأوزان الرفيعة جدًا للكلام العربي.

## For Claude

- Palette from `tones(brand, tokens)`: `P.field` (dark brand colour pushed to black) is the studio, `P.light` text and glass edges, `P.grey` secondary text, `P.accent` is light only (comet, rim split, lit edges). Key phrases use `frost(...)` with `P.keySlab`/`P.keyText`, one slab per phrase per row (`keySpans`).
- The hero is `slab(...)` (projected rounded glass slab: hull rim with an accent split, faint faces, inner parts on its middle plane via an affine map, the sweep seen through it). It sits above the text, outside the reading block; text never goes over glass or over the caustic.
- Words arrive with `arrive` (fade over the first third, settle from 4% larger); the opening line is complete before frame 0 (stagger is squeezed so it lands within 0.8 s). No slides, no bounce. Weights 400–500 for reading text; never below 400 in Arabic.
- The sweep is `ground.sweep(t)` (clock based, every `tokens.period` s); the joint is the same light line uncovering the next scene through a soft edge, kept faint so it never flashes.
- Labels, lead-ins and the slogan wrap to a second row at ≥ 44 px (`minPx: 44`) rather than shrink.
