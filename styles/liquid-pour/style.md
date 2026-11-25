# سائل وقطرات · Liquid Pour

**الطابع:** استوديو داكن، وفي أسفل الكادر بركة لامعة من سائل علامتك. كل كلمة قالب مجسّم فارغ يُصبّ فيه سائل كثيف لامع: خيط رفيع ينزل من أعلى الكادر خلف الكلمة، فيمتلئ القالب من تحت لفوق، وسطح السائل ما زال يتموّج، ثم تتماسك الكلمة بارتجافة ناعمة واحدة. على أطراف الحروف السفلية تتكوّن قطرات، تتمدّد، وبعضها يفلت ويسقط في البركة فتنتشر حلقات. الحروف لامعة بطبقة شفافة فوقها، لكن لونها نفسه قوي وواضح، فتبقى مقروءة على أي هوية. الإحساس فاخر وشهيّ وهادئ.

**لمن يناسب:** المقاهي ومحامص القهوة، والعصائر والمشروبات، والعطور، والشوكولا والحلويات، ومستحضرات العناية والتجميل، وكل منتج سائل أو كريمي أو لامع. ويناسب الرسائل القصيرة التي تريد أن تبدو شهيّة ومصقولة.

**الحركة المميِّزة:** الصبّ. الكلمات تُصبّ واحدة بعد الأخرى بترتيب القراءة، والكلمة المهمة تُصبّ بسائل لون علامتك. الرقم يُصبّ كأنه كأس قياس: كلما ارتفع السائل في الرقم زاد العدد حتى يمتلئ على قيمته. في المقارنة تُصبّ القيمة القديمة بسائل باهت ثم تبدأ تذوب: يهبط أعلاها، ويتّسع أسفلها، وتتدلّى منها قطرات طويلة، وتبقى مقروءة بينما تُصبّ القيمة الجديدة تحتها وتتماسك. بين المشاهد ينهمر ستار من سائل علامتك من أعلى الكادر فيغطّي المشهد ويكشف التالي. وفي الخاتمة يُصبّ شعارك بخيط عريض، ثم اسمك وحسابك وشعارك النصّي تحته.

**كيف يوزّع ألوان الزبون:**
- الأغمق من لونيك (`bg` أو `text`) هو جدار الاستوديو دائمًا، مع إضاءة خفيفة خلف الكلام، لأن اللمعان يظهر أجمل في غرفة داكنة.
- الأفتح من لونيك هو سائل الكلام العادي.
- لون التمييز (`accent`) هو سائل الكلمة المهمة والرقم والقيمة الجديدة والشعار وحبّات القائمة وستار الانتقال. إن كان غامقًا لا يُقرأ على الجدار يُفتَّح قليلًا نحو لونك الفاتح.
- المقدّمات والعناوين الصغيرة مزيج من الفاتح والداكن، والقيمة القديمة أبهت منها.
- البركة مزيج داكن من الجدار ولون التمييز. الإضاءة بيضاء محايدة لا تضيف لونًا.

**يتجنّب:** الظلال المرسومة على الجدار (تبدو نسخة شبحية من الكلام)، وانعكاس الكلام في البركة، والمعدن والزجاج الشفاف، والتلاشي، والقفز والارتداد، والكتابة المسطّحة فوق الصورة إلا العلامة الصغيرة فوق البركة.

## For Claude

- Everything 3D lives in `look/ground.js`: one shared WebGL renderer and one PMREM studio environment (white panels only) for the whole reel; each part builds its own scene (wall, pool, lights, a shifted-lens camera solved so the reading plane z = 0 maps 1 unit to 1 frame px). Build in `create()`; `draw()` only sets uniforms, moves meshes and renders.
- Text: `W3.slab(text, { size, role })` (role `ink` | `lead` | `old` | `key`; key words always take the key liquid), `W3.place(sl, { y, align })`, then `const pose = W3.pour(sl, { t0, step, out0, out1, drop, melt })` and `pose(t)` each frame. `pour` records the text for the check. The logo is `W3.logo(size)`, list bullets are `W3.bead(...)`.
- The fill is a shader cut on world y (`uLevel`, spread from the stream `uSx`, surface wave `uWave`); back faces seen through the cut are shaded as a level liquid surface. Shadows use a matching depth material, so a half-full mould casts a half shadow. Bevels and walls get smoothed normals (`smoothNormals`), caps stay flat.
- Streams are behind each word's back face, so rows in front hide them. Only the lowest row drops into the pool (ripple rings are registered when the plan is made, up to 8 live).
- Hook: every word of a line is full within `pour.window` (0.72 s) of `at`, so `at: -0.8` is whole and stream-free on frame 0.
- Readability: liquids are dielectric (metalness 0, strong diffuse colour, clear coat), the wall is always the darker brand colour, the key colour is lifted to ≥ 3.4 contrast on it. Never add shadows onto the wall or a reflection of text in the pool.
- Sound: `swish` for a stream, `pop` when a word sets or a bead lands, `drop` for the melt, `shimmer`/`ding` for the key and the full number, `whoosh` for the curtain.
