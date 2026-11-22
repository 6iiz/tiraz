# الفوسفور الأخضر · Green Phosphor

**طابعه:** شاشة طرفية قديمة بلون واحد يتوهّج على زجاج داكن. خطوط مسح دقيقة، وحافة منحنية تعتم نحو الأطراف، وإطار مرسوم بالحروف حول مساحة العمل، وشبكة خلايا خافتة يقف عليها كل شيء. الكلام يُكتب أمامك: مؤشّر مربّع يمشي على السطر، وكل كلمة تضيء كاملة لحظة يمرّ بها، أسطع قليلًا في أول لمعة ثم تستقر. الأرقام والشعار والقواطع مرسومة كلها بحروف وعلامات على الشبكة، تُختار بكثافة حبرها. أما الكلام العربي فيبقى كلمات كاملة متصلة بخطك، لا يُقطَّع حروفًا أبدًا.

**يناسب:** الشركات التقنية والبرمجيات، والأمن الرقمي، والألعاب، والاستوديوهات التي تحب الطابع القديم، وكل رسالة فيها أمر يُنفَّذ أو خطوة تُكتب أو رقم يُحسب.

**حركته المميزة:** الكتابة بالمؤشّر، والمسح بالرجوع. في المقارنة يُكتب القديم بعد علامة ناقص، ثم يرجع المؤشّر فوقه كلمة كلمة فيخبو ضوؤها ببطء الفوسفور ويبقى منها أثر محروق باهت، ثم يُكتب الجديد بعد علامة زائد بإضاءة معكوسة. والانتقال بين المشاهد إطفاء الأنبوب وتشغيله: تنضغط الصورة إلى خط مضيء ثم تنفتح منه الصورة التالية.

**ألوانك فيه:**
- لونك الأغمق هو زجاج الشاشة، مدفوعًا قليلًا نحو الأسود.
- لون التمييز هو الفوسفور نفسه: كل ما يضيء. وإذا لم يتوهّج بوضوح على الزجاج مِلنا به نحو لونك الفاتح حتى يُقرأ.
- لونك الفاتح هو حرارة الفوسفور: اللمعة الأولى للكلمة حين تُكتب تميل إليه.
- الكلمة المهمة بإضاءة معكوسة: كتلة فوسفور والكلمة محفورة فيها بلون الزجاج.
- الدرجات الخافتة (الإطار، الأرقام الجانبية، الشبكة) مزيج من الزجاج والفوسفور.

**يتجنّب:** مطر الحروف، والصور المحوّلة بمرشّح، والحركة والانزلاق، ولونًا ثانيًا للإشارة، وتقطيع الكلام العربي حروفًا.

## For Claude

- One phosphor: `palette(brand, tokens)` in `motion.js` gives `glass`, `phos` (the accent, lifted toward the light colour until it reaches `tone.need` contrast on the glass), `hot`, `soft` (≥ 4.5:1), `dim`, `faint`, `frame`. No other colour.
- Text goes through `screenText(kit, fitted, placement, pal, T, colour)`: it builds each word's bloom once and draws through `kit.drawText`, so Arabic stays shaped and whole. Light it with `level(i)` and `hot(i)`; key words (`*…*`) come out in inverse video.
- Words arrive only by typing: `typing(boxes, at, T, seed)` gives each word's moment; `cursor()` and `cursorX()` place the block cursor after the last typed word. Nothing slides or scales.
- Light leaves by afterglow: `decay(t, tOff, tokens.dur.tau)`. A deletion is the cursor backing over words, which decay to the `tone.burn` ghost.
- Pictures in characters (`sampler` + `drawCells`) are for numbers, the logo and decoration only. Never sample Arabic text into characters.
- The glass (scanlines, vignette, bezel, status row) is `mark.js`, over every frame. Keep the joint dark: it squeezes to a line, it never brightens the frame.
