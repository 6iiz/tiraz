# قلم الآلة · Machine Pen

**طابعه:** ورقة مثبّتة على طاولة راسمة آلية، نراها من فوق. على الجانبين سكّتان من فولاذ، وفوق الورقة جسر يتحرّك وفيه عربة تحمل قلمًا واحدًا. لا شيء يظهر إلا لأن القلم رسمه: الكلمة تُرسم بمرّات ذهاب وإياب متلاحقة، فتبدو أولًا خطوطًا رفيعة متوازية ثم تمتلئ. والآلة تتحرّك بإيقاع الآلات: تتسارع ثم تسير ثم تفرمل، وتُنزل القلم وترفعه، وتعود إلى مكانها حين تنتهي. في أعلى الورقة حامل فيه ثلاثة أقلام، ومكان القلم المستعمل فارغ.

**يناسب:** المكاتب الهندسية والمساحة والخرائط، والطباعة والتصنيع، والشركات التقنية التي تحب أن تُظهر الدقّة والصنعة، وكل رسالة فيها ترتيب أو قياس أو خطوات.

**حركته المميِّزة:** التظليل بالخطوط. العبارة المهمة لا تُلوَّن بكتلة، بل يأتي قلم لون التمييز ويملأ خلفها شريطًا من خطوط مائلة متوازية واحدًا بعد واحد، ثم يرسم حوله إطارًا، ثم يكتب القلم الداكن الكلمات فوقه. وبين المشاهد تُسحب الورقة خارج الآلة إلى الأعلى وتدخل ورقة جديدة من تحت.

**كيف يوزّع ألوان الزبون:**
- الأفتح من لونَي الزبون هو الورق، والأغمق هو الحبر، أيًّا كان لون الخلفية عنده.
- القلم الرمادي (مزيج الحبر بالورق، مقروء دائمًا) للجمل التمهيدية والعناوين الصغيرة.
- قلم لون التمييز لا يكتب كلامًا: يظلّل خلف العبارة المهمة ويرسم الخطوط تحت الاسم.
- الفولاذ (السكك والجسر والعربة) مزيج غامق من لونَي الزبون، وظلال خفيفة محايدة تحته.

**يتجنّب:** التدرّجات والتوهّج والتلاشي، والكتل الملوّنة المصمتة، والكلمات التي تطير أو ترتدّ، وأي شيء يظهر دون أن يمرّ عليه القلم.

## For Claude

- Every visible mark goes through a job in `motion.js`: `wordJob` (a word rastered in back-and-forth passes, revealed through `rasterClip` inside `each`), `hatchJob` (45° hatching inside a rectangle), `strokeJob` (a polyline at plotting speed). Jobs run on a `program` with travel, drop and lift; draw `ground.machine(ctx, P.pen(t))` last so the gantry sits on the pen.
- Paper is the lighter brand colour, ink the darker (`inks()`), whichever is `bg`. The accent is a pen for hatching and rules, never a text colour; text over the hatch is ink.
- One emphasis per key phrase: `keyGroups()` merges neighbouring starred words on a row into one hatch band.
- The opening line (`at` < 0) is squeezed to finish by −0.3 s (`by`), so the hook is whole at frame 0; only its long rule is drawn in view. Mid-reel programs are squeezed with `by` so text is readable within about 1.5 s.
- Long lead-ins wrap at ≥ 44 px (`minPx: 44`) instead of shrinking.
- The joint feeds the sheet out upward with the machine's trapezoid of speed; don't add fades or a second kind of joint.
- Sounds: `type` for rastering, `tick` for a pen drop, `click` for a finished rule or strike, `rustle` for the paper feed.
