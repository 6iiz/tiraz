# اللوح الأبيض · Marker Board

**الطابع.** لوح أبيض لامع طويل، عليه آثار باهتة لدروس قديمة لم تُمسح تمامًا، ولمعة ناعمة تعبر سطحه ببطء، وسكة ألمنيوم فوقه وتحته عليها قلمان مغلقان. قلم سبورة يطفو وحده بلا يد: يطير إلى اللوح، ويكتب كل كلمة بسرعة اليد، ويرتفع بين الكلمات فيكبر ظله، ثم يدور حول الكلمة المهمة بحلقة سريعة ويطير خارج اللوح. الخط بخط اليد المسطّر من جهة القراءة، والحبر فيه خطوط جفاف رفيعة كحبر القلم الحقيقي.

**لمن يناسب.** شرح «كيف يشتغل الشي»: الشركات التقنية والخدمات، والتدريب في الشركات، والوكالات، والعيادات، وكل علامة عندها خطوات أو طريقة عمل تريد أن تشرحها بوضوح ودفء.

**الحركة المميِّزة.** القلم الطائر والكاميرا المسافرة. القلم نفسه يظهر وهو يكتب ويرسم الحلقات والأسهم، وظله يخبرك متى يلامس اللوح ومتى يرتفع. وبين الأفكار لا يوجد قطع: الكاميرا تنتقل على طول اللوح باتجاه القراءة إلى المنطقة التالية، فيبدو الريل كله لوحًا واحدًا.

**كيف يوزّع ألوان الزبون.**
- اللون الأفتح من لونيك هو اللوح، واللون الأغمق هو القلم الأسود.
- لون التمييز هو القلم الملوّن: للكلمة المهمة والحلقة حولها والأسهم والمربعات. وإن كان فاتحًا لا يُقرأ على اللوح، يُغمَّق نحو القلم الأسود حتى يُقرأ.
- الحبر الأخف (للتمهيد والعناوين والقيمة القديمة) مزيج مضبوط من لونيك، وآثار الدروس القديمة والسكك مزيج خفيف منهما.

**يتجنّب.** اليد والذراع والمؤشر، والنص الذي يظهر كتلة واحدة أو ينزلق، والقطع الحاد بين المشاهد، والمسح بالممسحة (هذا للسبورة الداكنة)، وأكثر من قلم ملوّن واحد.

## For Claude

- Ground: the lighter brand colour is the board; ghosts, scuffs and rails are one cached layer per palette; the sheen band moves on `clock`. The board has no side edges because the joint pans along it.
- Every part builds a list of marker jobs (`wordJob`, `pathJob`, or a custom `{ s, e, at(p), color }`) from the same schedules that drive the drawing, and ends its frame with `drawPen(ctx, penAt(jobs, t, W, rtl), P, rtl)`. The marker must always be where ink is appearing; never draw ink without a job.
- Word positions come from `layout()` (the kit's own placing rule) so the marker can be sent to a word before it is drawn. Keep `align` the same in `layout()` and `drawText()`.
- Ink is a streaked pattern (`ink(ctx, colour, board)`); `P.ink` for statements, `P.soft` for leads, labels and the old value, `P.accent` for the key word, rings, boxes and arrows.
- Emphasis grammar: ring (key word), box (number), arrow (list bullet, number to label, old to new), straight strike (old value). Old values stay on the board.
- Timings are fixed windows from `tokens.write` so `sound.json` cues stay on their events.
