# داتا ملموسة · Tangible Data

**طابعه:** الأرقام هنا أشياء تُلمس. استوديو تصوير فاتح بخلفية متّصلة بلا زاوية، وعليه قاعدة من حجر داكن محفورة فيها علامات قياس صغيرة. كل قطعة تسقط من فوق بثقلها وتقف على ما تحتها بلا ارتداد: ألواح معدنية تتكدّس عمودًا عمودًا، وألواح أكبر تحمل الكلام، ومكعّب بلون علامتك يحمل شعارك. ضوء جانبي ناعم يرمي ظلالًا طويلة، وبقعة ضوء تتحرّك ببطء على الخلفية. لا محاور ولا خطوط رسم بياني: الكومة نفسها هي المقياس.

**يناسب:** العلامات التي عندها رقم تريد أن يُحسّ لا أن يُقرأ فقط: المتاجر التي تعدّ طلباتها، والمصانع والورش، والعقار والبناء، والمقاهي والمخابز التي تعدّ ما تخبزه، والتقارير السنوية والاستشارات التي تريد أن تبدو هادئة وموثوقة.

**حركته المميِّزة:** التجميع. الرقم لا يكبر ولا يتمدّد، بل يُبنى: قطعة فوق قطعة، والعدّاد يزيد واحدًا مع كل قطعة تهبط، وكل خامس قطعة أغمق بلون علامتك فتصير الكومة مسطرة نفسها. وحين تُقارَن قيمتان تُبنيان بالقطعة نفسها على القاعدة نفسها، فيُرى الفرق بالارتفاع.

**كيف يوزّع ألوانك:**
- الأفتح من لونيك هو الخلفية (ورق الاستوديو)، والأغمق هو الحبر والحجر.
- المعدن والألواح الفاتحة درجات ممزوجة من لونيك، بوجه علوي مضاء ووجه جانبي في الظل.
- لون التمييز خامةٌ لا طلاء نص: لوح بارز تحت العبارة المهمة، والقطعة المهمة في القائمة، والقيمة الجديدة، ومكعّب الشعار، وقطع المسطرة. والكتابة فوقه بالحبر أو بالفاتح حسب التباين.
- الظلال سوداء خفيفة الشفافية فقط.

**الأمانة:** القطعة تساوي وحدة واحدة فقط حين يكون الرقم عددًا صحيحًا من 1 إلى 40، وعندها يزيد العدّاد مع كل قطعة. وفي غير ذلك تمتلئ كومة ثابتة من عشرين قطعة مع العدّ ولا تدّعي وحدة. في المقارنة الرقمية الكومتان بالقطعة نفسها وأطولهما عشرون قطعة. ألواح القائمة متساوية لأنها ترتيب لا كمّيات. والكومة التي تُبنى تحت السطر تعدّ الوقت فقط ولا تحمل رقمًا.

**يتجنّب:** المحاور والشبكات والأعمدة المسطّحة، والأيقونات، والتوهّج والنيون، والخلفية الداكنة، والقطع التي تكبر أو تتمطّط بدل أن تُركَّب، والارتداد، وأي رقم لم يأتِ من كلامك.

## For Claude

- Ground = the lighter of `brand.colors.bg/text` (`palette()` in `look/motion.js` picks it), ink = the darker. Every material (`metal`, `pale`, `stone`, `acc`, `ruler`) is a mix of the brand colours; shadows are black at low alpha. Never hard-code a hue.
- Objects go through `box()` (fixed oblique view, depth recedes to the far side) with `shadow()` first; the stone `base()` is the floor every reading stands on. Build pieces in `create`, nothing per pixel per frame.
- Motion: pieces `fall(p, h)` (accelerating, dead stop, no bounce); words `setDown` (a few px from above, quick opacity); exits `lift`. One piece at a time: growth is assembly, never scaling.
- The key phrase gets one accent plaque per phrase (per row), from `keySpans()`; the words on it fall with it. A key item in a list is a whole accent slab.
- Honesty: one plate = one unit only for whole numbers 1..40; otherwise a fixed 20-plate stack that keeps time. Numeric compare uses the same plate for both stacks (max 20). Do not print derived numbers.
- Text sits on the plain sweep or on a solid face, never across a shadow edge; leads and labels wrap to two rows at ≥ 44 px rather than shrink (`balanced(…, { minPx: 44 })`).
- The hook: words and plaque have landed by `at + 0.72`, so with `at: -0.8` the first frame is whole.
- Joint: the camera crane in `joint.js` (from rises out, to rises in, a soft floor shadow band at the seam). Mark: a three-plate glyph and the handle below SAFE.
