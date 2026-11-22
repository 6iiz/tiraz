# فلاش الكلمات · Word Strobe

**طابعه:** بطاقات عناوين تُقطع على الإيقاع كأنها مونتاج طليعي. أرضية داكنة عليها عمارة رمزية بمضلّعات مسطّحة: ممرّ بنقطة تلاشٍ واحدة وشبابيك تتكرر، أو درج لا ينتهي، أو واجهة نوافذ. الكلام يُكتب على حقول ورقية صلبة تخرج من حافة الإطار، والكلمات لا تنزلق ولا تتلاشى: تظهر بقطع حادّ، كلمة بعد كلمة بفواصل غير متساوية من بضعة كوادر. ووراء الكلام كلمة عملاقة بدرجة رمادية خافتة تملأ الإطار وتخرج من حوافه، وتتبدّل على كل نبضة.

**يناسب:** الحملات الجريئة والإطلاقات، والموضة والموسيقى والفنون، والمقاهي والمطاعم ذات الطابع المديني، والعلامات التي تريد صوتًا حادًّا وواثقًا وجملًا قصيرة تُقال كالضربات.

**حركته المميزة:** الوميض المضبوط. الكلمات تُقطع إلى الشاشة واحدة واحدة، والعبارة المهمة تتأخر كادرات قليلة ثم تنزل على كتلة بلونك. وفي الخلفية تتعاقب الكلمات العملاقة على الإيقاع كبطاقات عنوان، بدرجات خافتة لا تُبرق الإطار. والكاميرا تزحف ببطء نحو نقطة التلاشي ما دام السطر ثابتًا.

**ألوانك فيه:**
- الأغمق من لونيك هو الأرضية، والعمارة درجات منه ممزوجة قليلًا بالفاتح.
- الأفتح هو ورق الحقول التي يُكتب عليها بالداكن.
- لون التمييز (`accent`) كتلة خلف العبارة المهمة وخلف الرقم حين يصل، وشريط صغير على حافة القراءة بجانب المقدّمة.
- الكلمة العملاقة في الخلفية مزيج خافت من الأرضية والفاتح، وكلمة العبارة المهمة مزيج خافت مع لونك.

**يتجنّب:** التلاشي والانزلاق والتخفيف، والوميض الأبيض أو تبديل سطوع الإطار كله، والتدرّجات والتوهّج والحبيبات، وتحريك الحروف منفردة، والكتابة بلا حقل فوق الكلمة العملاقة لنصٍّ يُقرأ (المقدّمة وحدها على الأرضية مباشرة لأنها فاتحة على داكن).

## For Claude

- Cuts only: no easing on readable things. Words appear on frames given by `cuts()` (uneven gaps from `tokens.gaps`, in frames); fields open in three hard steps (`opens`); rows drop out bottom-up in the last frames (`gone`).
- The strobe (`ghost`) must stay tonal: `tone.ghost` ≈ 0.11 of paper into ink (key word: 0.26 of accent). Never raise it high enough to change the frame's mean brightness; the reel check counts flashes. It changes at most once per `tokens.beat`.
- Every read text is on a paper field (ink type) or an accent block (`onAccent`), except the lead/title/handle which are paper type on the dark ground with an accent rail at the frame's reading edge.
- A `*key phrase*` is ONE accent block over the whole run (`keyRuns`/`block`); `balanced` never wraps inside it. Leads and titles ≥ 44 px, two rows rather than shrinking.
- Opening line: with `at ≤ -0.8` all words have cut in before frame 0. Keep total cut time under 0.7 s.
- Rooms: `corridor` (line, list), `stairs` (count, compare), `facade` (ending), each drawn once; the push-in is `tokens.push` over the scene.
- Sound: `click` per cut, `thump` on the key, `impact` once when a number lands or the new value cuts in, `scratch` on the strike, quiet `tick` on strobe changes, `glitch` on the slat joint.
