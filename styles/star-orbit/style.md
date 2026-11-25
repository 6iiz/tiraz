# فضاء وكواكب · Star Orbit

**طابعه:** فضاء حقيقي مجسّم. سماء ليلية عميقة فيها نجوم موزّعة على أعماق مختلفة، وسحب سديم خفيفة، وكوكب غازيّ بأحزمة ملوّنة بألوان علامتك: إمّا كوكب عملاق يطلّ حافّته من أسفل الشاشة، وإمّا كوكب صغير بحلقة في الزاوية العليا. الكاميرا لا تلتفّ أبدًا، بل تنساب انسيابًا بطيئًا فتتحرّك النجوم والكوكب خلف الكلام ويبقى الكلام ثابتًا في مكانه. الكلمات أجسام مجسّمة بوجوه مضيئة وجوانب معتمة يلمع طرفها بضوء خلفي.

**يناسب:** التطبيقات والشركات التقنية والناشئة، والبرمجيات والذكاء الاصطناعي، والتعليم والعلوم، وكل علامة تتكلّم عن الطموح والنموّ والمسافة التي قطعتها. ويناسب الأرقام التي تُقرأ كمسافة أو كقفزة.

**حركته المميِّزة:** الكلمات أقمار. تظهر كل كلمة على مدار حول وسط سطرها، تدور فيه بسرعة، ثم يضيق مدارها حتى تستقرّ في مكانها من الجملة، واحدة بعد الأخرى بترتيب القراءة. وحين تستقرّ العبارة المهمة تنفتح حولها حلقة رفيعة ويبدأ قمر صغير يدور حولها، يمرّ خلف حروفها ثم أمامها. الرقم مسافة بين نجمين: يولدان معًا ثم يتباعدان على خطّ قياس تظهر عليه العلامات، والرقم يعدّ مع المسافة ويصل إلى قيمته حين يبلغ النجمان طرفي الخط فيومضان مرة واحدة. في القائمة لكل بند قمره الصغير بمداره. وفي المقارنة يعبر مذنّب القيمة القديمة فيترك أثرًا مستقيمًا يشطبها وتبقى مقروءة. وبين المشاهد كسوف: كوكب معتم مضاء الحافة يعبر العدسة ويكشف المشهد التالي. وفي الخاتمة شعارك هو الكوكب: يقف على وجه عالم مُحزّم، وحوله حلقتان وقمران، ويدور اسمك حوله ثم يستقرّ تحته.

**كيف يوزّع ألوانك:**
- الفضاء لا يكون فاتحًا أبدًا: الأغمق من لونيك (`bg` أو `text`) هو السماء، ويُدفع نحو الليل إن لم يكن داكنًا بما يكفي. فالعلامة الداكنة تأخذ سماءها كما هي، والعلامة الفاتحة تأخذ لون نصّها الداكن سماءً، ويصير لون خلفيتها الفاتح ضوء النجوم والكلام.
- الأفتح من لونيك هو الكلام والنجوم، ويُفتَّح عند الحاجة حتى يقرأ بوضوح على السماء.
- لون التمييز (`accent`) للعبارة المهمة وحلقتها، وللقيمة الجديدة، وللنجمين وخط القياس، وللشعار، ويمتزج في السديم وأحزمة الكواكب. ويُرفع نحو اللون الفاتح إن كان داكنًا على السماء.
- القيمة القديمة مزيج من الفاتح والسماء، أخفت لكنها مقروءة.

**يتجنّب:** السماء الفاتحة، والنص المائل أو الدوّار وقت القراءة، والكوكب خلف الكلام، والنجوم الكثيفة اللامعة خلف السطور، والوميض المتكرّر، والصواريخ والرواد والأشكال الكرتونية، وأي لون من خارج العلامة.

## For Claude

- Everything 3D lives in `look/ground.js`: `create()` builds one scene per part (sky plane, three star sets behind every planet, a few bright stars outside the reading band, one planet by `seed`: even = giant limb under the safe area, odd = small ringed world in the top corner). One WebGL renderer is shared by the reel.
- The camera never rotates: a shifted lens maps the reading plane z = 0 to frame pixels 1:1 while the eye drifts on `t + clock` for parallax. Lay text out in frame pixels with `W3.row()` + `W3.place(row, { y, align })`.
- Words move only by `W3.fly()` (orbit, decaying into place, all landed within `tokens.orbit.window` = 0.78 s of `t0`, so a hook at `at: -0.8` is whole on frame 0) or `W3.arrive()` (from deep space, for leads and titles). Both call `kit.rec`. The orbit radius is clamped so a flying word stays inside the safe sides.
- Key runs (`*…*`) get the key colour plus one ring with a moon (built in `row()`, opened by `fly()`); words beside a key run step aside to leave room for the ring. One ring per run; never a second emphasis.
- Colours only from `palette(brand)`: `sky` (darker brand colour, deepened if needed), `light` (text, stars), `key` (accent lifted to ≥ 4.6:1 on the sky), `old` (struck value, ≥ 4:1). Text faces are self-lit (`light.face` emissive) so they read on any sky.
- Build once in `create()`; `draw()` only moves and renders. No Math.random: `rng(seed)` and `hash()` only.
