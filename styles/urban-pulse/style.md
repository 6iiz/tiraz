# نبض المدينة · Urban Pulse

**الطابع:** مدينة في الليل مصوّرة بالتسريع الزمني، مرسومة كلها بالكود. سماء هادئة تجري فيها الغيوم بسرعة، وخط أبنية تنطفئ نوافذها وتضيء مع كل نبضة، وطريق تحت الأفق صارت فيه السيارات أنهارًا من الضوء: رؤوس فاتحة قادمة وذيول بلون علامتك ذاهبة. الإطار يقطع بين ثلاث لقطات للمدينة مرة في كل مازورة، كأن المونتاج يمشي على الموسيقى. والكلام يُكتب فوق السماء الهادئة، لا فوق الزحمة.

**لمن يناسب:** المشاريع التي تعيش في المدينة وإيقاعها: المطاعم والمقاهي الليلية، والتوصيل والنقل، والعقار، والفعاليات، والعلامات الشابة السريعة التي تريد أن تبدو حيّة ومتحرّكة وواثقة.

**الحركة المميِّزة:** لا شيء يظهر بالتلاشي. كل كلمة يكتبها ضوء سيارة عابرة: رأس مضيء يمرّ على سطرها فيكشفها خلفه، وتغادر بضوء ثانٍ أسرع يمسحها. والعبارة المهمة يمتدّ تحتها خط تعريض طويل واحد كأثر سيارة في صورة بطيئة الغالق. وفي الخاتمة قطع حادّ على الضربة القوية يُطفئ المدينة كلها مرة واحدة، فيبقى الليل وشعارك، ويدور حوله ضوء واحد دورة كاملة، ثم تعود النوافذ نبضةً نبضة.

**كيف يوزّع ألوان الزبون:**
- اللون الأغمق من لونيك هو الليل، والأفتح هو الضوء: النوافذ والكتابة ورؤوس السيارات.
- لون التمييز هو الأضواء الخلفية للسيارات، وتوهّج الأفق، وأثر الضوء تحت العبارة المهمة، والكلمة المهمة نفسها (يُفتَّح بلونك الفاتح إذا لم يكفِ وضوحه على الليل).
- الرماديات والأبنية مزيج خفيف من لونيك.

**يتجنّب:** التلاشي والارتداد، والكلام فوق الطريق أو الأبنية، والقطع الذي يومض الإطار كله، وأكثر من خط تعريض واحد للعبارة الواحدة، والصور الحقيقية أو أي شعار لمدينة أو جهة.

## For Claude

- Ground (`ground.js`): night = the darker brand colour, lights = the lighter one, whichever is called `bg`. Sky, skyline, two window states and a cloud strip are painted once per brand (module cache); a frame only stacks them. Text lives above `tokens.city.horizon` (1330) on the calm band; never place a part's text over the road.
- The beat is `tokens.beat` (0.5 s): windows switch every beat, the framing cuts every bar (three crops), the mark's four cells light in turn. Put list items and big landings on beats.
- Every word arrives with `streakIn` (a light head uncovers it from the reading side) and leaves with `streakOut`; the hook (`at: -0.8`) is fully written before frame 0. `cut: true` keeps the words to the last frame so the joint cuts them away.
- Key words (`*…*`) are set in `pal.key` (the accent, lightened toward the light colour until it reads on the night) and a key phrase gets one `trail` under the whole run (`runs()` merges consecutive key words on a row). Never one trail per word.
- Leads, titles and labels wrap at their size (`minScale: 1`) rather than shrink below ~48 px.
- Sounds: `tick` on beats and list items, `swish` for passing lights, `thump` on landings and the ending's hard cut, `whoosh` (short) on the traffic joint.
