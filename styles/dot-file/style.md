# ملف النقاط · Dot File

**طابعه:** ملف قضية مطبوع على ورق قديم بلونك الفاتح: ورق مبقّع قليلًا، وطيّة في أسفله، ولسان مجلد ومشبك ورق في أعلاه، ومسطرة أطوال على الهامش. الظلال كلها نقاط طباعة لا تدرّجات، بشاشتين على زاويتين مختلفتين تتراكبان عند حواف الإطار. العناوين ثقيلة وتحتها نسخة بلون علامتك منزاحة قليلًا كأن الطبعة لم تُضبط، والأختام تُضرب على الورق ضربًا. صاخب لكنه مقروء: فكرة واحدة في كل صفحة.

**يناسب:** الحملات ذات الروح المرحة الجريئة، والمطاعم والمقاهي ذات الشخصية، وكشف «الحقيقة» وراء منتج، والإعلان عن عرض أو حكم أو نتيجة، والمحتوى الذي يحب نبرة التحقيق الساخر.

**حركته المميِّزة:** الختم. كل شيء يهبط على الصفحة من فوق في بضع لقطات ويستقرّ دون ارتداد، والكلمة المهمة لا تُطبع بل تُختم على قطعة مطاط بلون علامتك مائلة قليلًا، وأطرافها متآكلة كختم حقيقي. وفي المقارنة يُشطب القديم بقضيب حبر ثقيل، ويُختم الجديد تحته وحوله هالة من النقاط. والانتقال بين الصفحات نقاط تكبر حتى تصير حبرًا مصمتًا.

**ألوانك فيه:**
- لونك الأفتح هو الورق، ولونك الأغمق هو الحبر وبطاقات الملف.
- لون التمييز هو «الأسطوانة الثانية»: الظل المنزاح تحت العناوين، والأختام، وشاشة النقاط على الحواف، وجسم الرقم الكبير.
- ما يُكتب على الختم يُختار تلقائيًا بين لونيك بحسب أيهما أوضح.
- نقاط التظليل مزيج من ألوانك، وتُطبع بطريقة التراكب فتغمق حيث تلتقي.

**يتجنّب:** التدرّجات والتوهّج، والكتابة فوق النقاط الكثيفة، والميل الكبير للكلام (الختم وحده يميل درجة أو درجتين)، والارتداد، والزحام: صفحة واحدة، فكرة واحدة.

## For Claude

- Palette from `palette()` in `look/motion.js`: paper = the lighter brand colour, ink = the darker, chosen by brightness; `on(fill)` gives the text colour for any fill. Body text is ink on paper or paper on an ink `chip()`.
- Motion is `slam()` only: scale from 1 + `from` down to 1 with a very fast exponential, opacity as a few-frame helper, no bounce. Exits flip the page up (`q`). Words of a line slam one by one (`slamWord`, `tokens.dur.step` apart); never letter by letter.
- The key word is stamped (`stampBlock`, accent fill, worn edge from `wearTile`, turned at most about 2 degrees), last, after the other words. One stamp per line.
- Heavy headlines (the name, the count figure) carry the accent out of register (`misprint`, `ground.reg`); body text does not.
- Halftone is built once (`dotField`, `dotTile`): edge crowding in the ground, the count figure's shading, the burst behind the new value, the stamp's halo. Keep dense dots out from under text; text sits on paper, ink chips or accent blocks.
- Sound: `thump` for each slam, `impact` for the one big stamp, `scratch` for the bar over the old value, `tick` on counter steps, `rustle` for page joints.
