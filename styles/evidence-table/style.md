# طاولة الأدلة · Evidence Table

**طابعه:** طاولة زجاج مضاءة من تحت، بلونك الفاتح، وعليها قطع أرشيف مرسومة كلها بالكود: شرائط أفلام سالبة بثقوبها، وإطارات شرائح، وبطاقات فهرسة مثقوبة، ومسطرة قياس. كل شيء يُسحب على الزجاج ويستقر بهدوء، وظلّه يضيق وهو يلامس السطح. هادئ ودقيق ونظيف، بلا تعتيق ولا فلتر قديم.

**يناسب:** العلامات التي عندها قصة أو تاريخ أو أرقام تريد أن تثبتها: المحامص والمخابز العريقة، والمتاحف والأرشيفات، والصحافة الاستقصائية، والاستشارات والتدقيق، وكل رسالة فيها «هذا هو الدليل».

**حركته المميِّزة:** العدسة. عدسة مكبّرة تنزل من فوق وظلّها كبير وناعم، ثم تستقر على الكلمة المهمة. وداخل الزجاج يظهر الشيء مكبّرًا، وقد صار السالب موجبًا: حبر داكن على ضوء، وتحته خط قراءة بلون علامتك. وفي الأرقام يُحمَّض الإطار نفسه: خط ضوء يعبره فيقلبه من سالب إلى موجب.

**ألوانك فيه:**
- لونك الأفتح هو زجاج الطاولة المضيء، ولونك الأغمق هو الحبر وقاعدة الفيلم السالب.
- الفيلم السالب يحمل الكلام بلونك الفاتح، والبطاقات ورق أغمق من الزجاج بدرجة خفيفة يحمل الكلام بلونك الغامق.
- لون التمييز علامة قراءة فقط: حلقة رفيعة داخل العدسة، وخط تحت الكلمة المكبّرة، وسنّ صغيرة على حافة الفيلم، وشطب بقلم الشمع، وزوايا القياس حول الرقم.
- الرماديات كلها مزيج من لونيك، والظلال أسود شفيف جدًا.

**يتجنّب:** تعتيق الصور واصفرارها، والخدوش والغبار، والميلان الكبير، والتوهّج، وأكثر من عدسة واحدة في المشهد، والكتابة فوق الأشياء المتناثرة على أطراف الطاولة.

## For Claude

- Palette from `palette()` in `look/motion.js`: table = the lighter brand colour, ink = the darker, chosen by brightness, so a light-ground or dark-ground brand both work. Never write text on the ground's loose objects (film across the top, mounts and rule at the foot): they live outside SAFE.
- Text sits on objects: negative film (`film()`, light text), catalogue cards (`card()`, ink text) or the bare table. Objects slide in from the reading side with `slide()` (ease out cubic) and leave the other way (ease in); words never fly alone.
- The loupe (`loupe()`) is the one hero move: once per scene, resting on the key word (or the logo). What it shows inside is drawn again, magnified about the point under the glass, in its positive form, with `decor: true` so the magnified copy is not measured. Leave room around its resting place: parts move neighbours away so the glass covers no other text.
- The accent is a mark, never body text: the ring, the reading underline (`P.mark` falls back to ink when the accent does not show on the positive base), the edge notch, the grease-pencil strike, the corner brackets.
- The count develops: negative while counting, a light line crosses it on landing, positive after. Keep that order.
- Sound: paper `rustle` for every slide, `click` when the loupe lands, `tick` for cards and counter steps, `toggle` for the development, `scratch` for the grease pencil.
