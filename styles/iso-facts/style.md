# إنفوغراف مجسّم · Iso Facts

**الطابع:** مخطّط يشرح نفسه. ورقة فاتحة بنقاط خفيفة، وفي أسفلها عالم صغير على لوح عائم مرسوم بزاوية أيزومترية مسطّحة: عشب وطريق دائري تدور عليه سيارات صغيرة وحافلة، وبيوت ومكاتب ببرج بلون علامتك، وأشجار مخروطية، وتوربين هواء يدور. اللوح مقطوع من جانبيه كعيّنة، فترى تحت العشب طبقات التربة والطين والصخر ونهايات الأنابيب. فوق العالم تطفو بطاقات بيانات صغيرة بأعمدة تتنفّس، والكلام نفسه على لوحات بيضاء معلّقة بخيط إشارة يصلها بمكان على اللوح. ليس كتلًا داكنة على أرض سوداء، ولا حيًّا ممتدًّا إلى حواف الشاشة: هو لوح واحد عائم يُقرأ كإنفوغرافيك.

**لمن يناسب:** الخدمات التي تشرح كيف تعمل: التوصيل والنقل، والمدن والعقار، والطاقة والمرافق، والتطبيقات التي تربط الناس بمكان، والتقارير السنوية والجهات العامة. ويناسب كل رسالة فيها رقم أو خطوات تريد أن تُرى على أرض الواقع.

**الحركة المميِّزة:** الدبّوس والبطاقة. يقفز خيط إشارة من نقطة على اللوح إلى الأعلى، وفي طرفه تنفتح بطاقة دفعة واحدة بلا ارتداد، ثم تستقرّ الكلمات فيها من تحت. الأرقام تُبنى قبل أن تُقرأ: صناديق متطابقة تسقط على الساحة واحدًا بعد واحد والعدّاد يزيد معها. وفي القائمة يكبر مبنى على اللوح مع كل سطر، وفوقه دبّوس بالرقم نفسه. وفي المقارنة يُشطب القديم ويغوص مبناه الرمادي في اللوح، ويمشي طريق متقطّع إلى برج جديد بلونك. وبين المشاهد تنفرش الصفحة التالية بلاطًا معيّنًا من الأسفل إلى الأعلى.

**كيف يوزّع ألوان الزبون:**
- **الأفتح** من لونيك هو البطاقات، ومنه الورقة بدرجة أغمق قليلًا، والجدران البيضاء.
- **الأغمق** هو الحبر وخيوط الإشارة والطريق وطبقات الصخر، ومنه الرماديات.
- **لون التمييز** هو البرج والمبنى المهم والصندوق الأخير والدبّوس، وشريط مستدير تحت العبارة المهمة (والكتابة فوقه بالفاتح أو الغامق حسب التباين). وممزوجًا بالفاتح يصير العشب والماء والمباني الملوّنة.

**يتجنّب:** المنظور والميلان ودوران الإسقاط، والظلال الناعمة على المجسّمات (ثلاث درجات مسطّحة فقط)، والكتابة على العالم نفسه، والارتداد، وأي لون ليس من ألوان العلامة.

## For Claude

- Ground is the lighter brand colour (`palette()` in `motion.js` picks it by luminance); cards are that colour, the sheet is 7 % towards the dark one. Every tone is a `mix` of the three brand colours; each solid has three flat face tones (`three()`), no gradients on solids.
- True isometric only (`project`, 30°). The board (`ground.js`: `U`, `B`, `OX`, `OY`) is cached once per page; per frame only vehicles, turbine blades, chips and the scene's square are drawn. A part fills the square with `ground.draw(ctx, t, { plaza })`, drawn between the back and front road so the cars pass correctly.
- All readable text lives on panels (`M.panel`) above the board, never on the world. Each panel hangs on a leader from a board point (`ground.at(x, y, z, t)`, which includes the float).
- Signature: leader 0.25 s, then `M.pop` (scale 0.86 → 1 with a strong ease-out, no overshoot), then words `settle` from 26 px below. Exit: the panel shrinks back into its pin (`OUT`).
- The key phrase gets one `marker` per run (several words = one marker), text on it in `pal.onAccent`.
- The hook: with `at: -0.8` everything in `line.js` is complete by t = 0 (word stagger is fitted into 0.47 s).
- Lead-ins and labels use `minPx: 46` and may wrap to two rows; they are never shrunk below that.
- Sound: soft `pop`s for panels and buildings, `tick` for the count, `scratch` + `drop` for the struck old value, `rustle` on the tile joint, `ding` on the landed number and the logo.
