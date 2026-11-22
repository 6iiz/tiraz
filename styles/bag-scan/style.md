# سكانر المطار · Bag Scan

**طابعه:** الشاشة شاشة جهاز فحص الحقائب. الحقل فاتح لأن الأشعة تعبره بلا عائق، وكل ما في الصورة جسم تراه الأشعة: حقيبة بقشرة رقيقة شفّافة، وجدران أغمق عند الحواف، وسحّاب منقّط، ومقبض، وعجلات معدنية مصمتة. تحت الكلام يحمل السير أشياء متفرّقة كما يراها الجهاز: قارورة، ومفاتيح، وهاتف، وسلك ملفوف. ويحيط بالصورة إطار الجهاز الداكن البسيط: شريط حالة فيه دليل المواد بأربع درجات، وصفّ أزرار وظيفية في الأسفل، وحسّاس خطّي رفيع بلونك على الجهة التي يدخل منها السير. والكلام هو محتوى الحقيبة.

**يناسب:** الشحن والتوصيل واللوجستيات، والسفر والطيران والفنادق، والأمن والتدقيق والامتثال، والتجارة الإلكترونية، وكل علامة تقول «نكشف لك ما بالداخل» أو «فحصناه قبلك».

**حركته المميِّزة:** السير والمشغّل. لا شيء يظهر أو يطير؛ السير يسحب الصورة كلها من جهة القراءة عبر الحسّاس ثم يتوقّف، وبعد التوقّف يتصرّف المشغّل: مربّع تحديد منقّط تتحرّك نقاطه ينطبق على العبارة المهمة ثم يقلبها «عكسًا» (كتابة فاتحة على شريط داكن). في القائمة ينتقل التحديد من صنف إلى صنف ويُرفع كلٌّ منها من شبح باهت إلى كثافة كاملة. وفي المقارنة تُعلَّم الحقيبة القديمة بإشارة رفض، وتصل الجديدة على المسار الثاني. وبين المشاهد يعود السير إلى الدوران ويسحب الصورة خارجًا.

**كيف يوزّع ألوانك:**
- الأفتح من لونيك هو «لا شيء في الطريق»: حقل الشاشة.
- الأغمق هو «ما لا تعبره الأشعة»: الكلام، والإطار، والشريط المعكوس.
- لون التمييز هو المادة: قشرة الحقيبة مزجه بالفاتح، وجدرانها هو نفسه، والمعدن مزجه بالداكن. ودليل المواد في الأعلى يعرض هذه الدرجات الأربع.
- لا يدخل أي لون من خارج علامتك؛ «ألوان الأشعة» هنا درجات من لونك.

**يتجنّب:** البرتقالي والأخضر والأزرق الجاهزة لأجهزة الفحص، والكتابة على الأشياء المتفرّقة، والتلاشي والارتداد، والأرقام المختلقة على الإطار، وأسماء أي جهاز أو مصنّع.

## For Claude

- Ground = the lighter of bg/text (`palette()` in `look/motion.js`); ink = the darker; material steps are mixes with the accent (organic → organic2 → accent → metal). Keep it that way so any brand stays readable: ink text on a light shell.
- Every part's picture moves as one image on the belt (`belt()` offset + `ctx.translate`), clipped at the line sensor; the chrome never moves. Text drawn while the belt is moving is marked `decor` (it is in transit, not at its reading place); at rest it is measured.
- Emphasis is the operator's inverse (`inverse`, one band per run of key words from `keyRuns`) plus the marching selection box (`select`). A multi-word key phrase is one band and one box.
- The hook (`at < 0`) compresses the belt and the selection so it is complete and selected on the first frame.
- Cases are drawn once per scene (`bag()` → canvas); loose objects once per ground. Nothing per-pixel per frame.
- Chrome labels are words (`ZOOM`, `INV`, `LANE A`), never invented counts or speeds.
- The joint pulls the old picture out under the fixed chrome while the next scene's own belt brings its case in.
