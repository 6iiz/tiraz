# زجاج وضو · Glass and light

**الطابع:** استوديو معتم بلونك الداكن، وفيه الكلام نفسه منحوت من زجاج سميك: وجه كل حرف مصنفر حليبي، وحوافه مصقولة تلمع لأن الضوء يأتيها من الخلف ومن الجانبين. على الجدار خلف الكلام وهج خافت وأضلاع ضوء ناعمة ينحني شكلها حين تُرى عبر الزجاج، والأرضية لامعة تذوب في العتمة. الكلمة المهمة زجاج ملوّن بلون علامتك، والضوء الذي يعبرها يسقط أمامها على الأرض بقعةً ملوّنة تحمل ظلّ شكلها. هادئ، نظيف، فاخر.

**يناسب:** العطور والمجوهرات والساعات، والفنادق والمطاعم الراقية، ومراكز التجميل والعيادات، والعقار الفاخر، والعلامات التي تريد أن تبدو صافية وثمينة ومدروسة.

**الحركة المميِّزة:** الكلمة لوح زجاج يدور ليواجه الضوء: تبدأ من حافتها وتستدير نحو الكاميرا كلمةً بعد كلمة من جهة القراءة، فتمرّ عليها لمعة وهي تستقر. وبين المشهدين يعبر شريط ضوء بطيء مائل من جهة القراءة، يمرّ على جدار الاستوديو وعبر الحروف، ويترك وراءه المشهد التالي. وفي الخاتمة يقف شعارك كتلة زجاج، ثم يُضاء من داخله بلون علامتك فيتوهّج عبر الزجاج المصنفر ويرمي ضوءه على الأرض.

**كيف يوزّع ألوانك:**
- اللون الأغمق بين لون الخلفية ولون النص هو الاستوديو (الجدار والأرض)، فيبقى الأسلوب داكنًا مع أي هوية.
- اللون الأفتح هو الزجاج الشفاف والضوء: وهج الجدار، وشريط الضوء، والنصوص الصغيرة المسطّحة.
- لون التمييز للزجاج الملوّن (الكلمة المهمة، الرقم، القيمة الجديدة)، وللبقعة الملوّنة على الأرض، وللضوء داخل الشعار. إن كان لونك غامقًا جدًا يُفتَّح قليلًا نحو لونك الفاتح حتى يتوهّج.
- القيمة القديمة في المقارنة زجاج مدخّن، مزيج من لونيك.

**يتجنّب:** الألوان الصاخبة والكثرة، والارتداد، والوميض، ودوران الكلام وهو يُقرأ، والزجاج الشفاف تمامًا فوق خلفية مزدحمة (لا يُقرأ).

## For Claude

- Real 3D (`/engine/three3d.js`): every scene builds its studio with `ground.js` `create()` and renders through ONE shared WebGL renderer (`motion.js` `gl()`), so a reel holds one GL context. Build geometry/materials in `create()`; `draw(t)` only moves things.
- Text as glass: `motion.js` `glassText()` (HarfBuzz shaping, one merged mesh per word, faces frosted / sides polished, no bevel: a bevel cuts grooves at Arabic joins). It uses winding to find holes, because the nesting rule in `three3d.js` turned some glyph contours into holes. The logo uses `logoGlass()`, which also reads SVG arcs (`logo3d` drops them, so round logos vanished).
- Main statements, list items, numbers, compared values and the brand name are glass; leads, labels, titles, handle and slogan are flat 2D "etched light" over the render (≥ 44 px). Centre-aligned.
- Readability: the studio is always the darker brand colour; glass faces carry a small emissive glow and the sides a stronger one, so letters never vanish. Keep the wall glow and the band low (`tokens.light`).
- Signature moves only: `turnIn` (edge-on to facing, soft land), `turnOut` (turns on past, accelerating), the sweep band (`sweep()` in 3D, `joint.js` in 2D, same path and timing). Key words, numbers and new values cast an accent pool via `ground.patch()`.
- Call `kit.rec(...screenBox(root, camera, W, H), text)` every frame for each visible glass row.
