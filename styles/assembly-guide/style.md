# دليل التركيب · Assembly Guide

**طابعه:** صفحة من كتيّب تعليمات مطبوع: ورق فاتح، ورسم خطي بحبر واحد وسماكة واحدة، وتعبئة مسطّحة بثلاث درجات (الوجه العلوي أفتحها)، وزاوية متساوية القياس واحدة لا تتغيّر. كل مشهد خطوة مرقّمة برقم كبير في أعلى الصفحة. وفي أسفل الصفحة قطعة تُبنى عبر الريل كله: لوح، وتنزل عليه في كل خطوة قطعة جديدة. والكلام نفسه يستعمل إشارات الكتيّب: صندوق القطع وبجانبه العدد، والتسلسل بأرقام في دوائر، و«افعل / لا تفعل» بعلامة ✕ وعلامة ✓.

**يناسب:** الأثاث والتجهيز المنزلي، والإلكترونيات والأدوات، والبرمجيات وخدمات «كيف تبدأ»، والتعليم والتدريب، والمتاجر التي تشرح استعمال منتجها، وكل رسالة تقول «الأمر سهل، خطوة بخطوة».

**حركته المميِّزة:** القطعة الجديدة. كل ما هو جديد في الخطوة ينزل بلون التمييز على خطوط إرشاد منقّطة وسهم، ثم يستقر بعلامة «طق» صغيرة، وبعد أن يُركَّب يصير أبيض كباقي القطع. لذلك يتعلّم المشاهد بسرعة أن لون التمييز يعني «هذا هو الجديد». والعبارة المهمة في الكلام توضع على لوح صغير بلون التمييز ينزل ويطقّ في مكانه مثل قطعة، وتبقى ملوّنة. وفي الخاتمة تنزل علبة المنتج النهائي، ويُطبع شعارك على جانبها بالزاوية نفسها.

**كيف يوزّع ألوان الزبون:**
- الأفتح من لونَي الزبون هو الورق، والأغمق هو الحبر وخطوط الرسم، أيًّا كان لون الخلفية عنده.
- القطع المركّبة بثلاث درجات من الورق (مزيج قليل من الحبر للوجهين الجانبيين).
- لون التمييز للجديد فقط: القطعة التي تنزل الآن، ولوح العبارة المهمة، وشارة ✓. والكتابة فوقه بالحبر أو بالورق، أيهما أوضح.
- الجمل التمهيدية رمادية مقروءة من مزيج الحبر بالورق.

**يتجنّب:** المنظور والظلال الملقاة والتدرّجات، وتلوين أكثر من شيء جديد في الخطوة، والوجوه والشخصيات المرسومة بملامح، والكلمات التي ترتدّ أو تدور، وأي اسم أو شعار لعلامة غير علامتك.

## For Claude

- One view only: `view(ox, oy, u)` in `motion.js` (true isometric, 30° edges). Draw parts with `box()` / `cylinder()` (fill, then one outline per face, `tokens.lw`); fills from `fills(K, fit)`: accent shades while new, paper shades once fitted.
- New things arrive along a dotted guide (`dotted`), land with `click`, and turn white about 0.5 s later. Only the key phrase's `slab()` stays in the accent. One slab per key phrase: `keyGroups()` merges neighbouring starred words.
- Every part calls `nextStep(clock)` once in `create` (numbers the steps in reel order; resets at clock 0) and draws `rig(W, T, K).draw(ctx, n, t, t0)` at the foot of the page: the build gains one part per step.
- Words slide a short way along the isometric axis (`arrive`). The opening line (`at` < 0) compresses its staggers so the hook and its slab are landed before frame 0; the build's part drops after frame 0.
- Joint: the magnifier circle opening from the build. Don't add page turns, fades or header bars.
- Long lead-ins wrap at ≥ 44 px (`minPx: 44`).
- Sounds: `swish` for words and ruled boxes, `click` for a part or slab landing, `pop` (low) for the build's new part, `toggle` when it turns white or a box is crossed out, `tick` for list rows.
