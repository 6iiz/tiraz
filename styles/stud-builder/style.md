# مكعبات البناء · Stud Builder

**الطابع:** فيلم تحريك بالتوقّف مصوَّر عن قرب على طاولة حقيقية. الكلام كله مبني من مكعبات بلاستيك لامعة لها نتوءات مستديرة فوقها، ووجه أمامي يلمع عليه مستطيل ضوء نظيف كأنه من صندوق إضاءة، وظلّ تلامس تحتها. خلف حافة الطاولة غرفة مغبَّشة بدوائر ضوء ناعمة، وفي الأسفل لوح قاعدة منقّط عليه قطع متناثرة. الأسطر تُبنى جدارًا صغيرًا: كل صفّ يركب على نتوءات الصفّ الذي تحته، والعبارات التمهيدية مطبوعة على بلاطات ملساء بلا نتوءات.

**لمن يناسب:** متاجر الألعاب والهدايا، ومراكز الأطفال والتعليم والبرمجة للصغار، والمقاهي والمطاعم العائلية، وشركات البناء والتصميم الداخلي التي تحب المزاح، وكل علامة تريد أن تقول «نبنيها قطعة قطعة» بخفة دم.

**الحركة المميِّزة:** اليد التي تضع القطعة. كل قطعة تتحرّك بوضعيات ثابتة، اثنتا عشرة وضعية في الثانية، فتقفز ولا تنزلق: ترتفع مائلة، ثم تنزل، ثم تكاد تلمس، ثم تستقر بطقّة. الكاميرا وحدها تنساب بنعومة. في الأرقام يُبنى برج قطعة فوق قطعة والرقم يقفز مع كل طقّة حتى يقف على قيمته مع القطعة الأخيرة بلونك. وفي المقارنة تُدفع القطعة القديمة فتتدحرج وتستلقي مائلة تحت، وتوضع الجديدة مكانها. وبين المشاهد يُبنى جدار يغطي الصورة ثم يُفكّ من فوق فيظهر المشهد التالي.

**كيف يوزّع ألوان الزبون:**
- لون الخلفية (`bg`) هو خشب الطاولة، بعروق خفيفة جدًا.
- لون النص (`text`) هو لون القطع العادية، والكتابة عليها بلون الخلفية، فتكون القطع واضحة على الطاولة دائمًا.
- لون التمييز (`accent`) لقطعة العبارة المهمة، ولآخر قطعة في البرج، ولقطعة الشعار في الخاتمة، ويدخل ممزوجًا بالداكن في لوح القاعدة.
- الرمادي (مزيج النص والخلفية) للقطعة القديمة في المقارنة ولقطع الأرقام في القائمة، والبلاطات الملساء مزيج خفيف من الخلفية والنص.

**يتجنّب:** أي اسم تجاري أو شعار لألعاب حقيقية أو كتابة على النتوءات، والدُمى والشخصيات، والانسياب الناعم للقطع (الكاميرا فقط تنساب)، وانحناء القطع أو تشوّهها، والكتابة على اللوح المنقّط أو على الغرفة المغبّشة.

## For Claude

- Palette from `motion.palette(brand)`: `brick` = `colors.text` (its words in `onBrick`), `accent` for the key phrase, the last tower brick and the logo brick, `mid` for the old value and list indices, `tile` for smooth printed tiles (leads, labels, titles, handle, slogan), `plate` for the baseplate. No other hues.
- Every piece is painted once in `create` with `piece(P, w, h, color, { studs })` and drawn with `put`. Never paint studs per frame.
- Hand-moved things move only on the pose grid: `Q(t)` (12 poses a second), `setDown` / `takeAway` / `poseAt`, applied with `apply` around the piece's centre; words ride their brick through `drawText`'s `each`. Only the camera (`ground.cam(t)`, which parts translate by) and the room move smoothly.
- Rows stack stud to stud: brick height = the fitted text's `lead`; draw lower rows first so each brick covers the studs beneath it.
- A key phrase is one accent brick: cut rows with `bricks(f, layout(...), edge)` after `widen` opens the word spaces. Never one brick per key word.
- Wrap with `balanced`; leads and labels keep `minPx: 44` and take two rows rather than shrink.
- With `at: -0.8` the set-downs are spaced one pose apart so the hook is seated before frame 0.
- Sounds: `click` when a brick seats, `tick` for tower bricks and tiles, `thump` and `rustle` for the knock-over and the wall joint.
