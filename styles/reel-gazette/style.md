# جريدة السينما · Reel Gazette

**طابعه:** جريدة إخبارية سينمائية قديمة تُعرض من بكرة فيلم. إطار عرض بزوايا مستديرة في عتمة القاعة، وصورة بلون واحد بين لونيك الأغمق والأفتح كفضّة الأفلام الأولى، وعليها حُبيبات تتبدّل مع كل إطار، ورفّة ضوء خفيفة، وغبار يومض، وخدوش عمودية تعيش لحظات، وتمايل بسيط في الصورة. الحركة كلها على إطارات الفيلم (أربعة وعشرون في الثانية) فلها تقطّع آلة العرض. الأخبار تحملها أشياء: جريدة تدور نحو العدسة، وقصاصات تُصفع على الطاولة، وقلم شمع يشطب، وعدّاد البداية بعقربه الدوّار، وبطاقات عناوين بإطار مزخرف.

**يناسب:** العلامات التي لها حكاية أو تاريخ أو طابع كلاسيكي: المقاهي والمخابز القديمة، والمحامص، والحلاقين، ومحلات الأنتيك، والفعاليات ذات الطابع التراثي، وكل إعلان يُقدَّم بنبرة «خبر عاجل من زمان» فيه دعابة.

**حركته المميِّزة:** الجريدة الدوّارة. الصفحة الأولى من جريدة باسم علامتك تأتي من بعيد وهي تدور دورتين، ثم تقف فجأة مواجهةً للكاميرا والعنوان عليها هو جملتك، وبعد أن تقف تُلوَّن الكلمة المهمة باليد بلونك كما كانت تُلوَّن النسخ القديمة. وبين المشاهد تنفتح القصة التالية في دائرة تتّسع من وسط الإطار.

**ألوانك فيه:**
- الصورة كلها درجات بين لونيك الأغمق والأفتح: الشاشة رمادية داكنة منهما، والورق والقصاصات قريبة من لونك الأفتح، وبطاقات العناوين قريبة من الأغمق.
- لون التمييز تلوين يدوي فقط: رقعة بحواف غير منتظمة خلف الكلمة المهمة، ومعيّنات الزخرفة، وخط قلم الشمع، وميدالية الشعار. وما يُكتب عليه يُختار تلقائيًا من لونيك الآخرين بحسب أيّهما أوضح.

**يتجنّب:** الحركة الناعمة الحديثة على ستين إطارًا، والتدرّجات الملوّنة، والشرائط السفلية العصرية، والتقريب البطيء الطويل على الصور، والتلوين بلون التمييز خارج الكلمة المهمة والزخارف الصغيرة، والوميض القوي.

## For Claude

- Palette from `motion.js palette()`: a monochrome ramp `P.s(k)` = mix(darker, lighter, k); paper `P.paper`, cards `P.card`, rules `P.rule`. The accent is a hand tint (`tint()`, `inked()`), diamonds (`diamond()`, `frame()`), the grease pencil and the logo medallion; text on it is `P.onAccent`.
- Every part draws `ground.draw()` first and `ground.over()` last: over() lays grain, flicker, dust, scratches, vignette and the gate surround on top, so nothing shows outside the gate. Keep all reading text inside SAFE (it is well inside the gate).
- Time inside the gate runs on film frames: compute motion from `q(t)` (24 fps). Objects "on the film" (pages, clippings, leader, globe) go through `ground.weave(ctx, t)`; title cards stay steady.
- Signature moves: the spinning newspaper (`line.js`, two turns, `O` = outQuart, stops dead, tint after landing); the leader for numbers; clippings slapped down for compare with a grease-pencil strike; deco title cards for lists, items cut in one per beat with a two-frame jump. Joint: the iris (`joint.js`, 0.5 s), never a dip to black.
- The masthead of the newspaper is the brand's short name; no other words are invented in code.
- Sounds: paper and projector kinds (`rustle`, `thump`, `tick`, `click`, `scratch`), one `ding` for the medallion in the ending.
