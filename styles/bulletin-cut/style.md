# تقرير إخباري · Bulletin Cut

**طابعه:** نشرة أخبار تلفزيونية مبنية من رسومات فقط. جدار استوديو فاتح عليه خريطة من النقاط تنزلق ببطء، وفوقه شاشة صورة مؤطّرة بحافة من لونك تعرض لقطة مرسومة تقوم مقام التصوير (أفق مدينة ليلًا، أو خريطة يُرسم عليها مسار، أو شارع بأضواء سيارات)، وتحتها الشريط السفلي: لسان صغير بلونك للتصنيف، وشريط داكن يحمل العنوان وفي طرفه شعارك. الأرقام تقلب على لوحة كلوحات البورصة، والقوائم جدول فقرات النشرة، والمقارنة لوحة سوق فيها صفّ نازل وصفّ صاعد.

**يناسب:** الإعلانات التي تُروى كخبر: افتتاح فرع، أو رقم تحقّق، أو تغيير في الخدمة، أو جدول فعاليات. ويناسب الشركات والمؤسسات والمتاجر التي تريد أن تبدو جادّة وموثوقة ومنظّمة، والحسابات التي تقدّم «نشرة» أسبوعية.

**حركته المميِّزة:** قلبة الشريط. العنوان لا يصعد كلمة كلمة، بل ينقلب كتلة واحدة على مفصل في حافته السفلى كأن الشريط أسطوانة تدور، ويغادر منطويًا في حافته العليا. وبين القصص تعبر «الشارة»: لوح مائل بلونك يقطع الإطار ووراءه القصة التالية على الهواء.

**ألوانك فيه:**
- لونك الأفتح هو جدار الاستوديو، ولونك الأغمق هو الشاشة والبطاقات والشريط، والكلام عليها بلونك الأفتح.
- لون التمييز هو لون القناة: اللسان، والشارة، وحافة الشاشة، وخط الشريط، ورقعة الكلمة المهمة. وما يُكتب عليه يُختار تلقائيًا من لونيك الآخرين بحسب أيّهما أوضح.
- اللقطات المرسومة كلها درجات بين لونيك الأغمق والأفتح، مع لمسات قليلة من لون التمييز.

**يتجنّب:** شريط الأخبار المتحرّك أسفل الشاشة، والمذيع والاستوديو الافتراضي، والنص فوق اللقطة مباشرة (كل كلام على بطاقة أو شريط مصمت)، والارتداد، والوميض الأبيض بين القصص.

## For Claude

- Palette from `motion.js palette()`: paper = the lighter brand colour (studio wall), ink = the darker (screen, cards, strap), accent = channel colour; text on accent is `P.onAccent`. Never write on the moving picture: words sit on the strap, the tab or an ink card.
- Layout is fixed so the package reads as one system: picture panel `tokens.panel` (y 290–830) with an 8 px accent top edge; tab at `tokens.tab.y`; strap from `tokens.strap.y`, logo block at its far end. Build the lower third with `strap()`; don't redraw it by hand.
- Motion: `flip()` for every block of words (unfold from the lower edge with `Q`, fold into the top edge with `I`); tabs and chips wipe from the reading side; the joint is the sting (`joint.js`, 0.4 s). No per-word rises, no fades as the main move, no overshoot.
- Key word: an accent chip wiped in behind it, text in `P.onAccent`. One per line.
- Numbers flip on the split-flap window (`count.js`), 14 flaps slowing to the value; lists are the rundown (active row on an accent index block, passed rows dimmed); compare is the two-row board (struck old row, accent new row).
- Picture shots are procedural (`picture(P, T, W, kind)`: 0 city, 1 map, 2 street), built once in `create`; a line picks its shot from `clock`. Keep the picture moving slowly so long holds stay alive.
- The bug (`mark.js`) is the accent plate with the logo, top corner on the far side, outside SAFE.
