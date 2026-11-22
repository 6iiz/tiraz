# العد التنازلي · Ticking Split

**طابعه:** بثّ مباشر لحدث له لحظة صفر. خلفية شبه سوداء من لونك الداكن، وساعة كبيرة في أعلى الإطار تعدّ تنازليًا بالثواني وأعشارها، وشريط من عشر شرائح يمتلئ مع كل ثانية. الشاشة مقسومة إلى خلايا حادّة الحواف، في زاوية كل خلية شارة كاميرا بمربّع صغير، وكل الخلايا تعرض الثانية نفسها من زوايا مختلفة. كلما اقترب الصفر زادت الخلايا، وعند الصفر تنغلق كلها في صورة واحدة وتنقلب الساعة إلى لون علامتك وتصير «T+».

**يناسب:** الإطلاقات والافتتاحات والعروض المحدودة بوقت، والفعاليات والمباريات والحجوزات، والتطبيقات والخدمات التي تبيع السرعة والتوقيت، وكل رسالة فيها «الآن» أو «قبل ما يخلص الوقت».

**حركته المميِّزة:** الانقسام ثم الإغلاق عند الصفر. لكل مشهد صفره الخاص: السطر يُقال، والرقم يكتمل، وآخر بند يُعلَّم، والقيمة الجديدة تدخل. قبله تنقسم الشاشة وتُفتح خلية جديدة مع كل حدث، وعنده تُغلق الفواصل دفعة واحدة وتنقلب الساعة. لا تلاشي ولا انزلاق: كل تغيير قطعٌ في التخطيط.

**كيف يوزّع ألوانك:**
- الأغمق من لونيك هو الأرضية، ومنه ومن الفاتح تُمزج ألواح الخلايا وحدودها الرقيقة.
- الأفتح هو لون الكلام والأرقام.
- لون التمييز هو «الآن»: إشارة T−، ومربّعات الكاميرات الحيّة، وأقواس التتبّع حول العبارة المهمة وكلماتها، وعلامات الصحّ، والقيمة الجديدة، وكتلة الساعة بعد الصفر. وإن كان داكنًا لا يُقرأ على الألواح، يُفتَّح نحو لونك الفاتح بقدر ما يلزم فقط.
- الرمادي يعني «لم يحن بعد» أو «لم يعد مباشرًا».

**الأمانة:** الساعة زمن المشهد الحقيقي لا رقم من كلامك، فهي زينة لا تُقرأ كمعلومة. وشريط الشرائح تحت الرقم يمشي مع العدّ ولا يدّعي نسبة.

**يتجنّب:** الزوايا المستديرة والظلال والتوهّج والتدرّجات، والتلاشي بين المشاهد، والنصوص التي تملأ الخلايا، والعناوين المتوسّطة كالشرائح، وتحريك الخلايا كجدار مراقبة ثابت بلا حدث، وأي لون غير ألوانك.

## For Claude

- Ground = the darker brand colour; panels `mix(dark, light, tone.panel)`; the signal colour is `palette().accent` (the brand accent lifted towards light only until it reads ≥ 3.2:1 on a panel). No other hue.
- Every part has one `zero` in its own seconds (line 1.4, count `at + 1.6`, list the later of `at + 2.4` and the last item + 0.45, compare `at + 1.4`, ending 0.9). `clock(ctx, t, zero, …)` draws T−/T+ in fixed slots with tenths and a ten-segment bar; it is drawn with `fillText` (decoration, not a fact). Put sound `tick`s on whole seconds before zero and the one hit (`thump`/`impact`) on zero.
- Layout changes are cuts: `snap()` over `dur.cut` (open) or `dur.merge` (close into one picture, `lerpRect`). Cells via `cell()` with a chip (`CAM n`, `DOC`, `LIST`), accent dot = live, grey = not live / pending.
- The key phrase: `keyText` colour plus one set of tracking `brackets()` per phrase per row (from `keySpans()`); the legs stay above and below the letters so they never touch the next word.
- Other cameras (line CAM 2/3, ending quads) are built once into a canvas in `create` and drawn cropped; their text is `decor: true`.
- Readable text stays inside SAFE; leads, labels and the slogan wrap to two rows at ≥ 44 px (`balanced(…, { minPx: 44 })`).
- The hook is whole at frame 0 (no reveal: the line is set at once; brackets close by `at + 0.35`).
- Joint: six cells switch from old to new one after another, hard, with gutters opening and closing. Mark: SYNC badge and handle below SAFE.
