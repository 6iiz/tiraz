# ممر الإطارات · Gallery Walk

**طابعه:** ممرّ معرض فنّي مجسّم. جدار طويل بلونك الداكن، وأرضية خشبية، وعلى الجدار لوحات مؤطّرة بإطار داكن وحافة رفيعة بلون التمييز، فوق كل لوحة مصباح لوحات نحاسي يرمي ضوءه عليها وظلّ إطارها على القماش. كل فكرة لوحة: الكلام مرسوم على القماش الفاتح بخط كبير وتباين عالٍ، لا على الجدار. وتحت كل لوحة بطاقة صغيرة باسمك وحسابك كبطاقات المتاحف.

**يناسب:** المعارض والفعاليات الفنية، والغاليريهات، ودور التصميم والأزياء، والعقار الفاخر والفنادق والمطاعم الراقية، وكل علامة تريد أن تُعرض أفكارها كأنها أعمال مقتناة بهدوء وثقة. لا يناسب الرسائل الصاخبة السريعة ولا المحتوى الذي يحتاج عشر لقطات في ثانيتين.

**حركته المميِّزة:** المشي. بين كل فكرة والتي تليها تمشي الكاميرا على طول الممر من لوحة إلى اللوحة التالية: تبدأ بهدوء، تتراجع خطوة لترى الجدار والأرض، يلتفت الرأس قليلًا نحو وجهته مع خطوتين خفيفتين، ثم تقف أمام اللوحة الجديدة مواجهةً لها تمامًا. عند الوقوف يرتفع ضوء المصباح، وتميل الكاميرا نحو اللوحة قليلًا وأنت تقرأ. داخل اللوحة تُرسم الأشياء بضربة فرشاة من جهة القراءة: خطّ بلون التمييز تحت الكلمة المهمة، والبنود واحدًا بعد الآخر، وضربة تشطب القيمة القديمة. وفي الخاتمة يبرز شعارك من القماش نقشًا مجسّمًا يلقي ظلّه، ثم تتراجع الكاميرا لترى الجدار كله.

**كيف يوزّع ألوانك:**
- الأغمق من لونيك (`bg` أو `text`) هو المعرض: الجدار (مع لمسة خفيفة من لون التمييز) والإطارات والأرضية بدرجات منه، وهو أيضًا حبر الكتابة.
- الأفتح منهما هو القماش، فاللوحة فاتحة دائمًا والكلام داكن عليها، أيًّا كانت علامتك.
- لون التمييز للحافة الرفيعة داخل الإطار، وللكلمة المهمة والرقم والقيمة الجديدة (يُعمَّق نحو الحبر إن لم يُقرأ على القماش)، ولضربة الفرشاة تحتها، ولشعارك.
- الرمادي (للتمهيد والعناوين والقيمة القديمة) مزيج من الحبر والقماش.

**يتجنّب:** الكتابة على الجدار، والنص المائل وقت القراءة، والوميض، والارتداد والدوران، والانعكاسات المعدنية على الكلام، والقطع الحادّ بين الأفكار (الانتقال دائمًا مشي).

## For Claude

- Everything 3D lives in `look/ground.js`: one shared WebGL renderer; each part builds its own scene once (`create()`): a wall at z = 0, plank floor, skirting, and three hung frames (this part's canvas at x = 0, blank neighbours at ±`corridor.spacing`), each with a picture light (SpotLight; only the own one casts shadows). The camera rig (`camRig`) solves the frustum so the canvas surface maps 1 unit to 1 frame pixel at rest: `tokens.canvas` is the painted area in screen pixels, `G.area` is where text may go (inside SAFE).
- Text is painted, not extruded: `G.row(fit, r, {y, color})` paints one row of a `kit.fit` result into its own texture plane on the canvas (lit like the canvas, same weave bump); `G.bar()` is a brush stroke; `G.live()` a repainted layer (the counting number). Reveal with `G.wipe(layer, q)` (clipping from the reading side), report with `G.rec(layer, walking)` every frame (reported as decor while walking).
- The joint is the walk: `motion.js walk(u)` is a pure function used by the leaving part (last `tokens.walk` s), the arriving part (`[at, at + walk]`) and `joint.js`, which splits the two renders at the wall point half-way between canvases. So: keep `tokens.walk` equal to the transition duration in `preview.json`; keep the corridor identical in every part (no per-part lights, floor or wall changes, nothing near the half-way point); a frame's outer edge must stay well inside ±spacing/2.
- The lamp of the own canvas comes up only while standing (`G.lamp`), so it matches its neighbours' level during every walk (the seam stays invisible).
- Hook: line text is already painted when the walk-in starts; the key stroke finishes by at + 0.75 s, so `at: -0.8` is whole on frame 0.
- Colours: `palette(brand)` only (night/ink = darker of bg/text, paper = lighter, key = accent deepened until contrast ≥ 3.4 on paper). No text in code: everything comes from `says` and the brand.
