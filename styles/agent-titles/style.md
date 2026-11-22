# تترات الجواسيس · Agent Titles

**طابعه:** مقدّمة فيلم من ورق مقصوص لم يُصوَّر قط. أحبار مسطحة معتمة، وكل قطعة حوافها مقصوصة بالمقص قصًّا خفيف الارتجاف، وبين القطع فرجة قصّ رفيعة وظل ورقي صغير، وعلى الصورة ملمس ورق مبقّع. كل مشهد «موقع» له لون أرضية واحد: ورق فاتح، ثم لونك الحار، ثم الحبر الداكن، وخلف الكلام أعمدة طويلة ودائرة عملاقة مقصوصة بدرجة أغمق قليلًا من الأرضية تنزلق ببطء كأن الكاميرا تتابع جانبيًا. الكلام نفسه جزء من الديكور: شرائط مقصوصة وبطاقات ودوائر مرقّمة. وفي أسفل الإطار عميلٌ ظلّيّ طويل بقبعة ومعطف ووشاح يتطاير، يمشي على حافة ممتدة بحركة الدمى المقطّعة.

**يناسب:** إطلاق منتج أو كشف عن مفاجأة، والفعاليات والعروض الأولى، والمقاهي والمطاعم ذات الطابع الكلاسيكي، والمكاتب الإبداعية والإعلانية، وكل رسالة فيها تشويق: «شي جديد جاي».

**حركته المميزة:** الدمية والطَّرْقة. الكلمات تنزلق على سطرها من جهة القراءة وتقف فجأة على الإيقاع، ثم «تُصفَع» على الورق في رسمتين كما في رسوم القصاصات. العميل يتحرك على رسمتين أيضًا، والكاميرا والأشياء المنزلقة على كل الإطارات. وفي المقارنة طرقة «توقيت متوقف»: لحظة هبوط الجديد يتجمّد كل شيء نصف ثانية، حتى العميل في منتصف خطوته، ثم يكمل. وبين المشاهد تتشظّى الصورة القديمة شرائطَ مائلة تنزلق متعاكسة. وفي الخاتمة يُجمَع شعارك من أربع قطع تطير على الأقطار إلى داخل دائرة عملاقة، ويقف العميل بجانبها.

**ألوانك فيه:**
- أربعة أحبار من هويتك: الأغمق من لونيك حبرًا، والأفتح ورقًا، ولون التمييز (`accent`) حبرًا حارًا، وحبر رابع ممزوج من الحار والورق.
- كل مشهد يختار أرضية واحدة منها؛ والكلام عليها بالحبر أو الورق، أيّهما أوضح.
- الحبر الحار للكلمة المهمة على بطاقتها، ولوشاح العميل، ولأرقام القائمة، وللدائرة التي تحمل شعارك.
- الديكور الخلفي درجة واحدة أغمق (أو أفتح) من الأرضية، فلا يُقرأ حرفًا ولا ينافس الكلام.

**يتجنّب:** التدرّجات والتوهّج، والخطوط الحادة الملساء (كل حافة مقصوصة)، والتلاشي بين المشاهد، والأسلحة والأدوات ونكات أفلام الجواسيس المعروفة، وإمالة الكلام، والكتابة فوق حافة شكل أو فوق العميل.

## For Claude

- Inks come from `inks(brand)` in `look/motion.js`: `ink`, `paper`, `hot` (accent), `second`; the text colour on any fill is `on(fill)`. Each part passes its ground (`which`) to `ground.create`; background props are `shade(ground)`, one step off the ground, and never carry text.
- Every shape is a `cut()` Path2D built once in `create()` (the scissor edge is cut once and moves with the piece) and drawn with `piece()`: paper shadow, cut gap in the colour behind, fill.
- Motion: credits slide along their row with `O` and stop dead, then `slap()` on twos; exits carry on in the same direction with `I`. Puppets (`agent`) and the dial hand step on twos (`twos`, `walkX`); slides, props and the joint run on ones. No fades, no bounce, no rotated text.
- The agent walks on the ledge at `tokens.ledge` in the reading direction, below the text block; keep text blocks above `ledge - 330`. In the compare, the stop-time freeze holds the whole picture except the landing value for half a second, and its sound is the one `impact`.
- Sound: `click` for each credit or card that lands, `tick` for the agent's steps and dial ticks, `swish` / `rustle` for paper slides, `impact` only on the compare's stab and the ending's assembled logo.
