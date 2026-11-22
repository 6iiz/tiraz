# الفيلم المخدوش · Etched Celluloid

**طابعه:** رسوم محفورة بإبرة مباشرة في طبقة سوداء من شريط الفيلم، ثم معروضة على الشاشة. الأرضية سواد حيّ فيه بقع خفيفة دافئة وباردة تتبدل، وكل ما هو مضيء خدش: الكلمات، والأشعة، والحلقات، والنجوم الصغيرة. الخطوط ترتجف قليلًا في كل رسمة (اثنتا عشرة رسمة في الثانية) حتى وهي ثابتة، ولكل خط مرور ثانٍ باهت بجانبه وقفزات صغيرة من السواد تقطعه. اللون صبغة شفافة تُفرش في الأخاديد بضربات فرشاة رفيعة.

**يناسب:** العلامات الحِرفية واليدوية، والمحامص والمخابز، والفنانين والموسيقيين، والمهرجانات والعروض، وكل رسالة تريد أن تبدو مصنوعة باليد ودافئة وغير مصقولة.

**حركته المميزة:** الإبرة الساخنة. كل كلمة تُحفر من جهة القراءة خلف نقطة متوهجة تتطاير منها شظايا صغيرة، ثم تبقى ترتجف. وبين المشاهد تشقّ الإبرة الشريط بخط متعرّج مضيء يعبر الإطار، وخلفه المشهد التالي محفور سلفًا.

**ألوانك فيه:**
- الأرضية دائمًا داكنة: لونك الأغمق مدفوعًا نحو الأسود هو طبقة الفيلم.
- لونك الأفتح هو لون الخدش: كل كلام وكل خط مضيء.
- لون التمييز (`accent`) هو الصبغة: يُفرش تحت الكلمة المهمة، وفي حلقة الرقم، وفي شطب القديم، وعند جذور الأشعة. وإن كان غامقًا لا يظهر على السواد، يُفتّح بلونك الأفتح بالقدر الذي يكفي.

**يتجنّب:** الخطوط النظيفة الهندسية، والتعبئات المصمتة الكبيرة، والوميض (الارتعاش نحو واحد بالمئة)، وزخارف شريط الفيلم كالثقوب وإطارات اللقطات، والكتابة فوق الأشعة.

## For Claude

- Every text is drawn with `cutText()` from `look/motion.js`: two passes, boil per drawing (`ground.n(t)`), hot point while cutting, skips once cut, dye under a key word. Do not draw text with a plain `kit.drawText` call.
- Lines are `needle()` paths (points every ~12 px from `seg` / `arc`); colour is `dye()` with `screen` blending. No flat fills except the logo, which is crossed by emulsion hatching.
- Time for marks is the drawing index (12 a second); the hot point and the joint move on the frame clock.
- Decoration (rays from `burst`, rings, the rail) stays away from the words or under them at low alpha; words never sit on rays.
- Keep `tone.flicker` around 0.012 and the plates' blotches under 0.06 alpha: the check counts flashes.
- Joint: the needle seam (`joint.js`, 0.45 s), the same every time.
