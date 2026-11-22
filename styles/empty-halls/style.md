# الممرات الفاضية · Empty Halls

**طابعه:** شريط فيديو منزلي قديم يمشي ببطء في ممر مكاتب فارغ لا ينتهي: سقف مستعار فيه ألواح إضاءة كل بضع خطوات، وسجّاد، وأبواب مفتوحة على العتمة، وآخر الممر يذوب في الظلام. الصورة فيها حبيبات الشريط وخطوطه وخطّ تتبّع يمرّ أحيانًا، وفي الزاوية علامة التشغيل وعدّاد الشريط. غريب قليلًا وهادئ، بلا أي شيء مخيف: لا كائنات ولا دماء ولا مفاجآت.

**يناسب:** العلامات التي تحب الغموض والقصص: المقاهي الليلية والمساحات المشتركة، والفنادق والعقار ومساحات العمل، والألعاب والتطبيقات، وكل حملة تبدأ بسؤال "وين الكل؟" وتنتهي بأن علامتك هي المكان الذي فيه الحياة.

**حركته المميّزة:** الكاميرا تبحث عن التركيز. الكلام يظهر ضبابيًا ثم يحدّ ثم يلين ثم يثبت، كما تفعل كاميرا منزلية. والعبارة المهمة تمسكها أقواس التركيز الأربعة بلون علامتك. وبين المشاهد يقفز الشريط: شريط تشويش يصعد في الإطار، فوقه التسجيل القديم وتحته الجديد. وفي الخاتمة تتقدّم الكاميرا، فتخرج من عتمة آخر الممر لافتةٌ مضيئة بلونك عليها شعارك، وتقف تحتها.

**ألوانك فيه:**
- لونك الأفتح هو ضوء الألواح والجدران حين يُمزج بلونك الأغمق، ولونك الأغمق هو العتمة في آخر الممر.
- الكلام بلونك الأفتح فوق بقعة من العتمة، والكلمات العادية أخفت قليلًا من العبارة المهمة.
- لون التمييز لأقواس التركيز، ولقلم التظليل على ورقة التعليمات، وللافتة الخاتمة فقط.

**يتجنّب:** الكائنات والوجوه في العتمة، والدماء والخراب، وقفزات الرعب والومضات، والكلام فوق الجدران المضيئة بلا عتمة خلفه، وأسماء الأماكن أو القصص المعروفة على الإنترنت.

## For Claude

- Colours: light = lighter of `bg`/`text`, dark = darker; `deep` is the dark pulled toward black (the far end), `fluo` the light lightly tinted with the accent. Every hall surface is a mix of these, fogged toward `deep` with distance.
- The hall is drawn from far to near each frame from reel time (`clock`); it is cheap (a few dozen quads). Grain, scanlines and vignette are canvases built once (`tape`), drawn by `ground.over()` at the very end of every part.
- Text always sits on `shade()` (a soft pool of dark), centred over the vanishing point (`tokens.vy`). Never put text on the lit ceiling or walls without it.
- Entrances are focus pulls (`focusText`): blur from about 10 px to sharp, one small hunt, a 3.5 % size settle; exits slide sideways in thin slices and blur out. The opening line is compressed so it is sharp by frame 0.
- One key phrase = one set of brackets (`keyRuns`, gap opened by `boxes`); on paper (the list notice) it is one highlighter stroke instead. Fit keyed text with `maxW` minus `keyRoom(size)`.
- Keep it eerie, never frightening: nothing moves in the doorways, flicker is rare and gentle, no flashes; the ending resolves warm (the lit sign).
- Lead-ins wrap to two rows (min 92 % of size) rather than shrink.
