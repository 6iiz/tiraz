# كتاب الشمع · Wax Storybook

**الطابع:** صفحة من كتاب حكايات للأطفال، مرسومة بأقلام الشمع على ورق خشن. الإطار مرسوم باليد حول الصفحة، وفي الزاوية شمس ملوّنة وغيمة، وتحت المنطقة الآمنة تلّتان وبيت صغير وشجرة مدوّرة. الشمع لا يلتصق إلا برؤوس حبيبات الورق، فيظهر الورق من بين الضربات. الكلام مطبوع بخط علامتك كأنه نص الكتاب، والرسم كله بالشمع. وكل خط في الصفحة "يغلي" بهدوء، لأنه يُعاد رسمه ثماني مرات في الثانية بفرق شعرة.

**لمن يناسب:** المقاهي والمخابز ومحلات الحلوى، ومتاجر الأطفال والألعاب، والحضانات والمدارس ومراكز التعليم، والمكتبات ودور النشر، وكل علامة تريد صوتًا دافئًا وحنونًا يحكي بدل أن يبيع.

**الحركة المميِّزة:** التلوين. الكلمات تُكتب من جهة القراءة كلمة كلمة، ثم تُلوَّن الكلمة المهمة بخربشة متعرّجة تروح وتجي فوقها، ويُرسم تحتها خط مموّج. الشيء القديم يُشطب بخربشة كثيفة كما يصحّح طفل دفتره، وبين المشاهد تُقلب الصفحة.

**كيف يوزّع ألوان الزبون:**
- لونك الأفتح هو الورق، والأغمق هو شمع الخطوط ولون الكلام المطبوع.
- لون التمييز هو قلم الشمع الملوّن: الشمس والسقف والتلّة وخربشة الكلمة المهمة. وإن كان قريبًا من لون الكلام يُخفَّف بالورق حتى تبقى الكلمة فوقه مقروءة.
- الرماديات والتلّة البعيدة والغيمة مزيج من لونيك.

**يتجنّب:** الخطوط النظيفة المتّصلة، والتدرّجات الناعمة، والظلال، والتوهّج، وكتابة الكلام بقلم الشمع الملوّن، ويد ظاهرة أو قلم ظاهر، والحركة السريعة المرتدّة.

## For Claude

- Every drawn thing goes through `wax(ctx, mask, box, paint)` from `motion.js`: paint solid on the spare sheet, then the tooth mask (`masks().light|mid|heavy`) keeps the wax on the grain. Always pass a tight `box` (frame pixels): it is the only area processed.
- Text is the book's print: drawn with `kit.drawText` in `P.ink` (or `P.grey` for leads and old values), never through the wax mask and never in the accent. Words arrive with `write()` (a clip opening from the reading side), one per `tokens.dur.gap`.
- The key word is coloured over with `colour()` in `P.key` (under the word, drawn before it, timed after it) plus a wavy `stroke()` underline in `P.deep`. `P.key` is lightened automatically when the accent is too dark for ink on it.
- Boil: seed every stroke with `ground.boil(t)` so lines are redrawn 8 times a second; the ground cycles three cached drawings. Do not add other idle motion.
- An opening line with a negative `at` compresses its own timing so the line and its key scribble are complete by frame 0.
- The joint is a page turn (`joint.js`); parts do not animate out.
