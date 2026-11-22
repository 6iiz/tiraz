# فيلم الجدول · Cell Cinema

**طابعه:** الفيلم كله داخل نافذة جدول بيانات عادية لا تحمل اسم أي برنامج: شريط عنوان وأدوات رمادية، وخانة اسم الخلية، وشريط المعادلة، وحروف الأعمدة وأرقام الصفوف، وتبويب الورقة باسمك في الأسفل. الخلايا عريضة كأنها بكسلات مستطيلة، والكلام يسكن خلايا مدموجة بحدود رقيقة. لا شيء يُرسم بحرّية: كل لون على الشاشة قاعدة تنسيق «اشتغلت»، فتومض الخلية لحظة ثم تستقرّ على لونها. وفي الخاتمة يبتعد الجدول فتصير خلاياه شعارك.

**يناسب:** المحاسبين والماليين والاستشارات، وشركات البرمجيات والأدوات المكتبية، والمتاجر التي تعيش على الأرقام والطلبات، والتدريب والدورات، وكل علامة يحبّ جمهورها النظام والدقة ويضحك حين يرى عمله اليومي على الشاشة.

**حركته المميِّزة:** المعادلة ثم Enter. تُكتب معادلة في الشريط حرفًا حرفًا (بالحروف اللاتينية فقط: مراجع خلايا وأسماء دوال)، وعند الضغط على Enter تنزل النتيجة إلى خلاياها دفعة واحدة، وتومض الخلايا التي تحقّق شرطها ثم تمتلئ بلونك، ويقفز المؤشّر السميك بمقبض التعبئة إلى الخلية المهمة. والكاميرا الوحيدة هي تمرير الورقة صفوفًا كاملة، وتكبيرها وتصغيرها، أما النافذة فثابتة لا تتحرّك.

**كيف يوزّع ألوانك:**
- الأفتح من لونيك هو بياض الورقة، والأغمق هو الحبر والمؤشّر.
- رماديات النافذة والشبكة والعناوين كلها مزيج من لونيك.
- لون التمييز هو لون القاعدة التي اشتغلت: خلايا العبارة المهمة، وعلامات الصحّ، والقيمة الجديدة، وخلايا العدّ، ومربّع المرجع المتقطّع، وبكسلات الشعار. وتتدرّج منه خمس درجات نحو الفاتح لشريط الخلايا تحت السطر. والكتابة فوقه بالحبر أو بالفاتح حسب التباين.

**الأمانة:** في العدّ، الخلية تساوي وحدة واحدة فقط حين يكون الرقم عددًا صحيحًا من 1 إلى 60، والنتيجة تزيد مع كل خلية تشتغل. وفي غير ذلك تشتغل أربعون خلية مع العدّ ولا تدّعي وحدة. والمعادلات في الشريط شكلية: مراجع خلايا ودوال عامة، بلا أرقام مخترعة.

**يتجنّب:** واجهة أو اسم أو شعار أو ألوان أي برنامج حقيقي، والتدرّجات والظلال والتوهّج والشفافية، والرسوم البيانية الجاهزة، والكتابة العائمة خارج الخلايا، وكتابة العربي حرفًا حرفًا، والارتداد.

## For Claude

- The window (ground.js) is generic and fixed: title bar, toolbar glyphs, name box, formula bar, headers, tabs, status bar; all mixes of `palette()` from `look/motion.js`. Right-to-left brands get a mirrored sheet (column A on the right, row numbers on the right); the shell stays left to right.
- All text sits in merged ranges (`merged()`), sized in whole rows (`rowsFor()`), and inside SAFE. Leads, labels and the slogan wrap to two rows at ≥ 44 px (`balanced(…, { minPx: 44 })`).
- Colour on cells only through `paint()` (a flash of `flash` s, then the fill with thin dark lines). The key phrase is one block of fired cells per phrase per row (`keySpans()` → `cellsUnder()`), whole rows high, cut just past the phrase so it never covers the next word; the selection (`selection()`) sits on it.
- The formula bar types Latin only (`formulaBar()`); Arabic arrives whole on Enter. The hook's Enter is at most `at + 0.36` and its cells finish flashing before frame 0.
- Camera = the sheet's zoom (ending, `drawSheet(ctx, z)`) and scroll (joint, in steps of two rows, sheet area only). No other motion; no easing on text.
- Honesty: one cell = one unit only for whole numbers 1..60; otherwise 40 cells keep time with the count.
- Sound: `type` under typing, `click` on Enter, `tick` on fired cells, `pop` on a result.
