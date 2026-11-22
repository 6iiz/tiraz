# إطلاق منتج غامق (keynote)

## الطابع

مسرح شبه أسود كأنه لحظة إطلاق منتج: شبكة خطوط شعرية خافتة تختفي نحو الأطراف، وضوء مسرح ناعم يتحرك ببطء شديد، ولوحات وبطاقات مرسومة كواجهات التطبيقات بزوايا مستديرة وحدود رفيعة بعرض بكسل واحد وثلاث درجات من السطوح. كل شيء يستقر في مكانه بدقة، بلا ارتداد، والضوء هو الذي يكشف الأشياء: شريط ضوء يعبر المشهد من جهة القراءة فيضيء ما يمر عليه. المشهد هادئ وواثق، والمساحة الفارغة جزء من الفخامة.

## يناسب

التطبيقات والمنتجات الرقمية والتقنية، والإطلاقات والإعلانات عن ميزة جديدة، والأرقام التي تستحق لحظتها الخاصة (نمو، سرعة، عدد مستخدمين)، والعلامات التي تريد أن تبدو فاخرة ومعاصرة.

## الحركة المميزة

لحظة الرقم العملاق: رقم واحد يملأ المسرح بتدرج من لون التمييز، تحته بركة من ضوئه الخاص، يصعد بسرعة ثم يستقر على قيمته تمامًا، ويمتلئ تحته خط رفيع كشريط تقدم. والانتقال بين المشاهد هو شريط الضوء نفسه يعبر الشاشة كلها.

## كيف يستعمل ألوانك

- **اللون الداكن** هو المسرح، و**الفاتح** هو الضوء والنص؛ وتُشتق منهما ثلاث درجات للسطوح (لوحة، صف، شريحة).
- **لون التمييز** محجوز لعنصر واحد هو الأهم في كل مشهد: الكلمة المفتاحية، أو الرقم العملاق، أو البند المميز، أو القيمة الجديدة، أو بلاطة الشعار في الختام. ويُكتب به النص فقط حيث يُقرأ بنسبة تباين ٤٫٥:١ على السطح الذي تحته، وإلا بقي النص فاتحًا وظهر التمييز في الحافة.

## ما يتجنّبه

الألوان الكثيرة، والزخارف، والحركة المرنة أو المرتدة، والانتقالات الوامضة، وتمييز أكثر من شيء واحد في المشهد.

---

## For Claude

- One curve does the snapping: `E` (exponential ease-out) from `motion.js`; `S` only for leaving and for the sweep. `arrive`/`leave` fade and lift a word by a third of its size; no overshoot anywhere.
- Panels are `card(ctx, x, y, w, h, r, fill, border, p)` on `pal.s1`, `pal.s2`, `pal.s3` with `pal.border` (1 px). Radii come from `tokens.radius`. The light passing over a panel is `sheen(...)`; across the whole stage it is `beam(...)`; a word lights with `lit(...)` + `glowOf(...)`.
- Colours come only from `palette(brand, tokens)` (ground exposes it as `ground.pal`). For text on a surface use `pal.keyOn(surface)` for key words, never the raw accent. One accent element per scene.
- Pools of light (`pool(colour, w, h, a)`) are built once in `create()`; draw them with drawImage only.
- Layouts are centred for statements and the number, flush to the reading side for lists and comparisons. Leave the stage mostly empty.
