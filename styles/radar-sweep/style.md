# مسح الرادار · Radar Sweep

**طابعه:** وثائقي ليلي على شاشة رادار. غرفة مظلمة فيها دوائر مسافة رفيعة حول مركز واحد، وحلقة اتجاهات بعلامات دقيقة، وخطوط متقاطعة باهتة، وذراع مسح يدور ببطء وخلفه إسفين ضوء يخبو. نقاط صغيرة تتوهّج حين يمرّ عليها الذراع ثم تبرد حتى يعود. كل ما في الصورة بارد، مزيج من لونيك الداكن والفاتح، أما لون علامتك فمحجوز للهدف وحده: الشيء الذي نبحث عنه. والكلام يُقرأ على شريط معتم بحواف ناعمة يهدّئ الشاشة خلفه، بلا صناديق.

**يناسب:** الأمن والاستخبارات التجارية، والبحث والتحليل، والطيران والملاحة والشحن البحري، والتوظيف والبحث عن المواهب، والتسويق الذي يقول «نجد لك جمهورك»، وكل وثائقي هادئ جاد.

**حركته المميِّزة:** النبضة والعثور. لا شيء يوضع في مكانه؛ كل شيء يُكتشف. تخرج حلقة رفيعة من مركز الشاشة وتتّسع، وكل كلمة لا توجد إلا لحظة تصلها الحلقة، فتظهر كارتداد ساطع ثم تهدأ إلى صدى ثابت. والعبارة المهمة هي الهدف الوحيد الدافئ: تُكتب بلونك وتنغلق عليها زوايا القفل. في المقارنة يُفقد أثر القديم: ينفتح قفله ويخبو ويمرّ فيه خط متقطّع، ثم تجد نبضة ثانية الجديد. وبين المشاهد يدور الذراع دورة سريعة كاملة، وما يمسحه يصير المشهد التالي.

**كيف يوزّع ألوانك:**
- الأغمق من لونيك (`bg` أو `text`) هو ظلام الغرفة.
- الدوائر والذراع والأصداء والكلام مزج متدرّج بين الأغمق والأفتح.
- لون التمييز (`accent`) للهدف فقط: العبارة المهمة، والقفل، وحلقة المدى في العدّ، وخط الاتجاه في الخاتمة. وإن كان لونك لا يُقرأ كتابةً على الظلام، يُفتَّح بمزجه بلونك الفاتح حتى يُقرأ، ويبقى القفل بلونك الأصلي.

**يتجنّب:** الأخضر الفسفوري الجاهز، والخرائط وصور الأقمار، والأرقام المختلقة على الشاشة (حلقة الاتجاهات علامات بلا أرقام)، والكتابة مباشرة فوق الدوائر، ولونًا دافئًا ثانيًا، والارتداد والوميض.

## For Claude

- Cold everything (`palette()` in `look/motion.js`: scope, ring, ringHi, echo, soft, lost = mixes of dark/light); the accent appears only on the target: key phrase text (`pal.target`: the accent, or the accent lifted toward the light colour until it reads at 4.5:1), `lock`, the count's range ring, the ending's bearing line.
- Entrances are pings: `pingR`/`ret` give each word its hit time from its distance to the scope centre (`wordCentres`); draw words through `echo()` so they flare and settle. Never slide or fade text in.
- Text sits on the ground's quiet band (`ground.draw(ctx, t, [{ y0, y1 }])`), a feathered dark band, not a box. Keep text inside it.
- One lock per run of key words (`keyRuns`), so a multi-word key phrase gets one lock.
- The hook (`at < 0`) raises the ping speed so every word is found and the lock closed before the first frame.
- The sweep angle is a function of `t + clock` (period in `tokens.scope.period`), so the arm never jumps at a cut; the joint is one fast turn around the same centre (`tokens.scope.cy`).
- The static scope is drawn once per scene into a canvas; per frame only the wedge (one conic gradient), the arm and nine contacts are drawn.
