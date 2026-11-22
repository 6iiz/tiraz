# سحابة النقاط · Point Cloud

**طابعه:** مكانٌ ممسوح بالليزر يطفو في العتمة: أرضٌ متموّجة وأبنية وأشجار، كلها نقاط صغيرة لا خطوط ولا سطوح، ولونُ كل نقطة من ارتفاعها. الكاميرا تدور حول هذا المكان ببطء طوال الريل كله دورة واحدة لا تنقطع عند الانتقال. والكلام نفسه يُمسح: خطٌّ رفيع ينزل على السطر، فتطير نقاط الكلمات من تبعثرها إلى أماكنها ثم تتماسك حرفًا مصمتًا. وحين يغادر الكلام يتفكّك إلى نقاطه وتطير عنه.

**يناسب:** المكاتب الهندسية والمعمارية، والمساحة والعقار والإنشاءات، والشركات التقنية والبيانات والذكاء الاصطناعي، وكل علامة تريد أن تقول «قسنا، ونعرف بالضبط».

**حركته المميِّزة:** المسح. جبهة رفيعة بلون علامتك تمرّ على الكلام من أعلى إلى أسفل، وخلفها تتكثّف النقاط كلامًا. الكلمة المهمة «تُصنَّف»: تأخذ لون الفئة، وينغلق حولها إطار زوايا رفيع واحد يضمّ العبارة كلها ولو كانت كلمتين، ثم ينزل منها خيط قياس إلى السحابة. وفي الرقم يرتفع مستوى تصنيف داخل السحابة مع العدّ، وفي المقارنة يقطع مستوى القطع القديمَ فيتساقط نقاطًا ويُمسح الجديد مكانه.

**ألوانك فيه:**
- اللون الأغمق من لونَيك (الخلفية أو النص) هو العتمة التي تطفو فيها السحابة، والأفتح هو لون الكلام.
- السحابة تدرّج من لونيك بحسب الارتفاع، وأعلاها مائل إلى لون التمييز.
- لون التمييز (`accent`) هو لون «الفئة»: جبهة المسح، وإطار الكلمة المهمة، وخيوط القياس. وحين يُكتب به يُفتَّح نحو لونك الفاتح حتى يُقرأ على العتمة.
- الرماديات كلها مزيج من لونيك.

**يتجنّب:** التوهّج والضباب الملوّن، والواجهات المختلقة والأرقام المزخرفة، والكتابة فوق السحابة بلا ستارة، والقفز والارتداد، وتحريك النقاط لتشكّل صورًا ليست من المسح.

## For Claude

- The ground is the darker of `bg`/`text` (`palette().dark`), type is the lighter; key text uses `palette().key` (the accent lifted toward light until 4.6:1 on the ground). Never draw text in the raw accent.
- The cloud is built once per page in `ground.js` (seeded) and turns with `t + clock`: never restart it per scene. Text lives above `tokens.cloud.scrim[0]` (about y 880); the scrim keeps that zone clean.
- Every text block enters through `scanned()` from `look/motion.js`: returns sampled from the words (`sampleText`), front from top to bottom, solid type takes over behind it. Entrance ≤ 0.75 s so a line at `at: -0.8` is whole at frame 0. Exit = lift-off of the returns.
- Key phrase: one `bracket()` per run from `runs(layout(…))`, padded by about half a word space so it never touches the neighbour. A run on the last row of a line gets the leader into the cloud.
- Lead-ins and titles keep ≥ 44 px (`minPx: 44`) and wrap to two rows with `balanced()` rather than shrinking.
- Sound: soft kinds only (`tick`, `click`, `swish`, `rustle`, one `shimmer` in the ending).
