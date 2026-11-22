# الهولوغرام · Light Console

**طابعه:** واجهة ضوئية فوق مسرح شبه أسود. في أسفل الإطار منصّة إسقاط مرسومة بالمنظور، حلقاتها تدور ببطء ويصعد منها مخروط ضوء خافت، وفوقها مجسّم سلكي من الضوء يدور: بلّورة، أو عمود من حلقات، أو كتل تنفصل عن بعضها كرسم تفكيك هندسي. الخلفية شبكة نقاط تنساب ببطء، وعلى الجانبين مساطر تنساب أسرع، فيظهر العمق في ثلاث طبقات. الكلام لا يطفو على الضوء أبدًا: كل نص على لوح زجاجي داكن بحافة رفيعة وزوايا مضيئة.

**يناسب:** التطبيقات والمنتجات التقنية، والأجهزة والإلكترونيات، والسيارات، والخدمات التي تشرح مواصفات أو أجزاء أو أرقامًا محسوبة، وكل علامة تريد أن تبدو من المستقبل.

**حركته المميزة:** الإقفال على الهدف. اللوح ينفتح من خطّه الأوسط، والكلمات تظهر واحدة واحدة تحت شريط مسح مضيء، ثم تطير أقواس استهداف من بعيد وتنقفل على الكلمة المهمة، وعندها فقط تأخذ الكلمة لون علامتك. والأرقام تدور بين أرقام عشوائية ثم تثبت خانةً خانة من اليسار. والمجسّمات تنبني من المنصّة إلى الأعلى تحت سطح مسح. والانتقال بين المشاهد خط مسح ينزل على الإطار فيُسقط المشهد التالي فوقه.

**ألوانك فيه:**
- لونك الأغمق، مدفوعًا نحو الأسود، هو المسرح، ومنه زجاج الألواح.
- لون التمييز هو لون الضوء نفسه: المجسّمات والمنصّة والمساطر وحواف الألواح والأقواس. وإذا كان خافتًا على المسرح رفعناه نحو لونك الفاتح.
- لونك الفاتح هو لون الكلام على الألواح.
- لون التمييز لا يُصرف على الكلام إلا على ما انقفل عليه الهدف: الكلمة المهمة، والرقم بعد أن يثبت، والقيمة الجديدة، والاسم في الخاتمة.

**يتجنّب:** النص فوق الخطوط السلكية بلا لوح، والأجسام المصمتة الملوّنة، ولونًا ثانيًا للضوء، والوميض الكامل للإطار، وأقواس استهداف على أكثر من شيء واحد في المشهد.

## For Claude

- Colours only from `palette(brand, tokens)` in `motion.js`: `stage`, `plate`, `hue` (lines), `lock` (hue as readable text), `white` (words), `soft`, `hot` (scan fronts, the instant of a lock), `dim`, `faint`.
- Every text sits on `plate(ctx, x, y, w, h, pal, open, close)` and is clipped to the plate's open height. Words arrive through `resolve()` inside `kit.drawText`'s `each`, which only clips and recolours, so Arabic words stay whole and shaped.
- The accent is spent on locked things only: draw `brackets(ctx, box, p, pal, out)` onto the one thing that matters, and switch its colour to `pal.lock` at the moment the lock lands. One lock per scene.
- Numbers settle through `rolling(str, p, seed)` with a seed from the time, then are drawn with `kit.number`.
- Subjects are wireframes from `meshes` drawn with `wire()` (depth fog, glow, scan plane). Keep them below the text, above the pad (`tokens.subject`, `tokens.pad`); they must carry the scene's idea (rings that grow with a count, slabs that pull apart per list item, an old cube that breaks up in a compare).
- Leave by collapsing plates (`close`) and switching wireframes off; the joint is the scan line, never a fade through a bright colour.
