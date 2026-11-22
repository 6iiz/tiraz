# شاشة الموجات · Wave Trace

**طابعه:** وجه شاشة قياس قديمة. زجاج شبه أسود، وشبكة مربّعات منقّطة بمحورين في الوسط عليهما علامات دقيقة، ولا شيء يُرسم إلا بشعاع واحد من الضوء. الشعاع نقطة متوهّجة تمشي على المسار، وما مرّت عليه يبقى مضيئًا ثم يبرد ببطء كما يبرد الفوسفور. لا تعبئة مسطّحة ولا خطوط مسح: خطوط رفيعة من ضوء حولها هالة ناعمة. والكلام يضيء تحت الشعاع، والأرقام قراءات لنفس القيم التي ترسم المنحنيات.

**يناسب:** الهندسة والطاقة والاتصالات، والصحة والأجهزة الطبية، والصوت والموسيقى، والتعليم والعلوم، وكل علامة تقول إن عملها دقيق ويُقاس.

**حركته المميزة:** الإشارة تقول الفكرة. في الجملة يمرّ الشعاع تحت الكلام بإشارة هادئة، وتحت الكلمة المهمة ترتفع الإشارة في قمّة واحدة نظيفة. في الرقم يكبر ارتفاع الموجة مع العدّ، فالرقم والمنحنى قيمة واحدة. في المقارنة تتحوّل إشارة القديم المشوّشة إلى خط ميت، ويرسم الشعاع للجديد موجة نظيفة قوية. وفي الخاتمة يرسم الشعاع شكلًا متشابكًا يتقارب ترداداه حتى يُغلق في حلقة يضيء داخلها شعارك.

**ألوانك فيه:**
- لونك الأغمق، مدفوعًا نحو الأسود، هو زجاج الشاشة.
- لون التمييز هو لون الشعاع: المسارات، والكلمة المهمة، والرقم، والقيمة الجديدة، والشعار. وإذا كان خافتًا على الزجاج رفعناه نحو لونك الفاتح.
- الكلام العادي فوسفور شاحب: الشعاع ممزوجًا بلونك الفاتح، واضح دائمًا.
- قلب الشعاع الساخن يميل إلى لونك الفاتح، والشبكة درجات خافتة من الشعاع.

**يتجنّب:** خطوط المسح، والتعبئة المسطّحة، والأشكال الزخرفية التي لا تقيس شيئًا، ولونًا ثانيًا، والحركة السريعة التي تملأ الإطار بالضوء.

## For Claude

- Colours only from `palette(brand, tokens)` in `motion.js`: `tube`, `beam`, `text` (pale phosphor, ≥ 7:1), `soft`, `core` (hot centre), `grid`, `axis`.
- Every curve is `trace(ctx, pts, pal, { head, age, width })` over points from `curve()` (or your own maths); `head` is how far the beam has gone, `age(k)` its afterglow, computed with `cool(dt, tau, rest)` from the time the beam passed that point. Never accumulate frames.
- Words are `lightText(kit, fitted, placement, pal, T, colour)`: glows built once, sharp words through `kit.drawText`, lit whole when the beam passes under them. Key words (`*…*`) take the beam colour; give the signal its peak under them.
- Curves must carry the content: a peak under the key word, an amplitude equal to the counted value, a dead line for the old thing, one channel per list item. No decorative waves.
- The graticule (`ground.g`) frames everything; keep the reading text inside it and inside `SAFE`. The joint cools the old picture and runs one flat trace; it never brightens the frame.
