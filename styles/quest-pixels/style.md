# بكسل المغامرة · Quest Pixels

**طابعه:** لعبة مغامرات قديمة بالبكسل تُرى من فوق. عالم صغير مرسوم بنقاط كبيرة مربّعة: درب يتلوّى بين عشب منقّط، وبركة يلمع ماؤها، وأشجار مدوّرة بحدّ داكن، وبطل صغير بعباءة من لونك يمشي على الدرب طوال الريل. الكلام كله يظهر في نوافذ اللعبة: لوحة داكنة بإطار مزدوج وزوايا مقصوصة، تنفتح على أربع خطوات، ثم تظهر كلماتها كلمة كلمة كأن اللعبة تكتب رسالتها. الحروف العربية تبقى بخطّك وتشكيلها سليم، أما البكسل ففي العالم والإطارات والأرقام.

**يناسب:** المقاهي والمتاجر المرحة، وألعاب الأطفال والتعليم، والتطبيقات، ومنصّات الألعاب، وكل علامة تريد أن تقول «رحلتك معنا مغامرة» بخفّة دم ودفء.

**حركته المميِّزة:** كل شيء يتحرّك بخطوات صلبة لا بمنحنيات ناعمة. الكاميرا تنزلق نقطة نقطة والبطل يخطو بأربعة رسوم، والنافذة تنفتح على درجات، والمؤشّر يقفز إلى البند الجديد، والرقم يُعدّ كعدّاد الذهب بينما يتطاير المال من صندوق كنز. وبين المشاهد تتكسّر الصورة إلى مربّعات أكبر فأكبر ثم تعود حادّة.

**ألوانك فيه:**
- لونك الفاتح هو أرض العالم، ممزوجًا قليلًا بلون التمييز ليصير عشبًا، والدرب أفتح منه.
- لونك الداكن هو الحدود والظلال ولوح النوافذ، والكلام عليه بلونك الفاتح.
- لون التمييز (`accent`) عباءة البطل والأشجار والكنز، وكتلة خلف الكلمة المهمة تُكتب عليها بأوضح لونيك فوقه.
- كل درجة أخرى مزج ثابت من ألوانك الثلاثة، كلوحة ألوان لعبة محدودة.

**يتجنّب:** التدرّجات الناعمة والتوهّج والضبابية، والحركة المنحنية والارتداد، والحروف العربية المكسّرة بالبكسل، والكتابة مباشرة على العالم دون نافذة.

## For Claude

- The world is a 180 x 320 indexed buffer scaled x6 with smoothing off (`ground.js`); build maps once per scene, and only blit and add sprites per frame. Everything in the frame snaps to `PX` = 6 (`snap`).
- Motion is stepped: `stepped(p, n)` for windows (4 steps open, 3 to close), whole-word "typing" one word per `tokens.dur.tick` (capped so a line is complete in 0.42 s), cursor jumps, 8 fps sprite frames, 4 fps palette cycling. No eased glides, no fades.
- All reading text sits inside a `win()` panel: `P.l` on `P.win`; lead-ins and titles in `P.lead`; the key word on a notched `block()` of `P.a` with `P.onA` text. Lead-ins wrap to two rows instead of shrinking under 44 px.
- Numbers use the pixel digits in `motion.js` (`pixText`, Western and Arabic-Indic); report them with `kit.rec`. Anything the bitmap can't draw falls back to `kit.number`.
- Arabic never goes through the pixel font. Never letter-split a word.
- The joint is the mosaic (four sizes out, four in); the ending turns the logo into pixel art with `logoGrid`.
