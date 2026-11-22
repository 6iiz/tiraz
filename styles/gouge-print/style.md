# الحفر على الخشب · Gouge Print

**طابعه:** طبعة من لوح خشب محفور، أسود وأبيض. الإطار كله لوح محبَّر بلونك الغامق، تظهر فيه عروق الخشب خفيفة، وحوله هامش ضيق من الورق بحافة غير منتظمة. الضوء لا يوجد إلا حيث حفرت الأداة: أشعة شمس محفورة في أعلى اللوح، وحقل محفور بأخاديد تعرض كلما نزلت. لون واحد فقط، لونك، يُحفظ للشيء الذي «يحترق»: الكلمة المهمة والجديد.

**يناسب:** الحِرَف واليدويات، والمخابز والمطاعم الأصيلة، ودور النشر والكتب، والقهوة المختصة، والعلامات التي تريد صوتًا جادًّا وصادقًا وقويًّا.

**حركته المميزة:** الحفر. لا شيء يظهر بالتلاشي: رقعة من اللوح تُحفر سطرًا سطرًا من جهة القراءة، بضربات أداة تدخل عريضة وتخرج مدبّبة، والكلام هو الخشب الذي بقي واقفًا: حروف سوداء على ورق. والحروف المحفورة في اللوح نفسه تظهر خطوطًا رفيعة تعرض حتى تلتحم. وفي المقارنة تعود السكين وتشقّ القديم بثلاث ضربات مائلة. وللخروج يُحبَّر اللوح من جديد بأسطوانة تنزل من الأعلى، ثم تُسحب الورقة عن اللوح فتنطوي ويظهر عليها المشهد التالي مقلوبًا كالمرآة.

**ألوانك فيه:**
- لونك الأغمق هو الخشب المحبَّر، أي الأرضية كلها، والكتابة على الرقع المحفورة.
- لونك الأفتح هو الورق: كل ما حُفر، والحروف المحفورة مباشرة في اللوح.
- لون التمييز لوح لون ثانٍ يُطبع مرة واحدة تحت الكلمة المهمة وتحت الجديد، وحلقة حول الشعار في الخاتمة. ما يُكتب فوقه يُختار بين لونيك بحسب الأوضح.

**يتجنّب:** التدرّجات والظلال الناعمة والتوهّج، ومساحات اللون الكبيرة، والتلاشي، والخطوط الآلية المتساوية، والكتابة فوق الأشعة أو الأخاديد، وأكثر من لون واحد.

## For Claude

- Palette from `palette()` in `look/motion.js`: block = darker brand colour (`P.ink`), cut = lighter (`P.paper`), `P.accent` only under key words, the new value in compare and the ending ring; text on it is `P.on`.
- Text is either wood left standing (`P.ink` on a carved `patch()`), or letters cut into the block (`P.paper`/`P.soft` revealed with `hatch()`). Never put text over the rays (top, y < 260) or the furrows (below the safe area).
- Every appearance is a cut: `patch(x, y, w, h, seed, rtl, T).draw(ctx, p, P.paper)` carves rows from the reading side; `cutShape` + `cutPath` for single gouges (rays, slashes); `hatch()` for letters of light. No fades.
- Exit: `brayer()` re-inks the block from the top over `tokens.dur.ink`; the joint pulls the sheet (mirrored curl). Both use the block's own ink, so the frame never flashes.
- The accent appears as a rolled slab (`colour()`), after the carving it belongs to; at most one accent item per scene.
- Shapes are built once in `create` (patch geometry, rays); the ground canvas is cached per brand, only the rays turn with `clock`.
