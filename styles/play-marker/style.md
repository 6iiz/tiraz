# محلل المباريات · Play Marker

**طابعه:** فقرة التحليل في استوديو رياضي. كاميرا بثّ عالية تنظر إلى ملعب مرسوم بألوانك (عشب بلونك الداكن ممزوجًا بلون التمييز، بخطوط قصّ متناوبة وخطوط ملعب فاتحة ومدرّجات منقّطة)، وعليه لاعبون صغار من فريقين بلا أسماء ولا شعارات. اللعبة تجري، ثم تتجمّد مع دفعة تقريب صغيرة، ويرسم المحلّل فوق الصورة المجمّدة بقلم بلونك: حلقة تحت قدمي لاعب، وسهم منحنٍ لمسار الكرة، ومساحة مظلَّلة لم يغطّها أحد. الكلام على بطاقات بثّ داكنة بشريط من لونك على جهة القراءة، وفي الزاوية علامة البرنامج وشارة الحالة (تشغيل، تجميد، ترجيع) مع عدّاد الإطارات.

**يناسب:** الأندية والأكاديميات الرياضية، والصالات والمدرّبين، والمحلّلين وصنّاع المحتوى الرياضي، ومتاجر المعدّات، وكل علامة تشرح «كيف حصل هذا» بحماس: إعادة، تجميد، ثم الشرح خطوة بخطوة.

**حركته المميِّزة:** التجميد والقلم. كل فكرة تُرى وهي تحدث أولًا، ثم تتوقّف الصورة بدفعة ويبدأ القلم: حلقة، سهم، تظليل. الكلمة المفتاحية بلون القلم وتحتها خطّ مرسوم باليد. وفي المقارنة يُشطب القديم بعلامة ×، وتُرجَّع اللقطة (اللاعبون يركضون إلى الخلف)، وتُعاد اللعبة، ويظهر الجديد عند التجميد الثاني. وفي القائمة تُسطَّح الصورة إلى لوح تكتيكي من فوق، وكل بند يأخذ رقمًا يُثبَّت على لاعب في اللوح.

**ألوانك فيه:**
- الأغمق بين لونيك هو الاستوديو والبطاقات، ومنه العشب ممزوجًا بقليل من لون التمييز. الأفتح هو خطوط الملعب وقمصان الفريق الأول والكتابة.
- لون التمييز (`accent`) هو القلم والشريط وعلامة البرنامج، وتُكتب الكلمة المفتاحية به (أو بمزيج أفتح منه إذا كان غامقًا على البطاقة).

**يتجنّب:** أسماء الفرق والدوريات والقنوات وشعاراتها، والكتابة مباشرة على العشب بلا بطاقة، والرسم قبل أن تُرى اللعبة، وأكثر من مجموعتي رسم في التجميد الواحد، والوميض المتكرّر (ومضة خفيفة واحدة لكل تجميد).

## For Claude

- Light/dark come from the brand by luminance (`palette` in `look/motion.js`): studio and cards = the dark one, lines and team A = the light one, turf = `mix(dark, accent, tokens.tone.pitch)`; the marker is the accent, and key text uses `P.key`.
- Text only on cards (`card()`), never on the turf. Cards slide in from the reading side and out the other way.
- Watch, then take apart: the play (`play(tau)`, a fixed 1.6 s passage) runs before every freeze; drawings (`ring`, `arrow`, `zone`, `pen`) start after the freeze and use at most two groups. Reuse the same passage, one layer deeper each time.
- One freeze = one `punch()` and one `flash()`; never more than one flash per second.
- Key runs (`runs()`) get the marker colour and one hand-drawn underline per run; a multi-word key phrase is one stroke.
- The pitch is drawn once per scene (`pitch()`); players are drawn per frame through `view()`. Keep `MARGIN` for pans.
- Hook: the card, words and drawings in `line.js` all land within 0.8 s of `at` (freeze at `at + 0.25`).
- Sound: `swish` for cards, `thump` on a freeze, `scratch` for marker strokes and strikes, `whoosh` for the sting and the rewind, `impact` only on the count's landing and the ending.
