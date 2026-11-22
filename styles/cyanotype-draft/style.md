# المخطط الأزرق · Cyanotype Draft

**طابعه:** طبعة شمسية على ورق. ورقة بلونك الفاتح، عليها طبقة حسّاسة للضوء مدهونة بالفرشاة بحواف خشنة، تعرّضت للشمس فصار لونها لون الطباعة: داكنًا متفاوت الكثافة، فيه بقع أعمق وخطوط أفتح على اتجاه الفرشاة ونقاط بيضاء حيث فاتها الطلاء. وعلى الطبعة آثار ما وُضع فوقها: سعفة سرخس في الزاوية وورقة شجر في الأعلى، بيضاء كظلّها، وإطار رسم رفيع وخانة عنوان. الكلام رسم فني أبيض: خطوط قياس بأسهم مرسومة، وأسهم، وخطوط متقطعة.

**يناسب:** الحِرف واليدويات، والمخابز والمقاهي الهادئة، والمشاتل والعطور ومنتجات الطبيعة، ومكاتب العمارة والتصميم الداخلي، وكل علامة تحب الصنعة البطيئة والورق والتفاصيل المدروسة.

**حركته المميزة:** التظهير. لا شيء يُرسم بقلم ولا شيء يطير: موجة من ماء الغسيل تنزل على الورقة، وكل ما تمرّ عليه يتحوّل من لون الطبعة إلى الأبيض ويرتفع قليلًا كأنه يظهر في الحوض. وفي الخروج يغرق الكلام عائدًا في لون الطبعة. والانتقال بين المشاهد موجة ماء بحافة متموّجة تحمل الطبعة التالية.

**ألوانك فيه:**
- لونك الفاتح هو الورق، وهو أيضًا الأبيض الذي يُكتب به.
- لون الطبعة مزيج من لونك الداكن ولون التمييز (`accent`)، يُعمَّق تلقائيًا حتى يُقرأ الأبيض عليه بوضوح. فإن كان لونك أزرق جاءت الطبعة زرقاء، وإن كان غيره جاءت الطبعة بلونه.
- العبارة المهمة رقعة من الورق بقيت بيضاء لأن شيئًا غطّاها عن الشمس، والكلمات عليها بلون الطبعة. رقعة واحدة للعبارة كلها.
- الملاحظات والمقدّمة بأبيض أخفّ ممزوج بلون الطبعة.

**يتجنّب:** خطوط القلم التي تُرسم أمام العين، والشبكات المربّعة، والتوهّج القوي، والألوان الزاهية، وحركات الطيران والارتداد، والكتابة الكثيفة فوق آثار النباتات.

## For Claude

- Colours only from `palette(brand)` in `motion.js` (ground exposes `ground.pal`): `paper`, `coat` (dark toned by accent, deepened until white reads at 6.2:1), `white`, `soft`, `ghost`. A mark's colour while it develops is `M.tone(pal, p, to)`: mix from the coating, never globalAlpha on text.
- Motion: `DEV` (ease-out) to develop, `WASH` to wash out; the only travel is an 8 px rise while developing. The rinse front (`makeWash` / `drawWash`) sweeps a line block in `tokens.dur.front`; a word develops when the front reaches its row.
- Key phrase: `M.layout` + `M.keyRuns`, then one `M.mask` (a paper patch with slightly irregular corners) per run, words in `pal.coat` on it.
- Drawing language: `seg`, `head` (filled narrow arrowheads), `dimension` (opens from the middle). No pen-plotting reveal, no 45-degree ticks, no grid.
- The hook: a line's front plus development end within 0.75 s of `at`.
- Photogram leaves are built once (`M.leaf`); the ground is one cached picture plus a light patch and a frond that sway on `clock`. Text stays inside SAFE, away from the frond in the lower corner on the far side.
- Long leads wrap to two rows at ≥ 90 % of the lead size instead of shrinking.
