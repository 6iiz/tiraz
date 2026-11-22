# طباعة ريزو

**الطابع.** يبدو كل مشهد في هذا الأسلوب كأنه ورقة خرجت للتوّ من آلة طباعة ريزو: ورقة فاتحة فيها حُبيبات خفيفة، ولونا حبر فقط يُطبع كلٌّ منهما بأسطوانة مستقلة. حين يتراكب الحبران يغمق موضع التقائهما كما يحدث على الورق الحقيقي، وبين طبقتي الحبر انزياح صغير مقصود في التسجيل، فيظهر حول الحروف والأشكال حدٌّ رفيع بلون التمييز. الأشكال كبيرة وبسيطة: أقراص ممتلئة، وأقراص مطبوعة بنقاط الشبكة النصفية، ورقع حبر حوافها غير مستقيمة تمامًا. والنتيجة مرحة ودافئة، لكنها مطبوعة ومتقنة لا عشوائية.

**لمن يناسب.** المقاهي والمخابز، ومتاجر القرطاسية والكتب، والاستوديوهات الصغيرة، والفعاليات الثقافية، والعلامات المستقلة التي تريد أن تبدو قريبة ومصنوعة باليد دون أن تفقد ترتيبها. يناسب الرسائل الودودة والإعلانات القصيرة والقوائم وأخبار المنتجات الجديدة. ولا يناسب الرسائل الرسمية جدًا ولا القطاعات التي تحتاج إلى انطباع تقني بارد.

**الحركة المميِّزة.** كل شيء يدخل كأن الورقة تمرّ تحت الأسطوانة: يتكشّف من حافته العليا إلى الأسفل ويستقر بنزول خفيف. وبين المشاهد يمرّ شريط من حبر لون التمييز على الشاشة من أعلى إلى أسفل، فيظهر المشهد الجديد مطبوعًا فوقه. وفي الخاتمة تبدأ طبقتا الحبر بعيدتين عن بعضهما ثم تنزلقان حتى تتطابقا، ويُطبع الشعار داخل القرص.

**كيف يستعمل ألوانك.**
- اللون الأفتح بين لون الخلفية ولون النص هو **الورق**.
- اللون الأغمق هو **الحبر الأول**: النصوص والشبكة النصفية والتراكبات.
- **لون التمييز** هو الحبر الثاني: الأقراص الكبيرة، والرقعة التي تقف خلف الكلمة المفتاحية، والظلّ المنزاح للنص.
- الكلمة المفتاحية تُكتب على رقعة من لون التمييز، بلون الحبر الذي يُقرأ عليها بوضوح أكبر، ولا تُكتب أبدًا بلون التمييز مباشرة على الورق.

**ما يتجنّبه.** التدرّجات اللونية، والظلال الناعمة، والتوهّج، والشفافية المتدرّجة، وأي لون ثالث غير مشتق من ألوانك، والحركات المرتدّة أو الدوّارة. ولا يضع نصًا يجب قراءته فوق نقاط الشبكة النصفية.

---

## For Claude

- Paper is the lighter of `bg`/`text`, ink the darker, accent the second drum; take them from `ground.P` (`paper, ink, accent, on, soft`). Text on an accent fill is always `P.on`; secondary text is `P.soft` (already checked to 4.5:1 on paper). Never set readable text in the accent on paper, and never put readable text on a halftone screen.
- Anything in the accent is drawn through `overprint(ctx, ground.reg, draw)`: multiplied and shifted by the sheet's registration error. Ink shapes sit at the true position. Big ink areas use `ground.screen(ctx, 'ink')` (halftone), not flat ink. Call `ground.wear(ctx)` after shapes and before main text.
- A headline gets an accent ghost: draw it once with `decor: true`, colour `P.accent`, offset by `reg`, multiplied (skip key words in that pass), then again in ink. Key words sit on a `blob(...)` patch.
- Motion: words use `arrive`/`leave` from `motion.js`; areas and shapes use `feed(ctx, in, out, x, y, w, h)`. Top-down reveals only; no fades, bounces, scaling or rotation.
- Shapes are discs, half-discs, rough patches, arrows and halftone rules. Keep them clear of text, or behind text only when that text is `P.on` on an accent fill.
- Textures come from `ground.js` (built once). No `Math.random`; seeds come from `rng` with fixed numbers.
