# الرجل العصا · Stick Talk

**طابعه:** صفحة شرح هادئة على ورق مسطّح بلونك الفاتح، كلامها مصفوف كصفحة مجلة: عنوان صغير رمادي، وجملة كبيرة بالحبر، ومساحات بيضاء واسعة. وتحت الكلام يقف ناس من خطوط بسيطة على «خطّ النظام» الممتد عرض الإطار: رأس دائري، وظهر منحنٍ، وأطراف كل منها منحنى واحد ناعم بسماكة واحدة، بلا وجوه ولا أيادٍ ولا أدوات. هؤلاء الناس هم الرسم البياني نفسه: يُعَدّون، ويتّصلون، ويتأثّرون.

**يناسب:** الشركات الاستشارية والتعليمية والخدمية، والمنصّات والتطبيقات التي تشرح فكرة أو نظامًا، والجمعيات والمبادرات المجتمعية، وكل رسالة عن الناس والعلاقات والخطوات.

**حركته المميِّزة:** الأيدي المتشابكة والنبضة. حين يمسك اثنان بأيدي بعضهما يصير الذراعان خطًا واحدًا متصلًا من كتف إلى كتف، فيصير الصف كلّه حبلًا واحدًا. ثم تجري نبضة بلون علامتك داخل الأذرع كالسائل في أنبوب، وكل شخص تصله يقفز قفزة صغيرة وتمتلئ العقدة تحت قدميه، ثم يرفعون أيديهم المتشابكة معًا. في العدّ يدخل الناس واحدًا واحدًا مع الرقم، وفي القائمة تنزل النبضة على خطّ جانبي فيشير كل شخص إلى بنده، وفي المقارنة ينحني القديم رماديًا ويُشطب، وتنزل النبضة إلى شخص منتصب يرفع ذراعيه للجديد. وفي الخاتمة يقف الناس حلقة حول شعارك. وبين المشاهد تنزلق الصفحة جانبًا فيمشي الخطّ معها.

**ألوانك فيه:**
- لونك الفاتح هو الورق، ولونك الداكن هو الحبر: الناس والكلام والخطوط.
- لون التمييز معناه واحد فقط: الشيء المهم في هذه الشاشة. رأس الشخص الذي يبدأ منه التغيير، والنبضة، والعقد التي مرّت بها، والخط تحت الكلمة المهمة. وإن كان قريبًا جدًا من الورق يُعمَّق نحو الحبر ليظهر.
- الرمادي خلطة من لونيك، للعناوين الصغيرة وللقديم في المقارنة.

**يتجنّب:** الوجوه والملامح والإكسسوارات، والأطراف المكسورة بزوايا، والتدرّجات والظلال، وتعدّد الألوان، والزحمة: فكرة واحدة في كل شاشة.

## For Claude

- Figures come only from `figure` in `look/motion.js`: one line weight (`weight(h)`), every limb one quadratic curve, head a paper disc with an ink ring or a solid accent head for the one that matters. No faces, hands or props.
- Joined hands are one curve between shoulders (`joined` / `reach`): never two arms meeting at a point. Hide the two inner arms with `skipArms`.
- The accent means one thing per screen. It travels with `run` (round front, along the joined arms, a spine or a connector) and each person reacts (`reactHop`) when it reaches them; nodes fill as it passes.
- Text is editorial: flush to the reading side, lead in `P.note`, statement in ink; words are set down (`setDown`); the key word (`*…*`) gets the accent `underline`, neighbouring key words share one.
- The crowd on the system line (`ground.crowd`, `tokens.stage`) sits below the safe area in every part except count, which puts its own counted people there. The joint is a sideways pan (`joint.js`), so the line runs through.
- Calm sound: ticks and clicks, one ding or success on the payoff.
