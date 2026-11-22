# اللقطة المحفورة · Scratch Pass

**طابعه:** منظر طبيعي محفور كلوحة خدش، حبر وورق فقط ولون أحمر واحد. السماء خطوط أفقية تزداد سماكةً كلما ارتفعت، والشمس قرص أحمر منخفض تقطعه خطوط ورق، وسلسلة جبال بأوجه مضلّعة: الوجه المضاء ورق والوجه المظلل حبر تقطعه خطوط على اتجاه المنحدر، ثم غابة وماء بتموّجات محفورة وتلّة قريبة عليها سياج. الرمادي لا يوجد إلا كعرض للخطوط. والكاميرا تتحرك جانبيًا حركة واحدة متصلة طول الريل، والطبقات تنزلق بسرعات مختلفة فيظهر العمق.

**يناسب:** السياحة والضيافة والمنتجعات، والمزارع والمنتجات الطبيعية، والعقار خارج المدن، والرحلات والفعاليات في الطبيعة، وكل رسالة فيها طريق أو مسافة أو رحلة.

**حركته المميزة:** الحفر والمرور. الكلام لا يظهر على المنظر مباشرة، بل على قصاصات ورق تُحفر من الحبر: خطوط متوازية تمتد من جهة القراءة ثم تتسع حتى تلتئم ورقةً نظيفة، ثم تنزلق الكلمات قليلًا في اتجاه سير الكاميرا وتستقر. والكاميرا لا تقطع أبدًا: بين المشاهد يمرّ عمود قريب أمام العدسة، وخلفه المشهد التالي.

**ألوانك فيه:**
- لونك الأفتح هو الورق، ولونك الأغمق هو الحبر، ومنهما كل شيء.
- لون التمييز (`accent`) هو الأحمر الوحيد: الشمس، وضربة السكين تحت الكلمة المهمة، والكلمة المهمة نفسها إن كانت واضحة على الورق (وإلا كُتبت بالحبر وبقيت ضربة السكين حمراء)، والشعار في الخاتمة إن كان واضحًا.

**يتجنّب:** التدرجات والظلال الناعمة، وأي لون ثالث، والكتابة فوق المنظر بلا قصاصة، وقطع الكاميرا أو إعادة الحركة من أولها، والإمالة والتدوير.

## For Claude

- Two values only: `pal.paper` and `pal.ink`; tone is the width of parallel cuts (`carve`, the sky, the facets). The one red is `pal.red`; text in red only via `pal.key` (it falls back to ink when red does not read on paper).
- The ground reads `t + clock` and slides each layer at its own rate (`tokens.speed`, factors in `ground.js`): never reset or reverse it in a part. The sky does not slide.
- Every readable text sits on a carved slip (`carve`), sized to its words and set from the reading side; never on the landscape.
- Words enter with `arrive` (a short slide along the direction of travel); key words get a `knife` stroke under them in red.
- Joint: the near post only (`joint.js`, 0.45 s). Keep the post about half paper so the frame keeps its tone.
- Layers are cached per brand; build any new layer as a seamless tile in `build()`, never per frame.
