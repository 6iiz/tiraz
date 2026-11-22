# كوميديا الفضاء · Space Sitcom

**طابعه:** حلقة من مسلسل كرتون للكبار عن كائنين فضائيين على كوكب ليلي. السماء أشرطة مسطّحة من لونك الداكن تميل نحو لون علامتك، وفيها كوكب بحلقة وقمر صغير ونجوم، وتحتها أرض متكتّلة بحفر ونباتات غريبة. كل شيء مرسوم بخط داكن سميك «يغلي»: يُعاد رسمه بثلاث نسخ مختلفة قليلًا تتبدّل اثنتي عشرة مرة في الثانية، فحتى الإطار الثابت حيّ. الألوان مسطّحة بلا تدرّج، ولكل شكل ظلّ واحد حادّ الحافة. البطلان تحت المشهد: طويل جامد الوجه بخوذة زجاجية وجفنين نصف مغمضين، وكائن صغير مستدير بعين واحدة ضخمة.

**يناسب:** التطبيقات والألعاب والشركات التقنية الشابة، وصنّاع المحتوى، والمطاعم والمقاهي ذات الروح الساخرة، وكل علامة تحب النكتة الجافة وتخاطب جمهورًا شابًا.

**حركته المميِّزة:** الحوار وردّة الفعل. الجملة تُقال من فقاعة كلام تنفتح من ذيلها، والكلمات تسقط فيها والطويل يتكلّم بوجه جامد. وحين تكتمل، تنطبع الكلمة المهمة على بقعة لزجة بلون علامتك بقفزة نابضية، فيصاب الصغير بالذهول: عينه تكبر وفمه ينفتح. ما يُكتب كعنوان صغير يُطبع على شريط شاشة داكن خلف مؤشّر يومض. والبوابة الدوّارة بلون علامتك (الشيء الوحيد الذي يتوهّج) هي التي تنقل بين المشاهد، وتقذف عناصر القائمة واحدًا واحدًا، وفي المقارنة يرفع الطويل مسدّس أشعة صغيرًا ويمحو القديم بلا كلمة، ثم تُسقط بوابة صغيرة الجديد مكانه.

**ألوانك فيه:**
- لونك الداكن هو الليل والخطوط، ولونك الفاتح هو فقاعات الكلام واللوحات والعيون.
- السماء والأرض والبدلة والكائن الصغير خلطات من ألوانك الثلاثة.
- لون التمييز للبوابة والبقعة تحت الكلمة المهمة والمؤشّر والمصابيح. وما يُكتب على البقعة يأخذ أوضح لونيك فوقها.

**يتجنّب:** التدرّجات والتوهّج على غير البوابة، والخط الرفيع أو الثابت الذي لا يغلي، والكلام فوق السماء مباشرة بلا فقاعة أو شريط، والوجوه المبتسمة اللطيفة، وأي شخصية أو أداة تشبه مسلسلًا معروفًا.

## For Claude

- Every outline goes through `shape` / `stroke` / `boilPath` in `look/motion.js` with the drawing number `k` (`ground.k(t)`), so it boils in three drawings at 12 per second. Never draw a plain static outline.
- Fills are flat; one hard shadow per form (`shadow` in `shape`). The only glow (flat translucent rings) is the portal's.
- Text lives on a speech bubble (`bubble`, light, the line itself), a terminal tag (`tag`, dark, for leads, titles and labels, typed word by word) or a light tag/plate. Never set text straight on the sky.
- The key word (`*…*`) sits on the accent `splat` (springy pop, the one overshoot of a line) in `P.onAccent`, and the blob does a take right after it. Neighbouring key words share one splat.
- The duo (`duo`) always stand on the ground below the safe area at `tokens.cast`; the tall one speaks lines, the blob speaks labels. They are our own designs: no spiky hair, no lab coat, no known show's faces.
- Joints are the portal (`joint.js`); parts have no exits of their own.
- Colours only from `palette`: dark = night and line (pressed a little toward neutral black), light = bubbles, accent = portal, splat, cursor, bulbs.
