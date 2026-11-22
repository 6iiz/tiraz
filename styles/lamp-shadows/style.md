# خيال الظل · Lamp Shadows

**الطابع:** مسرح صغير من خشب داكن، في وسطه ستارة قطنية يضيئها من خلفها سراج زيت. الستارة أفتح في الوسط وتسمرّ نحو الحواف، ونسيجها ظاهر، وضوء السراج يرتجف عند أطرافها ارتجافًا خفيفًا. كل ما على الستارة قطع مسطّحة من جلد مصبوغ بلون علامتك ومخرّم كالدانتيل، فيمرّ الضوء من ثقوبها ويغمق حيث تتراكب: طُنُف مسنّن بشرّابتين في الأعلى، وموج محفور في الأسفل، وطائر بجناح على مسمار يعبر فوق الموج على عصاه. الكلام ظلّ قاتم لحروف مقصوصة مضغوطة على القماش، والعبارة المهمة على لوحة جلد مخرّمة الحواف تمسكها عصا رفيعة.

**لمن يناسب:** المقاهي والمطاعم ذات الطابع التراثي، والحكواتي والمسرح وأمسيات رمضان، ومتاجر الحِرَف والهدايا، ودور النشر وقصص الأطفال، والمتاحف والفعاليات الثقافية، وكل علامة تحكي ولا تبيع.

**الحركة المميِّزة:** كل قطعة تُحمل من السراج إلى الستارة: تبدأ كبيرة باهتة ضبابية لأنها بعيدة عن القماش، ثم تنضغط عليه فتصير حادّة قاتمة بحجمها الحقيقي، وهي تنزلق من جهة القراءة. وحين تغادر تُسحب نحو السراج فتكبر وتلين وتذوب. القطع المعلّقة على عصيّ لا تسكن تمامًا، واللوحة التي تحمل الكلمة المهمة تنقرها العصا نقرة واحدة. وبين المشاهد يعبر الستارة حاجز جلدي مشبّك، والمشهد الجديد قائم خلفه.

**كيف يوزّع ألوانك:**
- اللون الأفتح بين خلفيتك ونصّك هو ضوء الستارة، ممزوجًا بقليل من لون التمييز كأنه لون اللهب.
- اللون الأغمق هو الظلّ: الكلام كله، والخشب حول الستارة (ممزوجًا بقليل من الفاتح).
- لون التمييز هو صبغة الجلد: الطُّنُف والموج والطائر والحاجز، تُطبع على الضوء طبعًا (multiply) فتغمق حيث تتراكب.
- لوحة الكلمة المهمة لون التمييز مخفّفًا بضوء الستارة حتى يُقرأ الظلّ القاتم فوقه بوضوح.

**يتجنّب:** الأسود الصِّرف والأبيض الصِّرف، والوميض القوي للسراج، والزوايا الهندسية الصارمة، والكلمات الملوّنة بلون التمييز، وأي نص بلا ظلّ قاتم على ضوء صافٍ.

## For Claude

- Palette from `ground.P` (`motion.palette`): `screen` (the lit cloth), `ink` (shadow text), `soft` (lead-ins, handle), `hide` (key plaques, thinned until 5:1 with ink), `dye` (scenery hide, laid in `multiply`), `rim`, `deep`, `wood`, `wood2`. Text is always `ink` or `soft` on the screen; nothing is written on `dye`.
- The screen is `ground.S` (x 36–1044, y 150–1372). Scenery lives only above y 260 and below y 1250 so it never sits behind text; the bird crosses the wave band.
- Every arrival is `press` (blur, scale, pale → sharp, sliding from the reading side, 0.32 s); every exit is `lift`. No other entrance. A line lands within 0.68 s of `at`, whatever its length.
- Key phrases: pass the fitted text through `isolate()` first (keeps a multi-word `*phrase*` on one row and spaces it from its neighbours), then one `runPlaque` per run from `keyRuns()`; skip spacer words (`w.ph`) in `each`. One plaque per phrase, held by one `rod`, tapped once with `bob`.
- Lead-ins wrap to two rows rather than shrinking (minScale 0.9 of 50 px).
- Sounds: cloth `rustle`, wooden `click` for pieces pressed, a drum `thump` for the key plaque and the number; `swish` under the lattice joint.
