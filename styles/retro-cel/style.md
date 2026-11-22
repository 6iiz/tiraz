# أنمي الثمانينات · Retro Cel

**الطابع.** رسوم متحركة مرسومة باليد على طريقة أفلام الكرتون اليابانية في أواخر الثمانينات، تُعرض من شريط فيديو قديم. في الخلفية لوحة ليلية مرسومة بالبخّاخ: سماء تتدرّج من لونك الداكن إلى لون التمييز، وشمس منخفضة خلف مدينة نوافذها مضاءة، وشارع مبلول يعكس الأضواء. فوقها «سِلّ»: أشكال وكتابة بلون مسطّح، بحدّ ملوّن داكن وشريط ظل حادّ في أسفل كل كلمة، لا تدرّج داخلها. والكلمة المهمة مضاءة من خلفها بلون علامتك، ويلمع عليها بريق نجمة. وفوق الكل أثر الشريط: خطوط مسح خفيفة، وحوافّ معتمة، وتشويش ناعم، وطيف لوني صغير بجانب الكتابة.

**لمن يناسب.** العلامات التي تخاطب جيلًا يحنّ إلى الثمانينات والتسعينات، ومتاجر الألعاب والهوايات والقصص المصوّرة، والمقاهي والمطاعم الليلية، والموسيقى والحفلات، والتقنية التي تريد طابعًا دافئًا لا باردًا. ويناسب الرسائل العاطفية والحماسية معًا. ولا يناسب العلامات الطبية أو القانونية الرسمية.

**الحركة المميِّزة.** الحركة «محبوسة» على الرسمات: كل ما يتحرك يُرسم اثنتي عشرة مرة في الثانية لا ستين، فيبدو مرسومًا باليد. الكلمات تنزلق من جهة القراءة على رسمات قليلة وخلفها خطوط سرعة، ثم تقف ثابتة. الخلفية تنزلق ببطء شديد طوال الريل كما تُسحب لوحة الخلفية تحت الرسوم. في المقارنة «يعلق» الشريط على القديم فيتمزّق شرائح، ويبقى صورة باهتة متوقفة. وبين المشاهد يتدحرج شريط تتبّع من أسفل الشاشة إلى أعلاها كما في أشرطة الفيديو. وفي الخاتمة يشرق قرص مضيء فيه شعارك.

**كيف يستعمل ألوانك.**
- اللون الأغمق بين لونيك هو **الليل**: السماء، والمدينة، وحدود الكتابة.
- اللون الأفتح هو **ضوء السِّلّ**: لون الكتابة كلها.
- **لون التمييز** هو الضوء الذي يشعّ: توهّج الكلمة المهمة، والشمس، ونوافذ المدينة، وحوافّ الألواح. إن كان لون التمييز داكنًا لا يُقرأ على الليل، صارت الكلمة المهمة على لوح مضيء بلون التمييز بدل أن تُكتب به.

**ما يتجنّبه.** التدرّجات داخل الكتابة والأشكال، والحركة الناعمة بستين رسمة في الثانية، والوميض الذي يغمر الشاشة، والكتابة دون حدّ داكن، والأسماء والعلامات الحقيقية في المدينة.

---

## For Claude

- Palette from `ground.P` (`motion.palette`): `night` (darker brand colour), `light` (lighter), `accent`, `key`/`keyShade` (key-word fill and its shade band), `halo` (the backlight colour), `glows` (whether the accent reads on the night; when not, key words get an accent plate), `line` (cel outline), `shade` (shade band), `plate` (dark translucent cel plate).
- All readable text goes through `M.cel(kit, ctx, fitted, { x0, x1, y, align, P, rtl, at, onKey })`: fringe, outline, fill, hard shade band. `at(w, i, box)` returns the word's progress on held time; rows arrive together (`box.row`). Never draw text without the cel outline: the painted sky behind it changes.
- Time on the drawings: wrap every animation time in `M.held(t)` (12 fps). The plate pan uses 24 fps and `clock`. Do not animate at 60 fps.
- Leads, labels, titles and the handle sit on `M.bar` plates; wrap with `M.balanced` at ≥ 45 px rather than shrinking.
- Every part ends with `ground.over(ctx, t)` (the tape: noise, scanlines, rim). The painted plate is built once per palette (`M.plate`, cached); never per frame.
- The hook must be whole at frame 0: a line's lead and rows land within 0.6 s of `at`. Glints (`M.glint`) recur every ~1.5 s while a key word holds; that is the hold's life. No whole-frame flashes.
