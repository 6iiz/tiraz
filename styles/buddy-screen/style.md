# شاشة الصاحب · Buddy Screen

**طابعه:** كأنه تسجيل شاشة لمنتج حقيقي، لكنه مرسوم كله من جديد. نافذة تطبيق فاتحة حادّة التفاصيل تطفو بظل ناعم فوق خلفية سطح مكتب مصنوعة من ألوانك، فيها شريط عنوان وشريط أدوات وشريط حالة. فيها ممثّلان لا ثالث لهما: المؤشّر هو المستخدم، يتحرّك بانسياب وينقر فتتغيّر الواجهة؛ وصاحب صغير من بكسلات كبيرة مربّعة بلون علامتك هو البرنامج نفسه، يركض على الحواف العليا لعناصر الواجهة ويقفز ويهبط بانضغاطة وغبار بكسلي. التصادم بين دقّتين، واجهة ناعمة وشخصية خشنة البكسل، هو الطابع كله.

**يناسب:** التطبيقات والبرمجيات والمنصّات وأدوات العمل، وشرح ميزة أو خطوات استعمال، والخدمات الرقمية التي تريد أن تبدو قريبة ومرحة، والمتاجر الإلكترونية التي تشرح طريقة الطلب.

**حركته المميِّزة:** سبب ونتيجة. المؤشّر ينقر نقرتين على الكلمة المهمة فتصير «تحديدًا» بلونك، والكاميرا تقترب قليلًا كما يفعل مسجّل الشاشة، ثم يركض الصاحب على حافة الحقل حتى يقف فوق التحديد، ويقفز ويهبط عليه فيرتجّ. وفي القائمة يقفز من مربع اختيار إلى الذي تحته، وكل مربع يهبط عليه يُعلَّم.

**ألوانك فيه:**
- الأفتح من لونيك هو النافذة، والأغمق هو الحبر؛ ودرجات الواجهة (الأشرطة والحدود والأزرار) مزائج منهما.
- لون التمييز هو الصاحب، والتحديد خلف الكلمة المهمة، ومربعات الاختيار المعلَّمة، وشريط التقدّم، والسطر المضاف في المقارنة، وبلاطة الشعار في الخاتمة.
- الخلفية تدرّج من لونك الداكن مع وهج خفيف من لون التمييز.

**يتجنّب:** شعارات أو أزرار أنظمة تشغيل حقيقية، والمسرح الأسود، وأي يد مرسومة، والصاحب فوق الكلام، والكتابة على الخلفية خارج النافذة، والقفز أو التكبير الذي يهزّ الإطار أثناء القراءة.

## For Claude

- Palette from `tones(brand, tokens)`: `P.win` (lighter brand colour) is the window, `P.ink` the text, `P.chrome`/`P.line`/`P.ui` the interface greys, `P.accent` the buddy and every highlight, text on accent in `P.onAccent`.
- Every scene draws `ground` (wallpaper), then inside `zoom(...)` the `windowFrame(...)` and its content. Text lives only inside the window, inside `content()`. Zoom stays at or under `tokens.zoom` (1.05) around the frame's centre line, so text stays in SAFE.
- Two actors: `cursor(ctx, P, path, clicks, t)` for the user (glides, presses, ripples), the pixel buddy (`buddy`, `act`, `drawBuddy`) for the software. The buddy stands only on the top edge of an element with room above it, never over text; its pixels stay crisp (`imageSmoothingEnabled = false`) and its position snaps to half-pixels.
- Cause and effect: a key phrase becomes a selection (`select`, one per phrase via `keySpans`) because the cursor double-clicked it; a box is checked because the buddy landed on it; a row is added because the cursor pressed apply. Everything readable is already on screen when a hook opens (`at` < 0).
- Joints are the recorder's push-in (`joint.js`); interface changes are quick (≤ 0.2 s), no bounce in the UI itself: the only bounce belongs to the buddy.
- Lead-ins, labels and the slogan wrap to two rows at ≥ 44 px (`minPx: 44`) rather than shrink.
