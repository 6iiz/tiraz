# قصة بالأرقام · Data

**طابعه:** صفحة رسوم بيانية تحريرية، كأنها من صحيفة جادة. خطوط شبكة أفقية خافتة ترسم نفسها في أول ثانية، ومحاور بعلاماتها الصغيرة، وأعمدة وخطوط تمتدّ حتى قيمها الحقيقية بالضبط ثم تتوقّف. سلسلة واحدة فقط تُبرَز بلون علامتك، وكل ما عداها بدرجة هادئة. الملاحظات تُعلَّق على خطوط إشارة تنتهي بنقطة، والرقم الكبير يأتي مع شريط يسنده. كل شيء دقيق ومرتّب ومحاذٍ لجهة القراءة.

**يناسب:** كل رسالة فيها رقم صادق تريد أن يراه الناس: نسبة رضا العملاء، والنمو، وتوفير الوقت أو المال، والمقارنة بين قبل وبعد، والترتيب. يناسب الاستشارات والشركات المالية والتقنية والمتاجر التي تملك أرقامًا حقيقية، والعلامات التي تريد أن تبدو موثوقة.

**حركته المميزة:** الشرطة المرجعية. في المقارنة الرقمية يُرسم عمودان على خط صفر بارتفاعين حقيقيين، ثم يمتدّ خط متقطّع من مستوى القيمة القديمة إلى العمود الجديد، ويظهر قوس بلون علامتك يقيس الفرق. فيُرى الفرق قبل أن يُقرأ.

**ألوانك فيه:**
- لون الخلفية (`bg`) هو الورقة التي تُرسم عليها الرسوم.
- لون النص (`text`) للأرقام والكلمات، ومنه تُمزج الشبكة والمحاور والسلاسل الهادئة.
- لون التمييز (`accent`) للسلسلة المبرَزة وحدها: العمود الجديد، والشريط، والكلمة المهمة، ونقطة الملاحظة. يُكتب به النص إذا كان مقروءًا على خلفيتك، وإلا بقي النص بلونه وبقي التمييز في الخطوط والأشرطة.

**الأمانة:** الرسم لا يخترع بيانات. الشريط تحت الرقم يدلّ على نسبة حقيقية فقط حين يكون الرقم نسبة مئوية من صفر إلى مئة؛ وفي غير ذلك يمتلئ مع العدّ ولا يدّعي نسبة. وأشرطة القائمة تدلّ على الترتيب فقط، لا على كميات. والمحور تحت العنوان مقياس للعين بلا أرقام.

**يتجنّب:** الرسوم ثلاثية الأبعاد، والدوائر المقطّعة، والتدرّجات، وأكثر من لون تمييز واحد، والمحاور التي لا تبدأ من الصفر، وأي رقم لم يأتِ من كلامك أنت.

## For Claude

- One highlighted series per scene, in `accent`; everything else is `pal.series`, `pal.track`, `pal.axis` (mixes of bg and text from `palette()` in `look/motion.js`).
- Order of drawing in time: axis/track (`rule`, `ticks`, drawn from the reading side with `D` = inOutCubic), then data (bars to true values, counts with `countValue` landing exactly), then the annotation (`leader`, reference line, bracket). Words use `arrive(ctx, p, box, size, rtl)`: a short slide from the reading side plus fade (`E` = outQuart). No overshoot anywhere.
- Never invent data: every bar length comes from `says`. Bars start at zero. Show a share only when the value is a percentage 0..100; ranked list bars encode order only; decorative scales carry no digits. Do not print derived numbers (no computed deltas or percentages) unless they are in `says`.
- Numbers through `kit.number`; units and labels through `kit.fit` + `kit.drawText`; long labels via `balanced()`.
- Layout is flush to the reading side on the ground's 96 px gridlines; text on the plain ground only, never on a bar.
- Joint: the accent reading cursor in `joint.js`. Mark: three bars and the handle in the mono face, below SAFE.
