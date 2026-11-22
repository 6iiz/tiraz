# حكاية الخريطة · Terrain Story

**طابعه:** خريطة مجسّمة لجزيرة من زاوية منخفضة: جبال وتلال مرفوعة الارتفاع ومضاءة بشمس جانبية واحدة، وخطوط كنتور تطوّق اليابسة، وبحر يغمق كلما زاد عمقه، والأفق يذوب في ضباب السماء. الكلام يكتب في السماء فوق الخريطة بلونك الداكن، والكاميرا تقترب من الجزيرة ببطء طوال الريل كله اقترابًا واحدًا لا ينقطع. وفوق التضاريس طبقة بيانات واحدة هي الشيء الوحيد المضيء: مسارات تُرسم وتجري، وأعمدة ضوء تقوم من الأرض.

**يناسب:** السياحة والسفر، والعقار والتطوير، واللوجستيات والشحن، والطاقة والزراعة، والجهات التي تحكي عن مكان أو مسار أو انتشار: «من هنا بدأنا، وإلى هنا وصلنا».

**حركته المميِّزة:** الكلمة المهمة تصير لافتة على الخريطة: لوحة واحدة بلون علامتك خلف العبارة كلها ولو كانت كلمتين، ومنها خيط ينزل إلى عمود ضوء يقوم من المكان الذي تتحدث عنه. والكلمات تنزل من السماء إلى سطرها وتستقر كأن الكاميرا تهبط. وفي الرقم يرتفع العمود مع العدّ، وفي القائمة يمتد مسار إلى محطة جديدة مع كل بند، وفي المقارنة يرتخي المسار القديم الطويل ويُرسم الجديد المباشر مضيئًا.

**ألوانك فيه:**
- اللون الأفتح من لونيك هو السماء والضباب واليابسة المضاءة، والأغمق هو الكلام والظلال والبحر العميق، وكل ما بينهما مزيج منهما.
- لون التمييز (`accent`) لطبقة البيانات وحدها: المسارات، والأعمدة، ولوحة الكلمة المهمة. ويُكتب فوقه بأوضح لونيك عليه، ويُغمَّق قليلًا حين يُرسم خطًا رفيعًا حتى يظهر على الأرض الفاتحة.

**يتجنّب:** تلوين الخريطة، والتوهّج على غير البيانات، والكتابة فوق التضاريس، والقطع إلى خريطة أخرى، وأسماء الأماكن والأرقام المخترعة على الأرض.

## For Claude

- The relief is rendered once per page (voxel sweep in `ground.js`, cached by palette) and only pushed in on `t + clock` (`tokens.cam`). Do not render it per scene or per frame.
- Text lives in the sky, above about y 980; the terrain begins below. Words enter with `drop()` (≤ 0.75 s total, so a line at `at: -0.8` is whole at frame 0) and lift back on exit.
- One `callout()` per key run from `runs(layout(…))`; key words switch to `pal.onAccent` once the plate is half open. A run on the line's last row also gets the stem and a `pillar()` at the land point picked under it (`ground.pick`).
- Data-layer positions are map points projected each frame with `ground.at(u, v, lift, time)`, so they stay on the terrain while the camera moves. Only the data layer glows.
- Lead-ins keep ≥ 44 px and wrap to two balanced rows (`balanced()`).
- Sound: soft and physical (`rustle`, `tick`, `thump`, one `scratch` on the struck value, `whoosh` through the haze).
