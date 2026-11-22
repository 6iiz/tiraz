# المونتاج الثوري · Agit Cut

**طابعه:** فيلم مطبوع على ورقة واحدة. ورق فاتح عليه ألياف خفيفة، وحبر داكن، ولون مطبوع واحد هو لون علامتك. على حافة الإطار شريط فيلم بثقوبه يجري طوال الريل. في كل مشهد نافذة فيلم أو أكثر تعرض «لقطات» مرسومة بدرجات الحبر: حشود صغيرة، وتروس تدور، ومداخن، وسكك، وجسور مبرشمة، ومكبس يدقّ على الإيقاع. والنافذة تقطع إلى لقطة جديدة على كل نبضة، فالمونتاج هو المحرّر. الكلام لا يطفو أبدًا: كل سطر عارضة حبر مصمتة تُقذف من جانب وتقف فجأة بهزّة قصيرة، والعوارض تتكدّس كطوابق بناء.

**يناسب:** المصانع والورش والمقاولات، والبنية التحتية، والتوصيل والخدمات اللوجستية، وكل علامة قصتها «ناس كثيرون وآلة واحدة وإيقاع عمل»، والذكريات والإنجازات الجماعية والأرقام الكبيرة.

**حركته المميزة:** القطع على الإيقاع. النوافذ تقطع على النبضة، والعدّاد يصعد مع كل خلية تضيء في شبكة من ثماني لقطات، وفي المقارنة تتسارع القطعات (نبضة، نصف، ربع، ثُمن) حتى يُصدَم الجديد على كتلة حمراء. وفي الخاتمة يُبنى برج من طوابق: شرائط فيلم وعوارض كلام بالتناوب، واسمك على العارضة الحمراء، وشعارك تاج يُختم في الأعلى.

**ألوانك فيه:**
- الأفتح من لونيك هو الورق، والأغمق هو الحبر، أيًّا كان ترتيبهما في هويتك.
- اللقطات كلها أربع درجات بين الحبر والورق، فلا لون فيها إلا ما يُطبع فوقها.
- لون التمييز (`accent`) هو الأحمر المطبوع: مقطع العارضة تحت الكلمة المهمة، وكتلة الرقم، وأرقام القائمة، وخط التعليم على القديم، ومسامير الإطار. ما يُكتب عليه يُختار تلقائيًا بين الحبر والورق بحسب الأوضح.

**يتجنّب:** الكلام العائم بلا عارضة، والتلاشي، والارتداد، والتدرّجات، وإمالة الكلام، وتبديل لون الأرضية كلها بين اللقطات (الإطار لا يومض)، والمشهد الساكن أكثر من ثانية، والوجه الفرد بطلًا.

## For Claude

- Paper = the lighter of `colors.bg` / `colors.text`, ink = the darker (`palette()` in `look/motion.js`); the accent is the only printed colour. Text on any fill takes `P.on(fill)`; never accent-coloured text on paper.
- Type lives on beams: every row of a line, label, title or item is its own ink beam (`beamRow`), slammed in from alternate sides a sixteenth apart (`tokens.dur.step`), stepped in from the reading side. A key word is a red segment of its beam. Beam height is 1.6 × the font size so Arabic marks stay on the ink.
- Motion: `E` (a hard ease-out) for slams lasting `tokens.dur.slam`, `kick()` for the landing jolt of the element only (never the whole frame), `I` for throws out. No fades, no bounce, no rotation of text.
- Windows (`window()`) hold the procedural shots and cut on the beat (`cutAt`); inside a shot something always runs (a pan, a push, a turning gear). Shots are tones of ink and paper only. Never put text on a window: text goes on beams beside it.
- Keep the frame's brightness steady across cuts: windows are small parts of a paper frame, and the joint is three paper strips slammed in, not a colour flood.
- Sound: `click` for each beam that lands, `tick` (quiet) for window cuts and grid cells, `thump` / `impact` for the red block and the crown, `whoosh` on the joint.
