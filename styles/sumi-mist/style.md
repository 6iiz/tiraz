# ضباب الحبر · Sumi Mist

**طابعه:** لوحة حبر على ورق أرز، أغلبها فراغ. حبر واحد بخمس درجات، من الرمادي الشفاف إلى الأسود المحروق، ولون واحد فقط هو لون علامتك، يظهر ختمًا صغيرًا لا أكثر. في أسفل الإطار سلاسل جبال باهتة تذوب في الضباب، والضباب يمرّ عليها ببطء طول الريل. الكلام لا ينزلق ولا يقفز: الكلمة تنتشر في الورق بقعةً ناعمة من حبرها ثم تتّضح، وحين تغادر تذوب في الضباب. والخط عريض مثل ضربة فرشاة محمّلة، ينشف في آخرها فيظهر الورق بين شعراتها.

**يناسب:** المقاهي الهادئة ودور الشاي، والعطور، والسبا والعناية، والخطاطين والفنانين، والعلامات التي تبيع الهدوء والتأنّي والذوق. ويناسب الرسائل القصيرة التي تحتاج مساحة لتتنفّس.

**حركته المميزة:** الانتشار ثم الختم. كل كلمة تولد من بقعة حبر ضبابية وتصفو، وتحت الكلمة المهمة تمرّ ضربة فرشاة باهتة باتجاه القراءة، ثم يُضغط الختم الملوّن عند طرفها. وفي الرقم دائرة تُرسم بنفَس واحد وتبقى مفتوحة، ويُختم الرقم في فتحتها. وبين المشاهد يصعد ضباب بلون الورق ويبدّل الصفحة من خلفه.

**ألوانك فيه:**
- اللون الأفتح بين لونَي الخلفية والنص هو الورق، والأغمق هو الحبر.
- الحبر يُستعمل بدرجاته الخمس، وكلها مزج بين لونيك: الأغمق للكلمة المهمة، وأقل منه للكلام، والمتوسط للتمهيد والعناوين، والباهت للجبال والضربات تحت الكلمات.
- لون التمييز (`accent`) للختم وحده: مربّع صغير عند الكلمة المهمة، وختم الشعار في الخاتمة.

**يتجنّب:** الألوان المسطّحة الكبيرة، والخطوط الهندسية المرسومة بالمسطرة، والحركة المرتدّة أو الدوّارة، والإطارات والبطاقات، وأي لون غير الحبر والختم، وملء الإطار؛ الفراغ جزء من اللوحة.

## For Claude

- Paper is the lighter of `bg`/`text`, ink the darker (`ground.pal`). All greys are `pal.tone(k)` with the five tones in `tokens.tone`; text uses `pal.quiet(k)` (pushed darker until it reads 4.5:1 on paper) or `pal.ink` for key words. The accent appears only as `seal(...)`: never as text, never as a wash.
- Words enter with `bloom(ctx, p, out, ink, size)` inside `kit.drawText`'s `each` (soft ink bleed that sharpens; leaving, it dissolves upward). No slides, no scale, no rotation.
- Strokes are built once with `stroke()`, `swash()` or `enso()` and painted along their length with `paint(ctx, S, p, color, alpha)`, timed with `B`. Use `boxes()`/`keySpans()` to place a swash under the key words before the words are drawn.
- Key word: pale swash (`tone.wash`) under it in the reading direction, word in `pal.ink`, seal pressed below its reading-side edge after the swash.
- The mountains and mist live below the safe area in `ground.js`; keep the text area empty paper. The ground is cached per brand at module level and uses `clock`.
- Sound: soft kinds only (`rustle`, `swish`, `tick`, a low `thump` for a seal, `shimmer` once in the ending).
