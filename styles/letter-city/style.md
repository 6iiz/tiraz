# مدينة الحروف

**الطابع.** مدينة مجسّمة بسيطة الأضلاع عند الغسق. الكلمات نفسها مبانٍ: حروف عربية سميكة مصبوبة كأبراج تقف على الشارع، وجوهها الأمامية فاتحة عليها خطوط طوابق خفيفة، وجوانبها نوافذ مضاءة. حولها أحياء من كتل بنوافذ صفراء دافئة، وأعمدة إنارة على الرصيف، وسماء تنحدر من لونك الداكن إلى وهج غروب ممزوج بلون التمييز. الكاميرا تمشي في الشارع، وكل مشهد شارع جديد في المدينة نفسها.

**لمن يناسب.** شركات العقار والتطوير والمقاولات، ومكاتب الهندسة والعمارة، والمدن والبلديات والفعاليات الحضرية، والشركات الناشئة التي تتحدث عن البناء والنمو والتوسّع، وكل علامة تريد أن تقول «نحن نبني شيئًا كبيرًا». يناسب الأرقام (البرج الذي يعلو) والقوائم (صفّ المباني). ولا يناسب الرسائل الهادئة الحميمة ولا المنتجات الصغيرة الناعمة.

**الحركة المميِّزة.** الكاميرا تنزلق في الشارع من خلف أحد الرصيفين، وتلتفّ حتى تواجه واجهات الكلمات مباشرة وقت القراءة، ثم تواصل طريقها أسرع نحو الشارع التالي. المباني تخرج من الأرض طابقًا طابقًا، كل طابق رفعة قصيرة ثم وقفة. الكلمة المفتاحية آخر برج يرتفع وأطوله، بلون التمييز، وحين يكتمل تُضاء نوافذه وتومض منارة صغيرة على سطحه. الرقم ناطحة سحاب تعلو طابقًا طابقًا ويعدّ الرقم معها. وبين المشاهد يمرّ مبنى داكن قريب من العدسة فيكشف الشارع الجديد خلفه. وفي الخاتمة ينفتح الشارع على ساحة دائرية يرتفع في وسطها شعارك معلمًا للمدينة.

**كيف يستعمل ألوانك.**
- اللون الأغمق بين لون الخلفية ولون النص هو **الليل**: السماء العليا والإسفلت وجدران المباني.
- اللون الأفتح هو **الضوء**: واجهات الحروف، والنوافذ المضاءة، والنص المسطّح في السماء.
- **لون التمييز** للكلمة المفتاحية وللرقم وللقيمة الجديدة ولشعارك، ويمتزج قليلًا في وهج الأفق. إن كان قريبًا من الليل فُتِّح نحو الضوء حتى يُقرأ.
- كل الرماديات والدرجات مزيج من ألوانك الثلاثة.

**ما يتجنّبه.** النص المائل بزاوية كبيرة وقت القراءة، والكتابة فوق النوافذ المضيئة بلا غلالة داكنة، والألوان من خارج العلامة، والاهتزاز، والومضات، والمباني التي تقف بين الكاميرا والكلمات.

---

## For Claude

- One renderer for the whole reel lives in `ground.js` (WebGL contexts are limited); each part calls `world()` once in `create()` and only moves things in `draw()`. The camera is always level (no pitch): the horizon is placed by a shifted lens (`layout(..., { horizon })`), so towers stay vertical.
- Layout is solved from the screen: give each row `{ item, size (type px on screen), y (screen y of its lowest point) }`, far row first. Text is built at `SL` and scaled to land exactly there. Keep every row inside `SAFE`; report each row with `kit.rec(...w.screenOf(row.inner), row.text)`.
- Readability: at rest the camera faces the fronts; the glide's side start is the only angle. Text materials have `fog: false`; flat text (lead, label, title, handle) sits on `haze()`.
- Colour roles come from `palette(brand)`: `night`, `light`, `key` (accent, lifted if it is too dark against the night), `ink` (what reads on a key-colour plate). No hard-coded hues.
- Motion: `glide()` for the camera (one move per scene: in, a slow creep, out faster), `floors()` for anything that rises. A hook (`at` < 0) must be whole by 0.8 s into its animation: line words rise inside `tokens.dur.window`.
- `glyphs.js` builds the 3D text with holes found by contour direction, and `path.js` rewrites logo paths with arcs; both were written when the shared base mishandled these (it has since been fixed).
- The city is seeded from the scene's clock: every scene is a new block. Buildings that would stand in front of a row at any sampled camera pose are not built.
