# الزجاج المعشّق · Lead and Light

**طابعه:** نافذة طويلة بقوس نصف دائري في جدار حجري داكن، نراها من الداخل. زجاجها قطع معيّنة بدرجات لونك، مثبّتة بخيوط رصاص وقضبان حديد، وحولها إطار من قطع صغيرة ملوّنة. الزجاج لا يضيء من نفسه: هو غامق حليبي، ولا يتوهّج إلا حيث تمرّ الشمس من خلفه، وعلى أرض الحجر تحت النافذة ظلّ ملوّن ناعم منها. الكلام مرسوم بطلاء داكن على ألواح زجاج شفافة مؤطّرة بالرصاص، والكلمة المهمة على قطعة من زجاج بلونك.

**يناسب:** المقاهي والمطاعم ذات الطابع العتيق، والفنادق والبيوت التراثية، والحِرف اليدوية، ومعارض الفن والديكور، والعلامات الهادئة التي تحب الضوء الدافئ والتفاصيل المصنوعة باليد.

**حركته المميزة:** الضوء هو الساعة. القطع تُركّب في الرصاص واحدة واحدة بحركة جامدة متقطّعة كيد الزجّاج، غامقة في البداية، ثم تمرّ الشمس من خلفها من جهة القراءة فتضيء القطع وتظهر الكلمات المرسومة عليها كلما وصلها الضوء. وحين يُلغى شيء، يتشقّق زجاجه وتنطفئ إضاءته. وبين المشاهد تُركّب قطع معيّنة من المشهد التالي فوق السابق حتى تغطيه.

**ألوانك فيه:**
- لونك الأغمق هو الحجر والرصاص وطلاء الكتابة.
- لونك الأفتح هو الزجاج الشفاف وضوء الشمس.
- لون التمييز وخلطاته مع لونيك هي ألوان الزجاج الملوّن، والكلمة المهمة على قطعة منه، يُكتب عليها بأوضح لونيك.

**يتجنّب:** الصلبان والهالات والقديسين وأي رمز ديني، والحركة الناعمة المنزلقة (القطع تتحرّك بخطوات)، والتوهّج الذي يغمر الإطار، والكتابة على الزجاج الملوّن المزدحم دون لوح شفاف، والخطوط السوداء الرفيعة كرسوم المتجهات.

## For Claude

- Stone, lead and grisaille paint come from the darker brand colour; clear glass and light from the lighter; coloured glass only from `pal.tints` (mixes of the accent with both). Glass colour is always `glass(pal, c, lit)`: dark and milky at 0, backlit at 1.
- Anything that arrives does so on the stepped clock `q(t)` (12 steps a second): pieces appear rigidly, a pane drops 10–14 px for two steps then sits. No smooth eases on pieces.
- Light reveals: words are drawn with `painted(ctx, lit)` and come up in four steps as the `sun()` band reaches them from the reading side. Nothing readable sits on the quarry lattice without its own clear pane.
- Key word: its own leaded piece of `pal.accent` glass, text in `pal.keyText`. The new value of a compare sits on accent glass; the old one cracks (`crack`) and goes dark.
- Parts leave by stepping out in four steps over `dur.out`; the joint glazes the next frame in diamond quarries. Keep the sun mask soft and partial: the frame must never flash.
