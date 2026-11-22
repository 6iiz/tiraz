# لوح العمليات · Ops Wall

**طابعه:** لوح أبيض حقيقي في غرفة اجتماعات، بلونك الفاتح: ضوء نافذة يخفت عبره، ولمعة تنزلق ببطء على المينا، وآثار باهتة لشغل قديم مُسح، وإطار في أعلاه ورفّ أقلام في أسفله. الكلام يُكتب عليه بقلم الماركر كلمة كلمة بسرعة اليد، والبطاقات تُلصق عليه بثقل ويثبّتها مغناطيس، والأسهم والدوائر وخطوط القياس تُرسم على طولها. كأنك تشهد اجتماع تخطيط وهو يحدث.

**يناسب:** الخطط والمراحل والإطلاقات، والشركات الناشئة والاستشارات وإدارة المشاريع، والمطاعم والفروع التي تشرح توسّعها، وكل رسالة فيها «قرّرنا» أو «هكذا سنفعلها».

**حركته المميِّزة:** الحلقة والممحاة. الكلمة المهمة تُحاط بحلقة بقلم لون علامتك، لون القرار وحده. وما يُرفض لا يُشطب بل تمسحه الممحاة فيبقى شبحه باهتًا على اللوح. وبين المشاهد تتحرك الكاميرا على اللوح نفسه، فلا صفحات بل جدار واحد، ولا يُرى الجدار كاملًا إلا في الخاتمة حين تبتعد الكاميرا مرة واحدة.

**ألوانك فيه:**
- لونك الأفتح هو مينا اللوح، ولونك الأغمق هو قلم الجرافيت للكلام والأسطر.
- لون التمييز هو قلم القرار: الحلقات، والسهم إلى الجديد، والخط تحته، والمغناطيس المهم.
- مزيج لون التمييز مع الغامق هو قلم القياس: خطوط الأبعاد وبعض المغانط.
- البطاقات ورق أغمق من اللوح بدرجة خفيفة، والآثار الممسوحة والظلال شفيفة جدًا.

**يتجنّب:** العناوين في رأس الصفحة والنقاط المتوسطة كالشرائح، وقلب الصفحات، وأكثر من لون قرار واحد، وكتابة الحروف حرفًا حرفًا (الكلمة تُكشف كاملة بحركة اليد)، والميل الكبير، والكتابة فوق الآثار الممسوحة الكثيفة.

## For Claude

- Palette from `palette()` in `look/motion.js`: board = the lighter brand colour, graphite = the darker, chosen by brightness; `measure` = accent mixed with graphite. Accent is the decision only: loops, the arrow to the new value, its underline, one magnet.
- Writing is `write()` inside drawText's `each`, timed by `writeTimes()` (width / `tokens.write.speed` plus a lift per word). It uncovers whole words in the reading direction; never split letters.
- Cards land with `card()` (big shadow snapping short, `LAND` = out-sixth ease) and get a `magnet()` a beat later. Marks are `stroke()` along `loop()`/`line()`/`head()` points built once in `create`.
- Rejected values are wiped with `eraser()` and left as a ghost at about 0.1 opacity; do not strike them.
- The joint pans one continuous wall (no side frame in the ground, so edges meet). The ending is the only zoom: one eased pull-back, with all text written after it settles.
- Sound: `thump` when a card lands, `click` for magnets, soft `rustle` for marker writing, `swish` for the eraser and the accent loop, a short `whoosh` for the pan.
