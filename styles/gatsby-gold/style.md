# ذهب غاتسبي · Gatsby Gold

**طابعه:** فخامة الآرت ديكو في ليلة احتفال. أرضية لكّ داكن دافئ، وخطوط معدنية محفورة بلونك تلمع حين يمرّ عليها شريط ضوء، وإطار بزوايا مدرّجة ومراوح نصف دائرية في الأعلى والأسفل، وأشعة شمس خافتة تخرج من محور الإطار. كل شيء متناظر حول خط عمودي في المنتصف، والكلام يقف على لوحات لكّ بحواف مزدوجة وأجنحة صغيرة، والأضواء مصابيح صغيرة تشتعل واحدًا بعد الآخر.

**يناسب:** الحفلات والأعراس والافتتاحات الفاخرة، والمطاعم الراقية، والعطور والمجوهرات والساعات، والفنادق، والفعاليات التي لها موعد وعدّ تنازلي، وكل علامة تريد أن تبدو أنيقة واحتفالية معًا.

**حركته المميزة:** الانفتاح من المحور. تلمع نقطة في وسط الإطار، ثم يجري منها خيط معدني إلى الجهتين، ثم تنفتح اللوحة للأعلى والأسفل، وتصعد الكلمات من الوسط إلى الأطراف. والأرقام والقوائم والخاتمة تُضاء بمصابيح تشتعل بالترتيب مع وهج قصير، ثم يدور عليها ضوء متتابع بهدوء. وبين المشاهد ينفتح الإطار القديم كبابين على خط المنتصف.

**ألوانك فيه:**
- لونك الأغمق (أيًّا كان، `bg` أو `text`) هو اللكّ، الأرضية دائمًا داكنة.
- لونك الأفتح هو العاج: لون الكلام والمصابيح المضاءة.
- لون التمييز (`accent`) هو المعدن: الخطوط المحفورة والإطار والأرقام والكلمة المهمة، مرسومًا بتدرّج شرائط فيه ظلّ ولمعة. وإن كان أغمق من أن يُقرأ على اللكّ، يُفتَّح نحو العاج حتى يُقرأ.
- كل الظلال والأشعة مزيج من ألوانك الثلاثة.

**يتجنّب:** الكتابة على الأشعة دون لوحة، وأي شيء غير متناظر في التركيب، والارتداد والاهتزاز، والزخارف النباتية المتموّجة، وأي لون ذهبي ثابت ليس من ألوانك، والوميض على كامل الإطار.

## For Claude

- Ground = the darker brand colour (`palette().dark`), always; ivory = the lighter one; metal = `accent`, made readable on lacquer (`pal.gold`). Never a hard-coded gold.
- Every composition is centred on the vertical axis. Text is centred; plates, rules, bulbs and flanking hairlines come in mirrored pairs.
- Everything opens from the axis with `opening(p, out)`: a hairline first (`wf`), then the plate opens (`hf`). Words rise centre-out using `centreOut()` ranks, never all at once and never from the reading side.
- Metal is always the banded `metal()` gradient with a moving sheen (`sheenAt`), and lines are always `gline` (engraved under-stroke + metal + hairline highlight). Words in metal use `forText = true` so every band stays readable.
- Key word: cast in metal with a double rule under it and a `sparkle` that flares once then breathes. One sparkle per scene.
- Light = bulbs (`bulbs(pal)`) igniting in counted order with `ignite()`, then a slow chase. They are small; never flash the whole frame.
- The joint is the pair of doors parting on the axis; the ground's border unfolds from the axis in the first second of the reel.
