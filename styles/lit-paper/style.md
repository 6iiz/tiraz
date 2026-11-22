# ورق مضوي · Lit Paper

**الطابع:** صندوق ورق مقصوص مضاء من الخلف، والكاميرا داخله. في العمق ورقة يتوهّج فيها الضوء ويُقصّ منها قمر ونجوم كثقوب الدبوس، وأمامها ثلاث ورقات تعلو من الأسفل وكل واحدة أغمق من التي خلفها: تلال بعيدة، ثم بلدة صغيرة نوافذها ثقوب يشعّ منها الضوء، ثم تلال قريبة بأشجار مدوّرة. لكل ورقة شعرة ضوء على حافتها العليا وظلّ ناعم تلقيه على ما خلفها، وفي المقدّمة إطار شبه أسود بفتحة مسنّنة كالغيم. الكلام لا يُطبع: يُقصّ في بطاقة ورق داكنة، والضوء يظهر من خلال الحروف. والعبارة المهمة يظهر ضوؤها من ورق شفاف بلون علامتك، وتحتها شقّ مضيء واحد.

**لمن يناسب:** المقاهي والمطاعم الليلية، والفنادق وبيوت الضيافة، والعطور والشموع والهدايا، والمكتبات ودور النشر، وحملات رمضان والأعياد والمساء، وكل علامة تريد دفئًا هادئًا وإحساس شيء مصنوع باليد يُحتفظ به.

**الحركة المميِّزة:** الورق لا يطير ولا يتلاشى، بل ينزلق في مجراه: البطاقة تصعد من أسفل الصندوق إلى مكانها وظلّها يضيق ويحدّ كلما اقتربت من الورقة التي خلفها، ثم يصل الضوء إلى الحروف المقصوصة كلمة بعد كلمة. الصندوق كله يتنفّس: الورقات تنزلق بعضها على بعض بضعة بكسلات (القريبة أكثر)، والضوء خلفها يعلو ويهدأ ببطء. في المقارنة تنزلق ورقة خلف الكلمة القديمة فينطفئ ضوؤها. وبين المشاهد تُدخل ورقة جديدة إلى الصندوق من الأسفل.

**كيف يوزّع ألوانك:**
- اللون الأفتح هو ضوء السراج، ممزوجًا بقليل من لون التمييز، وهو لون الحروف المقصوصة.
- سلّم الورقات من الخلف إلى الأمام: الفاتح يغمق تدريجيًا نحو لونك الداكن، وكلها بلمسة خفيفة من لون التمييز.
- بطاقة الكلام والإطار الأمامي من لونك الداكن.
- لون التمييز للورق الشفاف خلف العبارة المهمة والأرقام والشعار، ويُفتَّح نحو الضوء حتى يُقرأ على البطاقة الداكنة.

**يتجنّب:** الطباعة على الورق (كل كلام مقصوص)، والوميض، والأشكال ثلاثية الأبعاد المدوّرة، والأسود المطلق، والحركة السريعة للصندوق، ولون التمييز بلا ضوء خلفه.

## For Claude

- Palette in `ground.P` (`motion.palette`): `glow` (lit cuts), `key` (accent tissue, lifted to 4.6:1 on the card), `card`, `dim` (a cut before the lamp reaches it), `sky0..2`, `l1..l3` (the sheet ladder), `front`. Text is only ever `glow`, a softer glow (`mix(glow, card, 0.22)`) or `key`, always on a `card`.
- Every part: `ground.draw`, then its card through `groove` (slide up in, slide down out) and `layCard`, translated by `ground.drift(t, 0.55)`, then the text lit with `light()` from `each`, then `ground.drawFront` last (the front sheet covers everything but the opening).
- Text width is `tokens.textW` (860) so the drift never pushes text out of `SAFE`. Lines land within 0.68 s of `at`.
- Key phrases: run the fitted text through `isolate()` (one row per phrase, room on both sides), one `slot()` per run from `keyRuns()`, skip `w.ph` spacers. One slot per phrase.
- Lead-ins wrap to two rows rather than shrinking. No flicker: the lamp only breathes (period of several seconds).
- Sounds: `swish` for a card sliding in, `tick`/`sparkle` when a cut lights, `rustle` for sheets, `ding` on a number.
