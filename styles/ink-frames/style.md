# لوحات المانغا · Ink Frames

**الطابع.** صفحة قصص مصوّرة يابانية مطبوعة بحبرين فقط: ورق وحبر. الصفحة مقسومة إلى مربّعات بحواف سميكة وفواصل مائلة قليلًا، وكل رمادي فيها نقاط حبر مصفوفة لا لون رمادي مسطّح. في المربّع الكبير خطوط تركيز تندفع من الأطراف نحو وسط نظيف تقف فيه الكلمات، والجملة التمهيدية في صندوق سرد أبيض بإطار أسود، والكلمة المهمة مكتوبة كصوت مؤثّر في القصص: بلون علامتك، داخل خط حبر سميك وحافة من الورق وظل صلب تحتها. لا لون في الصفحة كلها إلا هذا اللون الواحد.

**لمن يناسب.** العلامات الشبابية والجريئة، والألعاب والتطبيقات، والمطاعم السريعة والوجبات الخفيفة، والرياضة واللياقة، ومتاجر الهوايات والكتب، وكل رسالة فيها مفاجأة أو تحدٍّ أو «لحظة» واحدة تريد أن تضربها بقوة. ويناسب الأرقام الكبيرة والمقارنات الحاسمة. ولا يناسب العلامات الهادئة الفاخرة ولا الرسائل الحزينة.

**الحركة المميِّزة.** المربّع هو القطع: كل مشهد يبدأ بحواف مربّعات تُحبَّر على طولها، ثم تندفع خطوط التركيز من الخارج إلى الداخل، ثم تُختم الكلمات واحدة واحدة بتكبير قصير يستقرّ في عُشر ثانية، والكلمة المهمة آخرها وأقواها. القديم في المقارنة تشطبه ضربتا فرشاة متقاطعتان. وبين المشاهد يمرّ فاصل مائل بين مربّعين من جهة القراءة، والصفحة التالية مطبوعة خلفه. والكاميرا تنزلق ببطء على الورق ما دام المشهد ثابتًا.

**كيف يستعمل ألوانك.**
- اللون الأفتح بين لونيك هو **الورق**، والأغمق هو **الحبر**: الحواف، والنقاط، والخطوط، والنص.
- **لون التمييز** لون مطبعي واحد: للكلمة المهمة والرقم الكبير واسمك في الخاتمة فقط، وخط تحت شعارك.
- خط الكلمة المهمة يُختار تلقائيًا: الحبر أو الورق، أيهما أوضح حول لون التمييز.

**ما يتجنّبه.** الرمادي المسطّح والتدرّجات، وأي لون ثانٍ، والظلال الناعمة والتوهّج، والتلاشي، والكلام فوق النقاط أو الخطوط دون ورق خلفه.

---

## For Claude

- Palette from `ground.P` (`motion.palette`): `paper` (the lighter brand colour), `ink` (the darker), `accent`, `sfxLine`/`sfxRim` (outline and rim around the spot colour, chosen by contrast), `grey` (only for a struck-out value). Every grey on the page is a dot screen made with `M.tone(w, h, cell, cover, ink)`; never fill a flat grey.
- Layout is panels: `M.page(W, H, cuts)` returns slanted panels; draw each with `M.panel(ctx, pts, p, ink, draw)`, where `p` inks the border along its length and `draw` fills the inside (clipped). Content appears once the border is half inked. Build tones, focus lines (`M.focus`) and speed lines (`M.speed`) in `create`, never per frame.
- Text sits on clear paper only: in the clear centre of the focus lines (pass the text block's half-size to `M.focus`) or in a narration box (`M.box`). Leads, labels and titles go in boxes, wrapped with `M.balanced` at ≥ 46 px rather than shrunk.
- Words arrive by `M.stamp` (overscale settling in ~0.12 s), one every `tokens.dur.step`; the key word last with a bigger overscale and `M.sfx` lettering. Numbers use `M.sfxNumber`. Nothing fades in or slides.
- The hook must be whole at frame 0: all of a line's entrance runs within 0.7 s of `at`.
- One moving camera only: `M.camera` (slow drift and 2 % push over the scene). The joint is the slanted gutter sweep in `joint.js`; do not add flashes or a second transition.
