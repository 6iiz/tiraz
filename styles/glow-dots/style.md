# نقاط اليراعات · Glow Dots

**طابعه:** ليلة صيف بلون علامتك الداكن، ولا ضوء فيها إلا نقاط صغيرة دافئة كاليراعات. بعضها بعيد خارج البؤرة فيبدو أقراصًا خافتة كبيرة، وبعضها قريب يطفو ببطء إلى الأعلى ويومض ثم ينطفئ. الكلام نفسه مصنوع من هذه النقاط: تتجمّع من الظلام في شكل الحروف، ثم تشتعل الكلمة تحتها وتبقى النقاط عليها تلمع بهدوء. هادئ وساحر ودافئ، بلا خطوط ولا ألواح ولا أشكال صلبة.

**يناسب:** المقاهي المسائية والمطاعم، والعطور والشموع والهدايا، والفعاليات الليلية والأعراس، والمواسم والأعياد، والعلامات التي تحكي قصة بعاطفة وحنين.

**حركته المميِّزة:** التجمّع. نقاط كل كلمة تأتي من أنحاء الليل على مسارات حلزونية، كبيرة وباهتة وهي تسافر، صغيرة وحادة حين تصل، ثم تشتعل الكلمة. والعبارة المهمة تضيء بلون علامتك، ويدور حولها سرب واحد من اليراعات الملوّنة يحيط بها كلها. وفي المقارنة تتخلّى نقاط القديم عنه فيخبو إلى جمرة باهتة، وتطير النقاط نفسها إلى الأسفل وتتجمّع من جديد لتصير الكلمة الجديدة: لا نقطة تُخلق ولا نقطة تضيع. وعند الخروج تتحرّر النقاط وتصعد كالجمر. وبين المشاهد ينفتح المشهد الجديد من خلال أقراص ضوء ناعمة تتّسع وتلتقي. وفي الخاتمة يُستدعى كل ضوء في الليل ليتجمّع في شعارك.

**ألوانك فيه:**
- اللون الأغمق بين لونيك هو الليل.
- اللون الأفتح هو ضوء النقاط والكلام.
- لون التمييز للعبارة المهمة وسربها، بعد أن يُفتَّح نحو لونك الفاتح حتى يُقرأ على الليل.
- الكلام التمهيدي ضوء أخفت، مزيج من لونيك.

**يتجنّب:** الألوان الباردة والزرقة التقنية، والخطوط والإطارات والأشكال الصلبة، والنقاط المربعة أو الحادة، والوميض الكامل للإطار، والنقاط التي تتحرك بلا سبب أمام الكلام.

## For Claude

- Palette from `motion.palette`: night = darker brand colour, glow = lighter, `key` = accent lifted toward the light to 4.5:1 on the night. Points are drawn additively (`lighter`) with cached radial sprites (`sprite`, `disc`).
- Text is never drawn per frame from the font: `lightText()` renders each fitted text once (glyphs with glow, a mask, jittered-grid point samples, word cut boxes, merged key runs). Parts draw it with `drawLight()` and call `kit.drawText(..., each: () => false)` only to report the boxes to the safe-area check.
- One emphasis per key phrase: key words of a row merge into one run, and each run gets one `halo()` swarm.
- Points follow `place()`: a tightening spiral from a seeded origin, then a quiet shimmer, then an upward drift on leaving. Keep at most about 2400 points per text (`lightText` widens its grid itself) so a 28 s reel renders in a few minutes.
- A line that opens a reel (`at < 0`) squeezes its gather so every word has kindled by t = 0. Long lead-ins and labels use `balanced()` with `minPx` 44.
- Compare must keep conservation: the new value's points start on the old value's points.
