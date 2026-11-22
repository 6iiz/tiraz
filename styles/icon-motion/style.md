# الأيقونات المتحركة · Icon Motion

**طابعه:** هوية بثّ رياضي مسطّحة. ورق فاتح بين شريطين من نقشة مربّعات: أقراص وأنصاف أقراص وأرباع وحلقات ونقاط، كلها بدرجات لون علامتك. صفوف النقشة تنزلق جانبيًا خانة كاملة على الإيقاع، وفي الزاوية قرص صغير تمثّل عليه رموز مرسومة بقضبان مدوّرة الأطراف: شخص بلا وجه يرفع يده، وساعة إيقاف، وقائمة، وميزان. والكلام عريض ثقيل ينزلق صفًّا صفًّا من جهة القراءة.

**يناسب:** النوادي والصالات الرياضية، والفعاليات والبطولات، والتطبيقات والخدمات التي تشرح خطوات، والمطارات والنقل، وكل علامة تريد نظامًا بصريًا واضحًا يُقرأ من بعيد.

**حركته المميّزة:** إزاحة الصف. كل شيء يتحرّك صفوفًا: صف النقشة يُزاح خانة، وسطر الكلام ينزلق من قناعه، وبين المشاهد تعبر كل حارة من الإطار شريحةٌ من النقشة فتترك المشهد الجديد خلفها. وفي الخاتمة يترك القرص زاويته إلى الوسط، وتمتلئ أرباعه بلونك واحدًا بعد الآخر، ثم يُختم فيه شعارك.

**ألوانك فيه:**
- لونك الأفتح هو الورق، والأغمق هو الحبر للكلام والرموز.
- لون التمييز هو النقشة كلها: خمس درجات منه بين الورق والحبر.
- الكلمة المهمة (أو العبارة كلها إن كانت أكثر من كلمة) على كبسولة واحدة بلون التمييز، والكلام فوقها بأوضح لون عليه.

**يتجنّب:** التدرّجات والظلال والتوهّج، والزوايا الحادة في الرموز، والوجوه، والحركة المرتدّة، والكلام فوق النقشة.

## For Claude

- Colours: paper = the lighter of `bg`/`text`, ink = the darker (`palette()` in `motion.js` decides by luminance, so the style works for light-ground brands too). The pattern is five tones of `accent` mixed with paper and ink. Text on the accent capsule uses whichever of paper/ink contrasts more with the accent.
- Text never sits on the pattern: the bands stay above y 240 and below y 1320, and parts keep their text above `tokens.textBottom` (the stage disc sits at the far bottom corner).
- One key phrase = one capsule. `boxes()` mirrors `kit.drawText` and opens a gap around the phrase, so fit any keyed text with `maxW` minus `keyRoom(size)`.
- The only gesture is the row shift (`slideText`): rows enter from the reading side with `snap` and leave with `accel`; no fades. Bands shift one cell every five beats (beat = 0.5 s) in reel time (`clock`).
- Pictograms are round-capped bars and discs only, ink with one accent part, faceless. Add new ones to `motion.js` in the same grammar.
- An opening line (`at` < 0) is compressed so every row has landed by frame 0. Long lead-ins wrap to two rows (min 90% of size), never shrink below that.
