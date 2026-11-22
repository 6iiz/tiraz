# حروف معدن · Metal Cast

**طابعه:** كل كلمة قطعة معدن مصبوبة ثقيلة. طاولة استوديو داكنة نراها من طرفها وننظر إليها من فوق، وعليها بقعة ضوء هادئة. الكلمات تسقط على الطاولة قطعةً بعد قطعة، فتستقر بقفزة صغيرة واهتزاز قصير كرنين المعدن، ولكل قطعة ظلها الحقيقي. ثم يمرّ ضوء ناعم على وجوهها المصقولة. الإحساس فخم وهادئ وثقيل، بلا وميض ولا ألوان زائدة.

**يناسب:** العلامات التي تريد أن تبدو متينة وراقية: المجوهرات والساعات، والسيارات، والعقارات والمقاولات، والأثاث والتصميم الداخلي، والاستشارات والخدمات المالية، والمنتجات الفاخرة عمومًا. ويناسب الرسائل القصيرة الواثقة والأرقام التي تستحق وزنها.

**حركته المميزة:** السقوط الثقيل. القطعة تُفلَت فوق الطاولة بقليل، تسقط بسرعة، وتضرب السطح، وتقفز قفزة صغيرة، ثم ترنّ وتهدأ. الأرقام لوحات معدنية مختومة تعدّ حتى قيمتها ثم تُطرَق طرقة أخيرة. وفي المقارنة يسقط قضيب لامع على القيمة القديمة فتنقلب على وجهها وتخبو، وتنزل الجديدة من أعلى بلون علامتك. وفي الخاتمة يُختم شعارك على الطاولة قطعةً سميكة من المعدن.

**ألوانك فيه:**
- الأغمق من لونيك هو الطاولة، وعليها بقعة ضوء مخلوطة قليلًا بلونك الفاتح.
- الأفتح من لونيك هو معدن الكلمات العادية، وخطوة منه نحو الداكن للمقدّمات والعناوين الصغيرة.
- لون التمييز معدن مصقول للكلمة المفتاحية وللأرقام وللقيمة الجديدة ولشعارك.
- اللوحات المختومة مزيج من لونيك الداكن والفاتح، والقيمة الملغاة معدن باهت يميل إلى الداكن.

**يتجنّب:** التوهّج، والجسيمات، والألوان الإضافية، والحركة المطاطية، والكاميرا المهتزة، والكتابة المسطّحة فوق الصورة، وأي حركة سريعة بلا وزن.

## For Claude

- 3D on one shared WebGL renderer (`look/studio.js`); every part builds its own scene on `ground.js` (table, key spot with one 2048 shadow map, a sweep point light, camera). Geometry and materials are built in `create()`; `draw(t)` only moves pieces and renders.
- Words are not built with `text3d()`: each word is filled on a canvas with the brand font, traced (marching squares + simplification) and extruded whole, so Arabic joins have no seams and closed loops keep their holes. The logo is traced the same way from `brand.logo.path` (arcs and fill rule included). Report every piece with `kit.rec(screenBox(...))` after rendering (`motion.rec`).
- Colour: table = darker brand colour, plain metal = lighter brand colour, key word / numbers / new value / logo = accent. Nothing else carries a hue; lights are white, tone mapping is Neutral (keeps the accent's hue).
- One arrival gesture: `motion.drop` (gravity fall along the line of sight, one hop, a ring that dies out). Leaving is done by the joint (the table moves on) or, in the compare, by tipping over. Don't add fades, slides or spins.
- The hook (`at: -0.8`) is fully landed by 0.8 s: keep line staggers within `motion.gap`.
- Text stays at least `tokens.margin` inside SAFE, because the camera leans in about 2 % and drifts a few pixels.
- Sound: soft kinds that belong to metal on a table: `thump` for landings, `ding` for the ring of a key word, a strike or a stamp, `tick` for list rows and counter steps, `shimmer` under a light pass, `impact` only for the logo stamp.
