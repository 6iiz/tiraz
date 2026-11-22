# طيران الكروت · Card Glide

**طابعه:** طاولة خشب فاتحة في ضوء شمس منخفضة دافئة، وعليها ورقة منقّطة كبيرة، وكروت ورقية بسماكة ظاهرة مطبوعة عليها واجهات بسيطة: رأس صغير فيه شعارك، وأزرار مطبوعة في أسفلها. كل شيء له ظل طويل ناعم نحو الأسفل واليمين. الكلام مطبوع على الكروت بالحبر، فلا يُكتب أمام العين بل يكون حاضرًا حين تصل الكاميرا. وعلى الكروت تعيش لعبة صغيرة من مكعّبات بكسل بارزة، بلون علامتك، تقفز من مكان إلى مكان على الإيقاع. وحول الطاولة أشياء مكتب عادية: قلم، وورقة لاصقة، وكوب.

**يناسب:** التطبيقات والخدمات الرقمية التي تريد أن تبدو ودودة لا باردة، والأدوات والمنصات، والتعليم، والمتاجر الإلكترونية الصغيرة، وكل علامة تشرح خطوات بلطف وفيها شيء من اللعب.

**حركته المميِّزة:** لقطة واحدة بلا قطع. الكاميرا تنزلق إلى كل كرت وتستقر عليه، ثم تنطلق بسرعة إلى الكرت التالي على الطاولة نفسها، وفي الخاتمة ترتفع وتبتعد فترى الطاولة كلها والكروت حول كرت شعارك. واللعبة الصغيرة تنتقل من ملصق مسطّح إلى مجسّم، وتقفز بانضغاطة عند الهبوط، فتترك على الورق حلقة رفيعة بلونك.

**ألوانك فيه:**
- الأفتح من لونيك هو الورق وضوء الشمس، والأغمق هو الحبر والظل؛ والخشب مزيج منهما، فالأسلوب يعمل مع علامة فاتحة أو داكنة.
- لون التمييز هو اللعبة، والرقاقة التي تبرز من الكرت تحت الكلمة المهمة، ومكعّب البيانات الأخير، وكرت «الجديد» في المقارنة. ويُكتب عليه بأوضح لونيك فوقه.
- الرماديات وأشياء المكتب مزائج من ألوانك الثلاثة.

**يتجنّب:** شاشات أو شعارات تطبيقات حقيقية، والمؤشّر والتوهّج، والكلام الذي يُكتب حرفًا حرفًا، والقطع الحادّ بين المشاهد، وأن تقف اللعبة فوق الكلام.

## For Claude

- Palette from `tones(brand, tokens)` in `motion.js`: the lighter brand colour is paper (`P.paper`), the darker is ink and shadow (`P.ink`, `P.shade(a)`); text on accent uses `P.onAccent`. No other hues.
- Text is printed on a card (`card`, `printHead`, `printFoot`) and is there whole when the scene opens: never type or reveal words. What moves is the camera (`camera(...)` around everything, ground included), the voxel toy (`toy`, `track`, `drawToy`), and what pops out of a card (`chip`, cubes).
- Key words: one accent chip per key phrase per row (`keySpans` joins adjacent key words), its words lifted with it in `P.onAccent`.
- The toy only stands on a card's top edge, a stack, or the desk lane beside a list; it never covers text. Hops land on eighths of `tokens.beat`; each landing gets a `ring` and a sound.
- Scenes join with `joint.js` only (the whip of the one take); the ending is the pull-back. Keep the camera's arrival a zoom/drop, never a sideways offset, so text stays inside SAFE during joints.
- Lead-ins and labels wrap to a second row at ≥ 44 px (`minPx: 44`) rather than shrink.
