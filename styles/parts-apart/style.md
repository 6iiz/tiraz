# التفكيك · Parts Apart

**الطابع.** جهاز صغير مصوَّر في استوديو مظلم يتفكّك أمامك قطعةً قطعة. الطبقات ترتفع عن بعضها على محور واحد بمسافات متساوية، الغطاء أولًا ثم ما تحته، وكل قطعة تبقى على وضعها كما هي داخل الجهاز. الكاميرا لا تقف: الجسم يدور ببطء شديد طوال المشهد. الأسماء معلّقة على القطع بخطوط إشارة رفيعة تبدأ بنقطة على القطعة، فالكلام جزء من الجسم لا جدول بجانبه. وفي آخر كل مشهد تعود القطع وتجلس فوق بعضها كأنها جسم واحد.

**لمن يناسب.** الأجهزة والإلكترونيات والمنتجات المصنّعة، وشركات التصنيع والقطع، والتطبيقات التي تريد أن تشرح «ما تحت الغطاء»، وكل علامة عندها خطوات أو مكوّنات تريد أن تُظهرها بدقة وثقة. يناسب الرسائل التي فيها تركيب وأجزاء وأرقام. ولا يناسب الأجواء الدافئة المصنوعة باليد ولا الرسائل العاطفية.

**الحركة المميِّزة.** الانفصال على محور واحد: القطع ترتفع بهدوء من مكانها، تمشي، وتستقر في مكانها الجديد، ثم تنزل على بعضها في الخروج. خطّ الإشارة يُرسم من القطعة إلى الكلمة. في العدّ، الرقم نفسه هو الذي يفتح الجهاز: كلما صعد طبقة انفصلت قطعة، وخط قياس بجانب الكومة يطول معها. في القائمة كل بند قطعة، يرتفع ويُكتب اسمه بجانبه. وفي المقارنة تنسحب القطعة القديمة جانبًا وتهوي، وتدخل القطعة الجديدة بلونك مكانها. وبين المشاهد تنقسم الصورة شرائح أفقية تبتعد عن بعضها لتكشف المشهد التالي. وفي الخاتمة يُغلق الجهاز ويُطبع شعارك على غطائه.

**كيف يوزّع ألوانك.**
- اللون الأغمق بين لونيك هو **الاستوديو**، بإضاءة ناعمة في وسطه وأطراف تغمق.
- القطع كلها **درجات** بين لونيك، بحافة ضوء رفيعة على ظهر كل قطعة.
- **لون التمييز** للقطعة المهمّة وحدها: الشريحة التي تشير إليها الكلمة المفتاحية، أو البند المميّز في القائمة، أو القطعة الجديدة في المقارنة، وشعارك على الغطاء.
- الكلمة المفتاحية بلون التمييز (يُفتَّح نحو لونك الفاتح بقدر ما يلزم ليُقرأ على الأرضية الداكنة) وتحتها قوس إشارة واحد، حتى لو كانت عبارة من كلمتين.
- النص باللون الفاتح، والسطر التمهيدي والتسميات الثانوية بالرمادي.

**يتجنّب.** الكتابة فوق القطع، والألوان من خارج علامتك، والارتداد والاهتزاز، والجداول بجانب الجسم، والضوء المبهر والتوهّج، وتكبير الكاميرا ثم تصغيرها.

## For Claude

- Palette from `motion.palette(brand)`: the darker of bg/text is the studio (`dark`), the lighter is type (`light`); plates are `plate(k) = mix(dark, light, k)`; `key` is the accent lifted toward `light` until it reads 4.5:1 on the ground. Accent only on the one part that matters and its key word.
- The device is `makeDevice(pal, { kinds, accentLayer, chip })` + `view(theta, s, cx, cy)` + `drawDevice(ctx, dev, P, heights)`. Plate tops are painted once in `create`; a frame is one affine transform per layer and a few silhouette fills for its thickness. Keep it that cheap: no per-pixel work, no new canvases per frame.
- One axis only: layers lift straight up (`heights` with a 0..1 lift per layer, top part first) and sit back down at the scene's end (`close` over the last 0.5 s). The view turns slowly and continuously (`tokens.model.turn`); never stop it, never zoom in and back out.
- Text never sits on a part. Labels hang off parts by `leader()` (dot on the part, ring at the text). A key word or key phrase gets `pal.key` and one `bracket()` per run of key words on a row (`keyRuns`), not one per word.
- Words arrive with `settle()` (up from 34 px below, quickly opaque) and leave by dropping as the parts close. The hook must be fully set at frame 0 when `at` is −0.8: the line's word steps are squeezed into 0.42 s.
- Long lead-ins and labels wrap onto a second row at ≥ 44 px (`minPx: 44`), never shrink below that.
