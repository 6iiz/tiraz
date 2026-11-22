# أنابيب النيون · Gas Glow

**الطابع:** واجهة محل في الليل، نراها من الشارع. خلف الزجاج جدار ورشة داكن من لوح مثقّب، وأمامه لوح شفّاف معلّق بسلسلتين من رأس النافذة، ببرغي في كل زاوية. على اللوح تُركَّب الكلمات أنابيبَ زجاج مثنيّة باليد: لكل كلمة قطبان في طرفيها، وحوامل شفّافة صغيرة تبعدها عن اللوح، ووصلات مطليّة بالأسود تنقل الغاز من كلمة إلى التي بعدها. على عتبة النافذة يجلس المحوّل وسلكاه يصعدان إلى اللوح، ولمبته الصغيرة تضيء حين يضيء أي أنبوب. وفوق كل شيء زجاج النافذة: انعكاسان ساكنان، وضوء سيارة عابرة ينزلق عليه بين حين وآخر. ليس لافتة على جدار طوب: هو العُدّة نفسها، تُشغَّل أمامك.

**لمن يناسب:** المقاهي والمطاعم التي تسهر، والبارات الخالية من الكحول ومحلات الحلويات، والحلّاقين والاستوديوهات، ومحلات الخط والحِرف، والفعاليات الليلية، وكل علامة تريد دفئًا يدويًّا وحنينًا إلى الشارع القديم.

**الحركة المميِّزة:** التشغيل مقطعًا مقطعًا. الكلمات موجودة من أول لحظة زجاجًا باهتًا، ولا تتحرّك أبدًا. يُقلَب مفتاح، فيقدح القطب، ويتقطّع الأنبوب مرّتين قصيرتين، ثم يجري الغاز في الأنبوب من جهة القراءة إلى آخره، ورأسه أسطع من باقيه. الكلمات تُضاء واحدة بعد واحدة، كل واحدة بمفتاحها. العبارة المهمة دائرة واحدة بغاز لون علامتك، تضيء كلها معًا مع أنبوب مستقيم تحتها. والرقم يُشحن: سلّم من أنابيب قصيرة يصعد درجة درجة، ثم يقدح الرقم. وفي المقارنة يموت أنبوب القديم بتقطّع ويبقى زجاجًا مشروخًا، ويقدح الجديد تحته.

**كيف يوزّع ألوان الزبون:**
- **الأغمق** من لونيك هو ليل الورشة والجدار، ومنه المعدن والأسلاك والطلاء الأسود والزجاج المطفأ.
- **الأفتح** هو الغاز العادي (أبيض دافئ يميل قليلًا إلى لونك)، والحروف المرسومة على اللوح.
- **لون التمييز** هو غاز الدائرة المهمة، وأنبوب ما تحت العبارة، والرقم، والشعار، ولمبة المحوّل. وإن كان خافتًا على الليل رفعناه نحو لونك الفاتح حتى يتوهّج.

**يتجنّب:** جدار الطوب، والإطارات المضيئة حول الكلام، والكلمات التي تطير أو تتحرّك، والوميض الكثير (تقطّعان قصيران لكل أنبوب فقط)، والتوهّج الذي يأكل الحروف، وأي لون ليس من ألوان العلامة.

## For Claude

- Ground = the darker brand colour under a 38 % black shade; tubes are `pal.main` (light gas) or `pal.key` (the accent, lifted towards the light colour until it reads at 3.2:1 on the dark). No other hues.
- Text that glows is built with `M.sign(f, box, pal, rtl, o)`: the glow of every word is painted once in `create`; a frame only crops it to how far the gas has run (`run`) at the tube's brightness (`b`). Never blur per frame. Call `sign.rec(kit)` every frame so the check measures it.
- Small or secondary text (lead-ins, titles, handle, slogan) is painted on the panel (`{ painted: true }`), never a thin tube: it keeps ≥ 46 px and wraps to two rows when long.
- Words never move. Entrances are `M.strike` + gas run from the reading side; the old value leaves with `M.fail`. The key phrase is one circuit: all its words share one switch (`slot`) and one accent underline tube.
- The hook: with `at: -0.8` every segment has struck and run by t = 0 (the switches are fitted into 0.68 s).
- Draw order in a part: `ground.draw` (with `power` for the transformer lamp), `ground.spill`, the signs, then `ground.glass` last.
- Sound: `toggle` (on/off) for every switch, a quiet `glitch` for the strike crackle, `thump` for the transformer, `shimmer` when a sign is fully lit.
