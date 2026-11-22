# بكسل بعمق · Depth Pixels

**طابعه:** مجسّم صغير لساحة بلدة في الليل، مصنوع من نقاط مربّعة كألعاب البكسل، لكنه مضاء كأنه حقيقي. نراه من فوق وبعيد، والعدسة لا تُوضّح إلا شريطًا في وسط الإطار وما فوقه وتحته ضبابي، فيبدو العالم كلعبة على طاولة. فوانيس تتنفّس ضوءًا دافئًا من لونك على حجارة باردة، وغبار يسبح في الضوء، ومسافر صغير بعباءة من لونك يقف قرب فانوس وظلّه ممدود بعيدًا عنه. الكلام على ألواح زجاج داكن بإطار معدني رفيع وزوايا معيّنة صغيرة، والحروف العربية بخطّك وتشكيلها سليم.

**يناسب:** المقاهي والمطاعم الليلية، والفنادق والضيافة، والسياحة والتراث، والألعاب والقصص، والعلامات التي تريد دفئًا وحنينًا وهدوءًا فاخرًا.

**حركته المميِّزة:** سرعتان معًا. الأشياء المرسومة بالبكسل (المسافر، والفوانيس، والأرقام المبنية من مكعّبات) تتغيّر رسمةً برسمة، أما الكاميرا والضوء والغبار والعدسة فتنساب نعومةً في كل لقطة. الرقم يُبنى من مكعّبات مضيئة تسقط عمودًا عمودًا، والبنود يُضاء لكل منها فانوس، وفي المقارنة ينطفئ فانوس القديم ويشتعل فانوس الجديد. وبين المشاهد تفقد العدسة تركيزها ثم تستعيده.

**ألوانك فيه:**
- لونك الداكن هو الليل والزجاج، ولونك الفاتح هو الكلام وأعلى الضوء.
- لون التمييز (`accent`) هو الضوء الدافئ نفسه: الفوانيس والنوافذ والتوهّج وعباءة المسافر، والكلمة المهمة في حبّة مضيئة منه.
- الحجارة والجدران والأسقف مزج خافت من لونك الداكن مع الفاتح أو مع لون التمييز.

**يتجنّب:** الأرضيات الفاتحة، والحروف المكسّرة بالبكسل، والكتابة على المجسّم دون لوح، والحركة المتقطّعة للكاميرا، والوميض.

## For Claude

- The model is built once per scene in `ground.js` as 300 x 560 texels (x4), with lamplight baked in four dithered steps; a blurred copy is made once. Per frame: blit sharp, overlay the blurred copy through the cached tilt mask, then sprites, `bloom()` glows (`'lighter'`), dust, vignette. Never do per-pixel work per frame.
- Two motion speeds: sprites, lanterns and block digits swap whole drawings; camera (`cam`, on `clock`), light (`flicker`), dust, focus and text glide (`out3` in, `in2` out).
- Reading text always sits on `plate()` (dark glass, metal rule): body in `P.l`, lead-ins and titles in `P.metal` on a name plate across the top edge, the key word in `keyPill()` with `P.onA`. Lead-ins wrap to two rows instead of shrinking under 44 px.
- Numbers are drawn as cubes (`cellsOf` + `cubes`) and reported with `kit.rec`; strings the block cut lacks fall back to `kit.number`.
- The ground is always the dark brand colour, whichever of `bg`/`text` that is.
