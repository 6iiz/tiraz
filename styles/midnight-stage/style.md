# مسرح منتصف الليل · Midnight Stage

**طابعه:** خشبة مسرح فارغة في منتصف الليل، نراها من مقاعد الجمهور. جدار خلفي مظلم، وأرضية من ألواح خشبية تمتد إلى العمق، وستائر مخملية على الجانبين وستارة علوية مزمومة بأقواس، كلها مصبوغة بلونك ومعتمة. مصباحان في الأعلى يرميان شعاعين خافتين على الخشبة، فيهما ذرات غبار تدور ببطء. لا مقدّم ولا شاشات: الكلام يقف في ضوء المتابعة، واللافتات تنزل من سقف المسرح على حبلين، والعربات تدخل من الكواليس.

**يناسب:** الفعاليات والحفلات والعروض، والمطاعم والمقاهي الليلية، ودور السينما والمسرح والترفيه، والإعلانات الكبرى التي تُقدَّم كأنها افتتاح ليلة عرض: «الليلة، لأول مرة».

**حركته المميزة:** الإنزال من السقف. اللافتة تنزل على حبليها، تقف، وتتأرجح قليلًا ثم تستقر، ومصابيحها تضيء واحدًا بعد الآخر حول الإطار ثم تتسابق. والسطر يظهر حين تنفتح عليه دائرة ضوء المتابعة وتنغلق عليه في النهاية. وبين المشاهد تنغلق ستارة المسرح من الجانبين وتنفتح على المشهد التالي.

**ألوانك فيه:**
- لونك الداكن هو المسرح كله: الجدار والأرضية، بدرجات قريبة منه.
- لونك الفاتح هو الضوء: ضوء المتابعة والأشعة والكتابة.
- لون التمييز (`accent`) يصبغ المخمل واللافتات، ويُعتَّم تلقائيًا حتى يبقى المسرح مظلمًا والكتابة الفاتحة واضحة عليه.
- العبارة المهمة على لافتة مضيئة تحيط بها المصابيح، لافتة واحدة للعبارة كلها.

**يتجنّب:** البطاقات وواجهات التطبيقات والشبكات، والوميض وإضاءة الإطار كله بالأبيض، والإضاءة الملوّنة الصارخة، والشخصيات والمقدّمين، والكتابة فوق حواف الستائر.

## For Claude

- Colours only from `palette(brand)` in `motion.js` (ground exposes `ground.pal`): the stage is built on the darker brand colour, light = the lighter one, `velvet` and `plate` are accent mixes held dark. Text lighting is `M.lit(pal, q, to)`, a colour mix from the wall, never alpha.
- Grammar: light reveals (`spot` + `inIris`), pieces fly (`flown` returns the drop and a decaying sway, pivot at `PELMET`; `lines` draws the two lines), wagons roll from the wings (clip to inside `LEGS`). Flown text is drawn with `decor: true` while it is still in the air.
- Key phrases: `layout` + `keyRuns`, one `marquee(..., sides = false)` per run inside a line (bulbs top and bottom only so nothing touches the neighbouring words); full marquees only on free-hanging boards.
- The hook: the iris is fully open within `tokens.dur.iris` (0.5 s) of `at`, so a line at `at: -0.8` is lit on frame 0.
- The line is fitted with `lead: 1.85` so a marquee plate on one row never touches the row above or below; long leads wrap to two rows at ≥ 90 % of the lead size.
- Ground, velvet, pools and bulb sprites are built once; per frame only dust motes, beam breathing and bulbs are drawn. The joint closes and reopens the house curtain (dark velvet, no flash).
