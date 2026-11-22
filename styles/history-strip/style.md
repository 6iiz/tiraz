# كوميك التاريخ · History Strip

**الطابع:** صفحة قصص مصوّرة على ورق قديم، مقسومة إلى لوحات بأطر حبر سميكة، وكل لوحة تطلّ على خريطة مطبوعة قديمة: بحار بمسحة خفيفة من لون علامتك، ويابسة بحافة باهتة كأن الحبر خفّ عند طرف اللوح، وخطوط محفورة متكرّرة حول كل ساحل، وحدود منقّطة، وشبكة خطوط طول وعرض، ووردة رياح ومقياس رسم. على الخريطة دمية من الكرتون المقصوص، رأسها كبير ومدوّر ومفاصلها مثبّتة بدبابيس، تحكي بفقاعات الكلام. وكل تغيير هو فعل ورقي: قصاصة تُصفع على الخريطة، أو تُثبّت بدبوس، أو تُقطع وتُرمى.

**لمن يناسب:** العلامات التي عندها قصة وتاريخ وتوسّع: المحامص والمخابز العريقة، والسلاسل التي تفتح فروعًا جديدة، والسياحة والسفر، والتعليم ومحتوى التاريخ والجغرافيا، والتوصيل وكل خدمة تتحرّك على الخريطة، بنبرة مرحة وواثقة.

**الحركة المميِّزة:** الصفعة. القصاصة تنزل أكبر قليلًا ومائلة، ثم تنطبق على الورق في لقطتين وظلّها يقترب فجأة. والدمية تتحرّك كالرسوم المقصوصة: وضعيات ثابتة تتبدّل بضع مرات في الثانية، فمها يفتح ويغلق، وذراعها تشير وتلوّح وتصفع. وحين يُستبدل شيء، تدور قصاصته القديمة حول دبوسها وتنقطع وتطير خارج اللوحة، وتبقى زاوية ممزّقة تحت الدبوس. وبين المشاهد تنتقل الكاميرا على الصفحة إلى اللوحة التالية.

**كيف يوزّع ألوان الزبون:**
- لونك الأفتح هو ورق الصفحة والفقاعات والبطاقات، والأغمق هو الحبر: أطر اللوحات والسواحل والكلام.
- لون التمييز هو "الإقليم": قصاصة الكلمة المهمة والرقم والقيمة الجديدة، وثوب الدمية، ومسحة البحر. والكلام فوقه بأي من لونيك أوضح.
- اليابسة والشبكة والتعليقات والدبابيس مزيج من لونيك.

**يتجنّب:** إعادة التلوين بدل الفعل الورقي، والحركة الانسيابية للدمى، والتلاشي، والخرائط الحديثة النظيفة والرسوم البيانية، وأسماء الأماكن أو الدول الحقيقية، وتصوير أشخاص حقيقيين بالدمى.

## For Claude

- Every piece of text sits on paper: a caption box (`P.caption`, ink edge) for leads, titles and labels, a speech balloon (`balloon()`) for a line, a tag or a torn scrap (`torn()` + `paper()`) for list items and values. Never set text straight on the map.
- Arrivals are `slapped()` (`slap()`: lands 1.35x and tilted, squashes flat, shadow snaps in); no fades. Removals are tears (swing round the pin, rip, throw), never a fade or a recolour.
- The key word, the count and the new value are scraps of `P.accent` with text in `P.onAccent`. The puppet's body is the accent; it is drawn with `puppet()` and its pose must come from `held(t)` (6 poses a second), never from a smooth curve.
- The stage is `ground.stage` (the big middle panel = the safe area). The strip above and the two panels below are decoration; the mark is a small tag pinned in the lower panel.
- The joint pans across the page with a slight pull-back that shows the table; parts do not animate out.
