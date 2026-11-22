# ألعاب سريعة · Rapid Play

**طابعه:** برنامج ألعاب حفلات صاخب. شمس من أشعّة بلونك تدور خلف كل شيء، وأرضية مسرح داكنة، ولوحة النتيجة في الأعلى: ثلاثة قلوب للأرواح وثماني نقاط للمراحل. في الوسط شاشة اللعبة بإطار سميك وظل حادّ، وكل جزء من الريل لعبة صغيرة بمادّة مختلفة داخل الشاشة: بطاقة أمر تُقذف على خطوط سرعة، ثم شاشة كريستال سائل قديمة بأرقام قطع، ثم ورقة دفتر مسطّرة، ثم صفحة مطبوعة بنقاط. وتحت الشاشة فتيل يحترق عقدةً عقدة على الإيقاع. الكلام كله على بطاقات وأشرطة بحدود سميكة، بخطّك وتشكيله سليم.

**يناسب:** الوجبات السريعة والمشروبات، والألعاب والتطبيقات الترفيهية، والعروض الخاطفة والمسابقات، والعلامات الشبابية المرحة التي تحب الطاقة العالية.

**حركته المميِّزة:** الصفعة والتسارع. الجملة تُقذف كاملة دفعة واحدة على بطاقة مائلة قليلًا (أكبر من حجمها ثم تستقر في خُمس ثانية)، والكلمة المهمة على انفجار شائك بلونك، وفي النهاية تنكمش البطاقة إلى زاوية الشاشة كأمر انتهى. الرقم يقفز مع كل ضربة على زرّ ألعاب كبير، والبنود تسقط من فوق وتُعلَّم بعلامة صح، والقديم تحطّمه مطرقة فينشقّ نصفين. ومع كل مرحلة تدور الشمس أسرع ويحترق الفتيل أسرع. وبين الألعاب تنفتح نجمة من وسط الشاشة.

**ألوانك فيه:**
- لون التمييز (`accent`) هو المسرح كله: الأشعّة، والقلوب، والانفجارات، والزر، والمطرقة.
- لونك الداكن هو الحدود السميكة والظلال الحادّة والأرضية، ولونك الفاتح هو البطاقات.
- كل مادّة داخل الشاشة مزج من ألوانك: كريستال سائل مائل إلى لونك، وورق بلونك الفاتح وخط هامش بلون التمييز، وطباعة بنقاط داكنة خفيفة.

**يتجنّب:** الكتابة مباشرة على الأشعّة، والتدرّجات والتوهّج، والوميض، وميل الكلام أكثر من ثلاث درجات، والأرقام والكلمات المزخرفة التي ليست في النص.

## For Claude

- Ground (`ground.js`): sunburst on `clock` (speed grows with `stage(clock)`, one stage per 3.2 s, up to 8), the board (hearts and pips), the floor. Parts paint their medium inside `ground.screen(ctx, paint)` and call `ground.fuse(ctx, t, d, at)`; knots are one beat apart at the stage's speed.
- Every shape is `toon()`: hard dark shadow (14 px), flat fill, 8 px dark outline. Text only on cards, tags or the screen's own medium, never on the rays. Text colour on a fill: `P.d` on light, `P.l` on dark, `P.onA` on accent.
- The line slams in whole (`slam`, ~0.22 s) so the hook is complete in its first frame; key words go on `burst()` laid out first with `keyBoxes()`. Tilt is `tokens.tilt` degrees (3), whole blocks only.
- Media per part: line = speed-line card, count = seven-segment LCD (`segText`, reported with `kit.rec`; other characters fall back to `kit.number`) with the mash button, list = ruled paper with highlighter and ticks, compare = halftone print with the mallet. Keep them distinct; don't tint a medium with something that isn't the brand's colours.
- Lead-ins, titles and labels wrap to two rows instead of shrinking under 44 px. The joint is the star iris (0.3 s).
