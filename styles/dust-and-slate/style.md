# السبورة والطباشير · Dust and Slate

**الطابع.** سبورة داكنة ممسوحة للتو، سطحها مطفي فيه حبيبات ناعمة وتبقّع خفيف يتحرك ببطء شديد، يحيط بها إطار خشبي بسيط، وتحتها حافة عليها أصبع طباشير أبيض وأصبع بلون علامتك. لا شيء يُطبع ولا شيء يظهر بالتلاشي: كل كلمة تُكتب بالطباشير أمام المشاهد، كلمة بعد كلمة من جهة القراءة، وفي الحروف مسام وخطوط سحب كالطباشير الحقيقي. الكلام قليل والحرف كبير، كأن معلّمًا يكتب رأس الدرس في وسط السبورة.

**لمن يناسب.** المدارس ومراكز التدريب والدروس الخصوصية، وكل علامة تشرح فكرة واحدة أو تصحّح فهمًا شائعًا: الاستشارات، والصحة، والمال الشخصي، وصنّاع المحتوى التعليمي.

**الحركة المميِّزة.** التصحيح على السبورة. في المقارنة تُكتب القيمة القديمة، ثم تُشطب بخربشة سريعة، ثم تمرّ عليها الممسحة مرة واحدة فتزيلها وتترك أثرًا باهتًا، وتُكتب القيمة الجديدة في المكان نفسه بطبشورة لونك ويُرسم تحتها خط. وبين المشاهد تُمسح السبورة كلها بمرور عريض من جهة القراءة.

**كيف يوزّع ألوان الزبون.**
- اللون الأغمق من لونيك هو السبورة، واللون الأفتح هو الطباشير الأبيض.
- لون التمييز هو الطبشورة الملوّنة الوحيدة: للكلمة المهمة وللخطوط تحتها وللحلقة حول الشعار. وإن كان غامقًا لا يُقرأ على السبورة، يُفتَّح نحو لون الطباشير حتى يُقرأ.
- الطباشير الخافت (للتمهيد والعناوين الصغيرة) مزيج من السبورة والطباشير، مضبوط ليبقى مقروءًا.
- الإطار الخشبي والحافة مزيج من لونيك أيضًا.

**يتجنّب.** الظهور بالتلاشي أو الانزلاق، والخطوط المطبوعة النظيفة، وبقايا دروس قديمة على السبورة، والغبار الطائر والتوهّج، وأكثر من لون طباشير واحد للتمييز، والإطالة: السبورة تحمل كلمات مفتاحية، والشرح بالصوت.

## For Claude

- Ground: the darker brand colour (mixed `tone.slate` towards the lighter) is the slate; textures (mottle, grain, frame, ledge) are built once per palette in `ground.js` and cached at module level. The mottle drifts on `clock`.
- Every visible mark is written: words through `write()` on a per-word `schedule()` (Arabic uncovered from the right, digits and Latin from the left); lines through `trace()` on seeded point lists (`stroke`, `ring`, `tick`, `scribble`). No fades, slides or scale-ins.
- Text fills are chalk patterns (`chalk(ctx, colour, seed)`) passed as `color`/`key` to `kit.drawText` and `kit.number`; keep `P.chalk` for statements, `P.dim` for leads and labels, `P.accent` only for the key word and its marks.
- Key word: accent chalk plus one wavering underline drawn after the whole line is written (`te + 0.06`), so the sound cue stays fixed.
- Compare is write, strike, `rubOut()` with the felt, rewrite in place. The joint is a wet-felt wipe from the reading side; parts do not animate an exit.
- Timings are fixed windows (`tokens.write`), not speeds, so `sound.json` cues land on their events whatever the text length.
