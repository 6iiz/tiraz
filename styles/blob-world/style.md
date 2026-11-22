# عالم الكرات · Blob World

**طابعه:** لوح ورقي مطبوع عليه شبكة ناعمة، موضوع على طاولة ونراه من فوق. يعيش عليه جمهور من كائنات صغيرة مدوّرة ناعمة الملمس، لكل واحد عينان لامعتان وخدّان ونتفة شعر ملتفّة. لا تمشي أبدًا: تقفز، تنضغط قبل القفزة وتتمطّط في الهواء وتنبسط حين تهبط، وظلّها يصغر كلما ارتفعت. الكلام مطبوع على اللوح نفسه كلمةً بعد كلمة، والكائنات تتصرّف حوله ولا تقف فوقه.

**يناسب:** التطبيقات والخدمات التي تتكلّم عن ناس وأعداد (زبائن، أعضاء، طلبات)، والمقاهي والمتاجر الودودة، والتعليم والأطفال، والجمعيات، وكل علامة تريد أن تشرح شيئًا بدفء وخفّة دم.

**حركته المميّزة:** الكائن الواحد هو الفرد الواحد. في العدّ تقفز الكائنات من أسفل اللوح وتصطفّ، والرقم يعدّها وهي تهبط. في القائمة لكل بند كائن يقفز على سطره ثم يُطبع البند بجانبه. وفي المقارنة يقف الجمهور تحت القديم، ثم يُشطب، فيقفز الجمهور كلّه إلى الجديد. وفي الخاتمة تتحلّق الكائنات حول شعارك وتبتسم.

**ألوانك فيه:**
- لونك الأفتح هو ورق اللوح، والطاولة حوله درجة أغمق منه، والشبكة خطوط خفيفة من مزيج لونيك.
- الكائنات كلها من لون التمييز بأربع درجات (أفتح وأغمق)، وعيونها بلونك الأغمق.
- العبارة المهمة مطبوعة على شريط واحد بلون التمييز، ويجلس عليه كائنان إن كان فوقه متّسع.

**يتجنّب:** الوجوه المخيفة أو الحزينة، والكائنات فوق الكلام، والحركة الانسيابية بلا قفز، والرسوم البيانية العائمة، وأي لون من خارج هويتك.

## For Claude

- Colours: paper = lighter of `bg`/`text` (decided by luminance in `palette()`), ink = darker; Pip bodies are four tones of `accent`. Text on the key tape uses whichever of paper/ink contrasts more with the accent.
- A Pip is a sprite built once in `ground.js`; its movement is a `Plan` of hops and pauses made in `create()` from a seed (`wander`, `hop`). `state(plan, t)` gives the pose; never keep state between frames.
- Pips never stand on words. Parts give them patches of the board away from the text; perchers sit on the key tape only where nothing is printed above (checked with `boxes()`), and the line opens extra room above a first-row tape.
- Counts are honest: up to 21 Pips, one per unit when the value is small; otherwise each stands for an equal share and the last landing brings the exact value.
- Text is stamped (`printText`): a quick press from 106 % with its ink coming up, word by word; the opening line is compressed so it is whole by frame 0. Lead-ins wrap to two rows (min 90 % of size) rather than shrink.
- One key phrase = one tape (`keyRuns`); fit keyed text with `maxW` minus `keyRoom(size)`.
