# كرتون الثلاثينات · Noodle Limbs

**طابعه:** فيلم كرتون قديم من أول أيام السينما الناطقة، مرسوم بالحبر ومعروض من نسخة مهترئة. خشبة مسرح صغيرة بستائر تتمايل، وورق جدران مخطّط، وأرضية مربّعات تهرب إلى العمق، وكلها مرسومة بغسلات رمادية خفيفة من لونيك. الكلام يُعرض على «بطاقة عنوان» بإطار مزدوج كما في عناوين الأفلام القديمة. وتحت البطاقة شخصية صغيرة جسمها كلّه قطرة حبر، بعيون فطيرة ويدين ورجلين كالخراطيم وقفازين أبيضين وحذاءين ضخمين، ترقص على الإيقاع طوال الريل. وفوق كل شيء آثار الفيلم: ارتعاش خفيف في الإضاءة، وخدوش، وغبار، وحافة معتمة كإطار آلة العرض.

**يناسب:** المقاهي والمخابز والحلويات، ومحلات الألعاب والهدايا، والمطاعم ذات الروح المرحة، والعلامات التي تحب الحنين والنكتة الخفيفة، وكل رسالة تريد أن تبتسم.

**حركته المميِّزة:** الكرة القافزة. الحركة كلها «على اثنين»، أي اثنتا عشرة رسمة في الثانية فتبدو مرسومة باليد، وكل شيء يدخل بقفزة: يتمطّط طولًا، ثم ينضغط عرضًا، ثم يستقرّ. كرة بلون علامتك تنزل على الكلمات واحدة واحدة كأغاني السينما القديمة، وكل كلمة تقفز إلى مكانها لحظة تهبط الكرة عليها، ثم تعود الكرة إلى الكلمة المهمة وتظلّ تنطّ عليها مع الإيقاع. وفي المقارنة تنزل مطرقة كرتونية على القديم فتسطّحه كالفطيرة. وبين المشاهد تفلت بكرة الفيلم فتلفّ الصورة إلى الكادر التالي.

**ألوانك فيه:**
- لونك الفاتح هو الورق المرسوم وبطاقات العنوان والقفازات، ولونك الداكن هو الحبر: الخطوط والشخصية والكلام.
- الرماديات (الجدران والأرضية والستائر) خلطات من لونيك.
- لون التمييز لا يُكتب به، بل هو الكرة القافزة، وربطة عنق الشخصية، وعُقد الستائر، والخرطوشة التي تحيط بالكلمة المهمة. وما يُكتب عليها يأخذ تلقائيًا أوضح لونيك فوقها.

**يتجنّب:** التلاشي والانزلاق الناعم، والتدرّجات على الأشكال، وكثرة الألوان، والكلام على الخلفية المرسومة مباشرة بلا بطاقة، والحركة الناعمة بستين رسمة في الثانية.

## For Claude

- All motion is stepped "on twos": read time through `twos(t)` from `look/motion.js` before any animation. Only the joint uses its own steps.
- Things enter with `popAt` (stretch, squash, settle from their floor point); nothing fades in and nothing slides in. There are no exits: the projector roll (`joint.js`) carries every scene out.
- Every text sits on a title card (`card`): never set text straight on the painted stage. The key word (`*…*`) sits in the accent `cartouche`, its text in `P.onAccent`.
- The bouncing ball lands on each word as it pops; in a line it ends on the key word and keeps bouncing there on the beat. Keep that grammar: one ball, one beat (`tokens.beat`).
- The ink-drop fellow (`fellow`) stays below the safe area on the floor (`tokens.stage`), the same size in every part. Poses: dance, point, cheer, wave. He is our own design: never give him a known cartoon character's head, ears or silhouette.
- Colours only from the palette in `motion.js` (`palette`): light = paper, dark = ink, greys are mixes, accent for the ball, bow tie, tie-backs and cartouche. Film damage (`mark.js`) stays faint: flicker under 4 %, specks small.
- Long leads wrap to two rows rather than shrinking under about 47 px (`minScale` 0.9 on 52 px).
