# الملصق البنائي · Poster

**طابعه:** طاقة ملصقات الحركة البنائية الكلاسيكية: أقطار قوية، وأشرطة عريضة مائلة من لونك ولون الورق، وإسفين ضوئي يشعّ من زاوية الإطار، ولوحات مقصوصة كأنها ملصقة باليد، وحبيبات طباعة خفيفة على الخلفية. كل عنصر يُقذف إلى مكانه على خط مائل ويقف فجأة، بلا ارتداد. العنوان القصير يُطبع على شريط مائل ميلًا خفيفًا، والشريط وكلماته يميلان معًا كتلة واحدة، أما بقية الكلام فأفقي دائمًا وعلى أرضية مصمتة، لأن القراءة بالعربية تأتي أولًا.

**يناسب:** الإعلانات الجريئة، والافتتاحات، والعروض، والحملات، والفعاليات، والمطاعم والمقاهي ذات الشخصية القوية، والعلامات التي تريد أن تنادي جمهورها بصوت عالٍ: «يا أهل الحي!».

**حركته المميزة:** الشريط المقذوف. العنوان يدخل مائلًا على شريط بلونك يقطع الإطار من طرف إلى طرف، والكلمة المهمة مقصوصة منه: مكتوبة بلون الخلفية على قطعة من لون الورق. وفي المقارنة يُشطب القديم بخط من لونك، ثم يُقذف الجديد فوقه على لوحة مائلة بالاتجاه المعاكس.

**ألوانك فيه:**
- لون الخلفية (`bg`) هو الأرضية، وعليها أشعة خافتة تدور ببطء وحبيبات طباعة.
- لون النص (`text`) يُستعمل «ورقًا»: أشرطة ولوحات مصمتة يُكتب عليها بلون الخلفية، ويُكتب به مباشرة على الأرضية.
- لون التمييز (`accent`) للأشرطة الكبيرة واللوحات والإسفين والشطب. ما يُكتب عليه يُختار تلقائيًا بين لونيك الآخرين بحسب أيّهما أوضح.
- ظلال الإسفين مزج من الخلفية ولون التمييز.

**يتجنّب:** إمالة الكلام الطويل أو قلبه، وتدوير الحروف منفردة، والكتابة فوق الأشعة أو فوق حواف الأشكال، والتدرّجات والتوهّج، والزوايا الحادة الكبيرة (الميل لا يتجاوز بضع درجات للنص)، وأي كلمة تخرج من المنطقة الآمنة.

## For Claude

- Only short headline blocks rotate, by `tokens.tilt` (about 6 degrees) or a fraction of it, and only as a whole fitted block via `block(ctx, cx, cy, deg, p, out, draw, reach)` from `look/motion.js`. Keep rotated text 800 px wide or less so its turned box stays inside SAFE. Never rotate or space single letters.
- Body text (labels, list items, handle) is level and sits on a solid fill: a paper strip (`pal.paper` with `pal.onPaper`), an accent panel (`pal.onAccent`), or the plain ground. Text colour on any fill comes from `palette().on(fill)`; never place text over rays, wedges or a fill edge.
- Motion: arrivals slam in along a diagonal with `E` (outExpo); exits are thrown out with `I` (inQuad). Bands grow along their length (`band`). No fades as the main move, no bounce.
- Shapes: bands, wedges (`wedge`), rectangles and slanted strips only; give a headline band a thin knockout edge in `bg` when it overlaps another shape. Accent fills stay a minority of the frame (the joint band is 240 px).
- Key word: cut out of the band, `onPaper` text on a paper block padded by under half a word space.
- The poster states values, it does not chart them; was/now as words or numbers both print as text on the two panels.
- Ground: rays turn 1.2 degrees per second on `clock`; grain is built once from `rng(1917)`.
