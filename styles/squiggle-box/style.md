# صندوق ممفيس · Squiggle Box

**الطابع:** مجسّم بلدة صغيرة على طاولة، نطلّ عليه من نافذة عضوية الحواف في أعلى الإطار، حوافها تذوب في حُبيبات كأنها مطبوعة. البلدة مرسومة بألوان مسطّحة على طريقة ممفيس: كتل بأوجه ثلاثة لكل منها درجة واحدة، وخطّ حبر سميك حول كل وجه، ونقوش صغيرة على الجدران (نقاط، خطوط مائلة، تعرّجات، رقائق ملوّنة)، وظلال حادة إلى جهة واحدة مملوءة بنقاط طباعة. فيها بركة تتموّج وقارب صغير، وأشجار كالمصّاصات تتمايل، وطيور تعبر، ونوافذ تضيء واحدة بعد الأخرى طوال الريل، وظلّ غيمة منقّط يمرّ فوقها، والكاميرا تقترب وتبتعد بهدوء شديد. تحت النافذة ثلاث علامات ممفيس (نقطة، مثلّث، تعرّج)، وتحتها الكلام على الورق.

**لمن يناسب:** المقاهي والمخابز والمحلات الصغيرة، ومشاريع الأحياء والعقار والضيافة، والاستوديوهات الإبداعية ومتاجر التصميم والهدايا، وبرامج الأطفال والعائلة، وكل علامة دافئة ومرحة تحب أن تُري المكان قبل أن تحكي القصة.

**الحركة المميِّزة:** الفرقعة. كل كلمة وكل ملصق وكل بطاقة تقفز من حجم أصغر بنطّة صغيرة وميلة خفيفة ثم تستقيم. العبارة المهمة على ملصق بلونك له حدّ من الحبر وظلّ صلب منقّط. والشطب في المقارنة خربشة متعرّجة تُرسم على طولها. وبين المشاهد يمرّ شريط متموّج منقّط يحمل المشهد التالي خلفه. وفي الخاتمة تنكمش النافذة إلى كوّة دائرية والبلدة ما زالت حيّة فيها، ويُختم عليها قرص بلونك يحمل شعارك.

**كيف يوزّع ألوان الزبون:**
- اللون الأفتح بين لون الخلفية ولون النص هو الورق، والأغمق هو الحبر (الخطوط والكلام).
- لون التمييز للملصقات والأسطح البارزة في البلدة والقرص الذي يحمل الشعار.
- الألوان الباستيلية كلها مزيج من لون التمييز أو الحبر بالورق، والظلّ الصلب مزيج من الحبر ولون التمييز.

**يتجنّب:** التدرّجات والظلال الضبابية والإضاءة الواقعية، والشخصيات والوجوه، وتشويه الحروف أو تدويرها منفردة، والكتابة فوق البلدة، وأي لون من خارج الهوية.

## For Claude

- Palette from `motion.palette(brand)`: `paper` (the lighter brand colour) and `ink` (the darker), `accent`, and mixes only: `pastel`, `soft`, `deep`, `sky`, `ticketA/B`, `shade` (hard shadow). Text is `ink` on paper or tickets, `onAccent` on accent stickers; leads and labels use a 30 % paper mix of ink.
- The diorama is painted once in `ground.js` (iso boxes with outlines, patterns, halftone shadows); only small things move per frame (ripples, boat, trees, birds, windows, the cloud's shadow, the camera creep). Keep it inside the window (`tokens.frame`); the window opens at reel time 0 and `ground.draw(ctx, t, { shut })` closes it for the ending.
- Text lives in the zone under the window (`tokens.zone`), with the three marks (`marksRow`) above it on line, count and compare. Lists use marks as bullets instead.
- One motion: `pop` (spring from 70 % with a settling tilt) in, `leave` out; strikes and links are drawn along their length (`squiggle`). Words arrive whole; with `at: -0.8` the hook has landed before frame 0.
- A key phrase is one `sticker` under the whole run (`runs(layout(...))`, word spaces opened with `widen`). Never one sticker per word.
- Wrap with `balanced`; leads and labels keep `minPx: 44` and take two rows rather than shrink.
- Sounds are light: `pop` (low/mid/high) on arrivals, `tick` on the roll, `ding` on the landed number, `scratch` on the scribble, `swish` on the band joint.
