# التحقيق المرئي · Frame Forensics

**طابعه:** مكتب تحقيق بارد وهادئ. أرضية داكنة عليها شبكة نقاط قياس خافتة، وفوقها «أدلّة» مرسومة بلونيك: لقطة كاميرا ثابتة لشارع ليلي برقم وقتها محروق في زاويتها، وصفحة بسطر واحد مظلَّل، وخط بيانات يمشي عليه مؤشّر بساعته، وموجة صوت. الوقت حاضر داخل الصورة دائمًا: ساعة تعدّ في أعلى الكادر، وأرقام وقت عند كل دليل. الكلام يُرصَف كأنه تفريغ نصّي، كلمة بعد كلمة بحركة قصيرة دقيقة. وتحت المنطقة الآمنة شريط باهت من مصادر أخرى في الملف.

**يناسب:** المحاسبين والمدققين والمحامين، والشركات التي تريد أن تثبت شيئًا بالدليل (سعر لم يتغيّر، وعد تحقّق، رقم صحيح)، والإعلام والبحث وكل علامة جادّة وهادئة تقنع بالدقة لا بالصوت العالي.

**حركته المميِّزة:** خط التزامن. اللقطة تتجمّد على اللحظة الحاسمة، فتُرسم حلقة حول ما يهم، ثم يمتد خيط رفيع بلونك من الحلقة إلى مكان الكلمة المفتاحية التي تُظلَّل بشريط من لونك يُمسح من جهة القراءة. مصدران يشيران إلى اللحظة نفسها. وفي المقارنة يصير القديم إطارًا متقطّعًا خافتًا (لم يعد مؤكَّدًا) ويُشطب بخط رفيع، ويُغلق الجديد بأقواس زوايا. وفي الخاتمة تُسحب الأدلّة الأربعة بخيوط إلى عقدة واحدة فيها شعارك.

**ألوانك فيه:**
- الأغمق بين لونيك هو المكتب، والأفتح هو الكتابة والصورة. اللقطات والألواح كلها درجات بينهما.
- لون التمييز (`accent`) للعلامات فقط: الحلقة، وخيط التزامن، والتظليل، والمؤشّر، وأقواس التأكيد. وما يُكتب فوق التظليل يأخذ أوضح لونيك عليه.

**يتجنّب:** العناوين المتوسّطة كالشرائح، والحركة المرتدّة، والموسيقى التي تفرض الشعور، والمؤثرات الصاخبة، وتلوين اللقطات، والصناديق الفارغة «لا توجد لقطة»، وأكثر من نتيجة واحدة في التكوين الواحد.

## For Claude

- Desk = the darker of `colors.bg` / `colors.text`, ink = the lighter; the accent is for marks only (`P.mark` falls back to a lighter mix when the accent is too dark on the desk). Text on a highlight takes `P.onAccent`.
- One finding per layout. The line's evidence frame sits at `tokens.frame.top`; text sits under it on the plain desk, never on footage.
- Key runs (`runs()` in `look/motion.js`) get one accent band each via `highlight()`, wiped from the reading side; a multi-word key phrase is one band.
- Words arrive with `set()` (a short lift and a quick fade); things are drawn along their length (rings, leaders, rules, brackets). No bounce, no spin, no flash.
- Timecodes are decoration in the mono face through `code()`; they never carry a claim. A real number the viewer must read goes in `says`.
- The footage stand-in is `footage()` (built once) and `playFootage()`; freeze it by holding its play time, then push in slowly (`zoom`) so the hold stays alive.
- Hook: everything in `line.js` lands within 0.8 s of `at` (the freeze at `at + 0.35`, the leader by `at + 0.77`).
- Sound: `type` for transcription, `tick` for the playhead, `scratch` for the freeze or a source being struck, `click`/`toggle` when a mark closes. Keep it sparse and quiet.
