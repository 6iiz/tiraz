# كولاج النقوش · Cutout Engraving

**الطابع:** كولاج ورقي مصنوع على طاولة: أوراق ملوّنة مسطّحة ممزّقة باليد، لكل منها حافة بيضاء من ألياف الورق، وفوقها قصاصات من نقوش قديمة، كرة أرضية وعمود وهلال، كل واحدة محفورة بخطوط يتغيّر سُمكها مع الظل ومقصوصة بهامش أبيض، ومثبّتة بدبوس تتأرجح عليه قليلًا. لكل قطعة سُمك وظل حقيقي تحتها. الكلام لا يُكتب على الطاولة: كل سطر على قصاصة ورق مقطوعة، والعناوين الصغيرة على شرائط داكنة كملصقات الأسماء، والأرقام على بطاقة كبيرة ممزّقة الأطراف.

**لمن يناسب:** المجلات والإعلام الثقافي، والمكتبات ودور النشر، والمتاحف والمعارض، والمقاهي والعلامات ذات الذوق الفني، والحملات التي تحب السخرية الذكية والطابع المصنوع باليد.

**الحركة المميِّزة:** الوضع والضغط. كل قطعة تُوضع على الطاولة مرفوعة قليلًا، أكبر بقليل ومائلة وظلّها طويل، ثم تُضغط فتنزل إلى مكانها بارتداد صغير ويلتصق ظلّها تحتها، والحركة كلها مصوّرة على اثنتين، اثنتا عشرة لقطة في الثانية، كأفلام القصاصات. الكلمة المهمة تُلصق فوق نفسها على قصاصة بلون علامتك. وحين يُلغى شيء يُقصّ بمقص على خط متعرّج فتسقط نصفاه دائرَين خارج الطاولة. والانتقال بين المشاهد ورقة كبيرة تُسحب عبر الطاولة.

**كيف يوزّع ألوان الزبون:**
- الأفتح من لونَي الزبون هو ورق القصاصات، والطاولة درجة أغمق منه بقليل.
- الأغمق هو حبر النقوش والكلام، والشرائط الداكنة التي تحمل العناوين والحساب.
- لون التمييز (`accent`) للقرص الممزّق الكبير، ولقصاصة الكلمة المهمة، وللجديد في المقارنة، ولقرص الشعار. ونسخة فاتحة منه للورقة الممزّقة في الوسط، ونسخة داكنة منه للورقة السفلى.

**يتجنّب:** التلاشي، والتكبير من الصفر، والحركة الانسيابية الآلية، والتدرّجات، والكلام مباشرة على الطاولة أو على الأوراق الملوّنة، والنقوش المرسومة بخط واحد ثابت السُّمك.

## For Claude

- Inks from `palette(brand)` in `look/motion.js` only; the shadow under paper is the brand's dark colour at low alpha (a real shadow), the only alpha in the style.
- Every readable word sits on a paper slip (`torn` + `slip`), a dark label slip, or the accent; never on the table or a coloured sheet. Keep slips within `tokens.textW` (780 px) of text so the lifted, turned pose stays inside SAFE.
- Motion goes through `twos(t)` (12 fps) and `press(p, turn, from)` + `piece(...)`: put down lifted, pressed with a small overshoot. Slips turn at most about 2.5 degrees at rest; never more on text.
- Engravings are built once per page in `ground.js` (`engrave`): hatching whose line width follows the shade, a cut paper margin, a pin. Add a new figure the same way; never fill an engraving with flat grey.
- A struck value is cut, not crossed out: the halves fall away and are drawn `decor: true` while falling.
- Sounds are paper sounds: `rustle` for each slip put down, `thump` when a piece is pressed home, `scratch` for the scissor cut, `swish` for the fall; the joint is a `rustle`.
