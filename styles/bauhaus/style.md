# أشكال باوهاوس

**الطابع.** هذا الأسلوب ملصق هندسي جريء: دوائر ومربعات ومثلثات كبيرة وأشرطة سميكة مائلة، مرسومة بثلاثة ألوان فقط على خلفية فاتحة مسطحة، هي لونك الداكن ولون التمييز ولون ثالث يمزج بينهما. لا خطوط شبكة ولا تفاصيل دقيقة، بل كتل كبيرة لها وزن، وأقطار قوية تمنح الصورة حركة حتى وهي ساكنة. النص فيه لا يطفو على الخلفية، بل يُصفّ صفًا متينًا داخل كتل: كل سطر على شريط داكن يخرج من حافة الشاشة، والكلمة المفتاحية على مربع بلون التمييز.

**لمن يناسب.** مكاتب العمارة والتصميم الداخلي، والمعارض والمتاحف، والمدارس والدورات، وشركات الأثاث والمنتجات المصممة، والعلامات التي تريد أن تبدو واثقة ومنظمة وذات شخصية فنية. يناسب الرسائل التي تقوم على فكرة واحدة واضحة، والأرقام، والمقارنات. ولا يناسب الرسائل العاطفية الناعمة ولا الأجواء الطبيعية أو الحرفية.

**الحركة المميِّزة.** الأشكال لها كتلة: تنزلق أو تتدحرج في خط مستقيم، وتتجاوز موضعها قليلًا ثم تستقر بثقل؛ المربع يدور ربع دورته الأخيرة وهو يهبط، والمثلث ثلث دورته. الكلمات تنزلق إلى أماكنها من جهة القراءة كأنها حروف طباعة تُدفع إلى إطارها. وبين المشاهد تنفتح دائرة من الزاوية العليا وتكبر حتى تحمل المشهد الجديد، وعلى حافتها حلقة سميكة بلون التمييز. وفي الخاتمة تجتمع الدائرة والمربع والمثلث في شعار واحد، ويُوضع شعارك داخل المربع.

**كيف يستعمل ألوانك.**
- اللون الأفتح بين لون الخلفية ولون النص هو **الأرضية**.
- اللون الأغمق هو **الحبر**: الأشرطة التي يقف عليها النص، والمربعات، والأقطار، والنص على الأرضية.
- **لون التمييز** للدوائر الكبيرة، ولمربع الكلمة المفتاحية، وللشريط الذي يحمل القيمة الجديدة في المقارنة.
- **اللون الأوسط** (مزيج الداكن ولون التمييز) للمثلثات والمربعات الثانوية، ولا يُكتب عليه نص.
- النص على الأشرطة الداكنة يُكتب بلون الأرضية، والنص على لون التمييز بلون الحبر الذي يُقرأ عليه بوضوح أكبر.

**ما يتجنّبه.** خطوط الشبكة الرفيعة والزخارف الصغيرة، والحواف المستديرة، والتدرّجات والظلال، والتلاشي، والارتداد المرِح، وكتابة النص فوق الأشكال الملوّنة مباشرة.

---

## For Claude

- Palette from `ground.P`: `paper, ink, accent, mid, on, soft`. Readable text sits either in `P.ink` on paper, in `P.paper` on an ink slab, or in `P.on` on an accent fill. Never on `P.mid`, never over a shape that is not its own slab.
- Text is set in blocks: for headlines, labels and names, draw `ground.slab(ctx, p, x0, x1, ymid, size * T.bar.h, fill)` per row, bleeding off the reading-side edge (`x1 = W` in RTL), then the words. Key words get an accent block no wider than the word plus a share of the word space (`fitted.space`), so neighbours are not covered.
- Shapes come only from `motion.js`: `circle`, `square`, `triangle`, `bar`. Each lands with `heavy()` from its own direction; squares and triangles finish their turn as they land. Keep a strong diagonal in each composition. No hairlines (that is the Swiss style), no rounded rectangles.
- Words use `arrive`/`leave` with `ground.dir`: slide in from the reading side inside their own clip, slide out the other way. Shapes leave by playing their arrival backwards (`gone(p)` pattern in the parts).
- Geometry may run anywhere, including outside the safe area; text stays inside `SAFE`. The standing composition below the safe area belongs to `ground.js`; do not cover it with new shapes.
