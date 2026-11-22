# الإنفوغرافيك الأيزومتري · Isometric

**طابعه:** عالم صغير هادئ مرسوم بزاوية ثلاثين درجة، كأنك تنظر إلى مجسّم على طاولة. كل شيء فيه كتل مسطّحة لها ثلاثة وجوه بثلاث درجات من ألوانك: وجه علوي فاتح، ووجه أيسر بلونه الأصلي، ووجه أيمن أغمق. الكتل تخرج من أرضيتها صعودًا إلى مكانها، والأرقام تصير أعمدة مكدّسة طبقة فوق طبقة، والعناوين معلّقة على خطوط إشارة رفيعة تصل كل كلمة بالشيء الذي تشرحه. الحركة ناعمة وقصيرة، لا ارتداد فيها ولا دوران.

**يناسب:** الخدمات والمنتجات التي تحتاج شرحًا: خطوات العمل، ومراحل التوصيل، وكيف يُصنع الشيء، والتطبيقات والشركات التقنية واللوجستية والعقارية. ويناسب الرسائل التي تقول «هكذا نعمل» بهدوء ووضوح.

**حركته المميزة:** الكتلة التي تنبثق من الأرض. كلمتك المهمة لها كتلة بلون علامتك هي الأعلى بين الكتل، وخط إشارة يربطها بالكلمة. وفي الخاتمة يرتفع مكعّب بلونك ويُطبع شعارك على وجهه العلوي بالمنظور نفسه.

**ألوانك فيه:**
- لون الخلفية (`bg`) هو الأرض، وعليه شبكة أيزومترية خافتة تقوى قرب الأسفل.
- لون النص (`text`) للكتابة كلها، ومنه تُمزج الكتل المحايدة والأرضيات بدرجات خفيفة.
- لون التمييز (`accent`) للكتلة الأهم في كل مشهد، وللكلمة المهمة، ولسهم «قبل وبعد». الكلمة المهمة تُكتب بلون التمييز إذا كان مقروءًا على خلفيتك، وإلا كُتبت بلون النص مع خط تحتها.
- الظلال كلها مزج من ألوانك الثلاثة، لا لون من خارجها.

**يتجنّب:** المنظور الحقيقي ونقاط التلاشي، والظلال الناعمة والتوهّج والتدرّجات على الكتل، والحركة المرتدّة أو الدوّارة، والكتل المزدحمة التي تخفي الكلام، وأي كتلة تمرّ خلف النص.

## For Claude

- Projection is fixed: `project(ox, oy, u)` from `look/motion.js` (x down-right, y down-left, z up, 30 degrees). Never mix in a perspective camera. Draw blocks back to front (sort by x + y).
- Every solid is `block(ctx, P, x, y, z0, w, d, h, faces, layers)` with faces from `palette()`: `pal.neutral`, `pal.floor`, `pal.hot` (accent). New tones come from `faces(mix(...))` only. One accent block per scene: the one that carries the point.
- Extrusion uses `G` (outQuart) on height; words use `arrive`/`leave` (soft rise + fade, `E` = outCubic). No bounce, no spin, no slide-in from off frame.
- Labels sit on the ground beside objects, joined by `leader()`; text never sits on a block face (except the logo on the ending cube). Keep blocks out of text rows.
- When a compare gets two numbers, column heights are true to scale from the floor (`h = hMax * v / max`); words get equal blocks. Never invent a scale or a value.
- Long text: `balanced()` for wrapped lines; the line part caps its stagger so a hook of any length has landed by t = 0 with `"at": -0.8`.
- Joint: the 30-degree edge wipe in `joint.js`. Ground: the lattice drifts one cell per ten seconds on `clock`.
