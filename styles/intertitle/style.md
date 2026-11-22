# السينما الصامتة · Intertitle

**طابعه:** فيلم صامت يُعرض في صالة قديمة. ستارة مخملية داكنة على الجانبين وفي الأعلى، وشاشة مستديرة الزوايا عليها نسخة فيلم قاتمة فيها حبيبات تتبدّل مع كل لقطة، وارتعاش ضوء خفيف جدًا، وغبار وخدوش عمودية متقطعة، واهتزاز بسيط في البوابة. الكلام لا يُقال، بل يُكتب على لوحات كتابة: بطاقة داكنة بإطار مزدوج وزوايا مقعّرة ومعيّنات صغيرة، والجملة في وسطها بخط فاتح.

**يناسب:** المقاهي والمطاعم العريقة، ومحلات العطور والتحف والساعات، والعلامات التي تحكي قصة أو تاريخًا، وكل رسالة قصيرة تُقال بجملة واحدة فيها دعابة أو حنين.

**حركته المميزة:** القزحية والتدوير باليد. المشاهد تنغلق بدائرة تضيق إلى الظلام ثم تنفتح على المشهد التالي، وكل شيء يتحرك بخطوات مرئية كأن العارض يدير الآلة بيده: البطاقة تنفتح من وسطها كالمصراع، والكلمات تظهر كاملة على دفعات من الضوء، والرقم يصعد درجة درجة، وتحت الكلمة المهمة تُرسم زخرفة منحنية.

**ألوانك فيه:**
- الأرضية دائمًا داكنة: لونك الأغمق (من `bg` و`text`) هو نسخة الفيلم، والستارة مزيج منه ومن لون التمييز بظل عميق.
- لونك الأفتح هو «الفضّي» الذي تُكتب به البطاقات، وفيه لمسة خفيفة جدًا من لون التمييز كصبغة الفيلم.
- لون التمييز (`accent`) يكتب الكلمة المهمة إن كان واضحًا على البطاقة، وإلا بقيت الكلمة فضية. وهو دائمًا لون الزخرفة تحت الكلمة، والمعيّنات، وخط الشطب.
- الرماديات كلها مزج من لونيك.

**يتجنّب:** الحركة الناعمة المنزلقة، والارتداد، والوميض القوي (الارتعاش أقل من اثنين بالمئة)، وأي لون ثانٍ، والكتابة خارج البطاقة، وأكثر من جملة رئيسية في البطاقة الواحدة.

## For Claude

- Every move is cranked: read time with `crank(t)` (12 drawings a second) or `crank(t, 24)` for the iris. No smooth tweens of position; text arrives by `expose` (whole words, a few steps of light and a small drop).
- All text sits on an intertitle card drawn by `card()`; centre it (lists are set from the reading side behind a lozenge). Card text width is `card.x1 - card.x0 - 2 * padX`, inside SAFE.
- Parts draw `ground.draw`, then their content inside `ground.weave(t)`, then `ground.over` (grain, flicker, dust, scratches) on top. Keep `tone.flicker` at or under 0.02: the check counts flashes.
- Key word: `pal.key` (the accent only when it reads on the card) plus `flourish()` under it in `pal.flourish`. One per card.
- Joint: the iris only (`joint.js`, 0.5 s). The ending opens with the iris on the logo's medallion. Do not add fades or slides.
- Ground and grain are cached per brand in `ground.js`; build anything heavy there, never per frame.
