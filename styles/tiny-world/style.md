# العالم الصغير · Tiny World

**الطابع.** مدينة كاملة مصوّرة من فوق بعدسة مائلة: شريط واحد فقط من الصورة حادّ، وما فوقه وما تحته يذوب في الضباب، فتبدو المدينة كأنها مجسّم صغير على طاولة. أسطح بيوت بجدرانها الجنوبية ونوافذها وظلالها، وشوارع بخطوطها وممرّات المشاة، وحدائق بأشجار مدوّرة، وسيارات وناس صغار يتحرّكون بتقطّع التصوير المتسارع كأنهم ألعاب بزنبرك، وظلال غيوم ناعمة تعبر فوق كل شيء. الكلام مكتوب على سطح بناية في الشريط الحادّ، والعبارة المهمة على قماشة مدهونة بلون تمييزك.

**لمن يناسب.** المطاعم والمقاهي ذات الحيّ، والتوصيل والنقل، والعقار والمجمّعات، والبلديات والفعاليات، والسياحة والفنادق، وكل علامة تحكي عن مكان أو عن ناس كثيرين أو عن حركة يومية في المدينة. يناسب الأرقام (عدد الزبائن، عدد الطلبات) والقوائم (محطات، فروع). ولا يناسب الرسائل التقنية المجرّدة ولا العلامات التي تريد هدوءًا تامًّا بلا حركة.

**الحركة المميِّزة.** التصوير المتسارع. كل ما يعيش في المدينة يتحرّك بتقطّع، اثنتي عشرة صورة في الثانية: السيارات والناس، والرقم وهو يعدّ، والسطح وهو يرتفع من الشارع على أربع دفعات. الكلمة توضع على السطح كقطعة مجسّم: تظهر أكبر قليلًا لصورة أو صورتين ثم تستقرّ. ووحده الضوء والكاميرا ينسابان بنعومة: ظلال الغيوم، وانجراف الكاميرا البطيء فوق المدينة. وبين المشاهد تميل الكاميرا إلى زاوية أخرى من المجسّم: المشهد القديم يصعد ويخرج من البؤرة، والجديد يأتي من تحت ويتّضح.

**كيف يستعمل ألوانك.**
- **اللون الأفتح** بين لونيك هو سطح البناية الذي يُكتب عليه، وأسطح البيوت الفاتحة.
- **اللون الأغمق** هو الحبر، والإسفلت، والجدران المظلّلة.
- **لون التمييز** يدخل في الأسطح والأشجار والسيارات ممزوجًا، ويُستعمل صافيًا في قماشة الكلمة المهمة، وشريط العدّ، ومهبط الشعار.
- النص على القماشة بلون الحبر أو الفاتح، أيّهما أوضح عليها.

**ما يتجنّبه.** المنظر من مستوى الشارع، والصورة الحادّة كلها، والحركة الناعمة للسيارات والناس، والكتابة مباشرة فوق المدينة بلا سطح تحتها، والمعالم والشعارات الحقيقية.

---

## For Claude

- The town is built once per page (`buildCity`, cached) from brand mixes only; per frame the ground lays the movers on it, blurs a small copy (`lens.down`, `lens.blur`) and masks the sharp copy into the band the part asks for (`ground.draw(ctx, t, { y, h })`). Always pass a band centred on the part's roof.
- Everything that lives in the world moves on the time-lapse clock (`lapse(t)`, 12 fps): cars, people, counts, roofs rising (`slab`), words set down (`setDown`). Only cloud shadows, the camera drift and the joint are smooth.
- Text never sits on the town directly: it sits on a rooftop `slab` (paper colour, wall, cast shadow) inside the sharp band.
- A key phrase (`*…*`) gets exactly one `tarp` per run per row (`keyRuns`), unrolled from the reading side in steps; the key text is `pal.onAccent`.
- Lead-ins and labels wrap to two rows (minPx ≥ 44) rather than shrink; the hook's roof and words are complete by `at + 0.8`.
- Shadows are neutral black at low alpha; no other colour is hard-coded.
