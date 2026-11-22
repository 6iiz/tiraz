# خط واحد · Single Stroke

**طابعه:** ورقة دافئة وخط حبر واحد لا يرتفع عنها أبدًا. يدخل الخط من طرف الإطار، ويمرّ تحت الكلام فيُكتب الكلام كلما عبر تحته، ثم يتجوّل في الهامش السفلي بانحناءات متصلة كخط اليد، ويخرج من الطرف الآخر على الارتفاع نفسه. ومن هناك يكمل في المشهد التالي، فالريل كله خط واحد متصل من أول إطار إلى آخره. سُمك الخط يتنفّس: يرقّ في الامتداد السريع ويغلظ في الانعطاف البطيء، ويتبعه ظل خفيف لرأس القلم.

**يناسب:** الاستوديوهات والمصممين والمعماريين، والعلامات الهادئة الراقية: العطور والمجوهرات والأزياء والمقاهي المختصّة، والتعليم والاستشارات، وكل رسالة قصيرة واضحة تحتاج مساحة بيضاء.

**حركته المميِّزة:** الحلقة. حين يصل الخط تحت العبارة المهمة يصعد ويلتف حولها مرة واحدة بلون التمييز ثم يعود حبرًا ويكمل طريقه. هذه الحلقة هي المكان الوحيد الذي يظهر فيه اللون في كل مشهد. وفي الخاتمة، ولأول مرة، لا يخرج الخط: يلتف حول الشعار، ويكتب الاسم، ثم يتمهّل حتى يقف في منتصف الهامش بنقطة حبر.

**كيف يوزّع ألوان الزبون:**
- الأفتح من لونَي الزبون هو الورق (مدفّأ قليلًا بالحبر)، والأغمق هو الحبر، أيًّا كان لون الخلفية عنده.
- الجمل التمهيدية والعناوين الصغيرة رمادية مقروءة من مزيج الحبر بالورق.
- لون التمييز لمقطع واحد فقط من الخط: الحلقة حول العبارة المهمة. لا يُكتب به كلام ولا يملأ شيئًا.

**يتجنّب:** الكتل الملوّنة والتعبئة والظلال المرسومة، والخط الثاني أو تغيّر سماكة الخط كأسلوب، والقطع المفاجئ بين المشاهد، وكل ما يظهر دون أن يمرّ به الخط.

## For Claude

- One line per scene, built with `line(W, T, rtl)` in `motion.js`: `enter()`, `under(y, xa, xb, groups)` (runs under words and loops once around each key group in the accent), `tail()` (the slow garland in the lower margin), and the exit at the far edge at `tokens.edgeY`. Every scene's line must enter at the reading-side edge and leave at the far edge at that same height: that is what makes the joint (a pan) one continuous line.
- Words appear only when the nib passes: get the time with `crossing()` + `timeAt()`, reveal with `write()`. Never fade text in by itself.
- The head follows keyframes `[[t, arcLength], …]`; the run under the words is fast, the tail slow and ends at `d − tokens.joint`. In the opening scene (`at` < 0) the run under the words ends by −0.28 s so the hook is whole at frame 0.
- Accent only on the key loop (or the key underline in a list, the ring in the ending). One loop per key phrase: `keyGroups()` merges neighbouring starred words.
- Paper = lighter brand colour, ink = darker. Long lead-ins wrap at ≥ 44 px (`minPx: 44`).
- Sounds are soft: `rustle` while the line runs, `swish` for a loop, `tick` for a list bullet, a single `thump` for the final blot.
