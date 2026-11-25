# غرفة مصغّرة · Mini Diorama

**طابعه:** غرفة صغيرة مقطوعة كأنها مجسّم في صندوق: جداران (الخلفي يواجهنا، والجانبي يمتدّ على اليسار) فوق أرضية من البلاط، وحوافّ الجدران والأرضية المقطوعة مرسومة بخطّ فاتح فتبدو الغرفة قطعة واحدة معلّقة في لون علامتك. في مقدّمة الغرفة أثاث بسيط من أشكال أولية (كاونتر وآلة قهوة، طاولة مستديرة وكرسيّان، نبتة، رفّ تحت نافذة، ساعة على الجدار) وثلاثة أشخاص صغار: واحد يعمل خلف الكاونتر، وواحد يمشي أمام الغرفة، وواحد جالس يرفع كوبه بين حين وآخر. الكلام لافتات ولوحات معلّقة على الجدار الخلفي، كل لوحة بسلك على مسمار.

**يناسب:** المقاهي والمطاعم والمخابز، والمكاتب والعيادات والصالونات، وشركات الخدمات، وكل علامة لها مكان يدخله الناس وتريد أن تقول «تعال، هذا محلّنا». يناسب القوائم جدًّا (قائمة الطعام على الجدار) والرسائل الودودة القريبة. ولا يناسب الرسائل الضخمة الحادّة ولا الأرقام المالية الكبيرة.

**حركته المميِّزة:** اللوحة تُعلَّق. كل لافتة تكون مطويّة على مسمارها نحو العدسة، ثم تفلت فتسقط على الجدار بثقلها، تطرقه وترتدّ ارتدادتين صغيرتين وتهدأ. القوائم تسقط لوحة بعد لوحة على الإيقاع. القيمة القديمة يُلصق عليها شريط، ثم ينقطع أحد سلكيها فتبقى معلّقة مائلة، وتسقط الجديدة تحتها بلون التمييز. الكاميرا تدور حول الغرفة دورانًا خفيفًا مستمرًّا: الأثاث والجدار الجانبي يتحرّكان، واللافتات ثابتة مواجهة للعين. وبين المشاهد ينزل الشبّاك المعدني (الأباجور) ويرتفع على غرفة جديدة.

**كيف يوزّع ألوانك:**
- الغرفة كلها (الجدران والأرضية والأثاث) مبنية من لون الخلفية `bg` ومزيج خفيف منه نحو لون النص، فتكون غرفة فاتحة لعلامة فاتحة وغرفة داكنة لعلامة داكنة.
- اللافتات بلون النص `text`، والكلام عليها بلون الخلفية: عكس الجدار دائمًا، فتُقرأ في أي علامة.
- لون التمييز `accent` هو لوحة صغيرة خلف الكلمة المهمة، واللافتة الجديدة في المقارنة، والشعار المجسّم، ولمسات قليلة في الغرفة (كوب، شريط الكاونتر، أحد الأشخاص).
- حوافّ المجسّم المقطوعة والرماديات كلها مزيج من ألوانك.

**يتجنّب:** الكلام على الجدار بلا لوحة، والكلام المائل بزاوية كبيرة، والأثاث الذي يرتفع إلى منطقة القراءة، والإضاءة الدرامية والظلال الكثيفة على اللافتات، والدوران الكبير، وأكثر من لافتة تسقط في اللحظة نفسها.

## For Claude

- Everything 3D lives in `look/ground.js`: `create()` builds one room per part (shell with capped cut edges, furniture, three primitive people, a wall clock, one sun with a 2048 shadow map). One WebGL renderer is shared by every part of a reel.
- The camera is a shifted lens: the eye sits high and to the right and looks straight down -z, the frustum is solved so the back wall (z = 0) maps 1 unit to 1 frame pixel. Signs therefore stay square and undistorted; the 'orbit' (`camera.sway`, `camera.lift`) moves the eye, so the room turns while the signs hold still. Never yaw or pitch the camera: that tilts the text.
- Layout is in frame pixels: `R3.region` is the part of the safe area that lies on the back wall at every orbit pose; `R3.stack(heights, centre)` gives board centres (each board takes its wire `sign.hang` above it); `R3.sign({ cx, cy, wpx, hpx, paint, text })` builds a board, `R3.textPaint(fit, {...})` paints fitted text on it through `kit.drawText` (decor on the texture), key words on an accent plaque in `keyInk`.
- Text is a canvas texture at 2x on an unlit (`toneMapped: false`) front face, so colours are exactly the brand's. Board = `text`, words = `bg`; the room is built from `bg`. Keep that inversion: it is what makes every brand readable.
- `s.pose(t, t0)` runs the fall (`motion.js flap`, first knock at `FALL` = 0.17 s, settled before 0.8 s, so a hook at `at: -0.8` is whole on frame 0). `s.rec()` reports the board to the safe-area check every frame, after `R3.draw`.
- Furniture stays on the front half of the floor and below `SAFE.bottom` on screen; the clock is above `SAFE.top`. If you add props, keep them out of the reading band.
- Build once in `create()`; `draw()` only moves the camera, the signs, the people and the clock hands. Count repaints its board texture only when the shown value changes. No randomness except `hash()`.
