# خريطة المترو · Line Network

**طابعه:** خريطة خطوط مطبوعة على ورقة موضوعة فوق طاولة داكنة. خطوط عريضة مسطّحة لا تسير إلا أفقيًا أو عموديًا أو بميل خمس وأربعين درجة، وكل منعطف بنصف القطر نفسه. محطات بيضاء بحلقة من الحبر، ومحطات تبادل على شكل كبسولات، وشريط ماء هادئ يقطع الورقة، ولوحة مفتاح الخريطة وسهم الشمال في أسفلها. الكلام مطبوع بالحبر على الورق مباشرة، كأسماء المحطات.

**يناسب:** النقل والتوصيل والخدمات اللوجستية، والعقار والمدن، والسياحة، والتعليم، وكل علامة تشرح طريقًا أو مراحل أو شبكة فروع: «من هنا تبدأ، وهنا تصل».

**حركته المميِّزة:** الخط يُرسم. لا يوجد من الخط إلا ما قطعه رأس القلم، وكل كلمة محطة: تظهر علامتها حين يمرّ الرأس، ويُطبع اسمها خارجًا منها. والكلمة المهمة محطة تبادل، تسقط كبسولتها في مكانها بثقل، ويتفرّع منها خط ثانٍ. وفي المقارنة تُغلق المحطة القديمة بعلامة ×، ويصير الخط بعدها باهتًا متقطّعًا خارج الخدمة، ويُرسم فرع جديد بميل إلى المحطة الجديدة.

**ألوانك فيه:**
- لونك الفاتح هو الورقة، ولونك الداكن هو الحبر والطاولة حولها.
- لون التمييز هو الخط الأول، ولوحة اسم الكلمة المهمة (تُكتب عليها بأوضح لونيك).
- الخطان الآخران مزيجان: الحبر مشوبًا بلون التمييز، ولون التمييز مخفّفًا نحو الورق.
- الماء والشبكة الباهتة في الخلفية ولوحة المفتاح درجات خفيفة من الحبر على الورق.

**يتجنّب:** الخطوط المتعرّجة أو المنحنية بحرية، والمنظور والمجسّمات، والكتابة فوق الخطوط، والعناوين في الوسط على صفحات فارغة، وأكثر من ثلاثة ألوان خطوط، والتوهّج.

## For Claude

- Inks come from `inks(brand, tokens)` in `look/motion.js`: the lighter brand colour is the paper, the darker the ink; `I.lines` holds the three line colours (accent first). Text is ink (`I.ink`, `I.dim`) on paper; on the accent plate it is `I.onAccent`.
- Every route is octilinear and filleted with `T.line.r`, built with `M.route`, drawn to a length with `M.line(…, tip)`. Growth is the pen tip: nothing appears ahead of it. Time words to the moment the tip passes their stop (`lengthAt`).
- Words are printed out of their stop with `M.print` (an uncover that slides away from the stop). Stops: `M.tick`, `M.station`; interchanges and the payoff land with `M.capsule` / `M.land` (critically damped, starts 18% big, no bounce).
- Key word: an interchange plus a name plate in the accent (`M.plate`), never accent-coloured text on paper.
- Keep words off the lines: routes run under or beside text blocks, never through them. The faint network lives in the top band and below the safe area.
- The ground (sheet, tooth, water, faint network, legend) is printed once; per frame only the raking light moves.
