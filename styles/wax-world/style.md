# عالم الشمع · Wax World

**الطابع:** عالم ألعاب صغير وقت الغروب، مبني من مجسّمات حقيقية لها عمق وضوء وظل، لكن كل شيء فيه مرسوم بأقلام الشمع. السماء بلونك الداكن وتتوهّج عند الأفق بخربشات من لون علامتك، وقمر من الشمع في الزاوية هو مصدر الضوء. تحت الأفق أرضية تمتد بخطوط منظور، وعليها مكعّبات وكرات وأشجار مخروطية تلقي ظلالها. والكلمات نفسها مجسّمات: كل كلمة كتلة شمع لها وجه مضاء وجوانب مظلّلة بتهشير كثيف، والتهشير ثابت على الجسم يتحرّك معه.

**لمن يناسب:** الألعاب ومتاجر الأطفال، والمحامص والمقاهي التي تحب الطابع المصنوع باليد، والعقار والعمارة والتصميم الداخلي حين تريد دفئًا لا برودة الرندر، والتطبيقات والخدمات التي تشرح خطوات تُبنى فوق بعضها.

**الحركة المميِّزة:** السقوط والهبوط. الكلمات والكتل تسقط من فوق واحدة واحدة، تهبط بانضغاطة صغيرة وتستقر، وظلها يظهر على الأرض تحتها. والعالم كله يُرسم من جديد اثنتي عشرة مرة في الثانية، فكل حركة متقطّعة قليلًا كأنها رسوم يدوية، والكاميرا تتمايل ببطء فينزلق القريب أمام البعيد. وحين يُستبدل شيء، تُرمى عليه كرة شمع فتتطاير كلماته وتسقط خارج الإطار.

**كيف يوزّع ألوان الزبون:**
- لونك الداكن هو السماء والليل، ولونك الفاتح هو شمع الوجوه المضاءة والقمر.
- لون التمييز هو كتلة الكلمة المهمة، والمكعّب الذي يحمل شعارك، وتوهّج الأفق. وإن كان قريبًا من الداكن يُفتَّح بالفاتح حتى يُقرأ.
- الجوانب المظلّلة والأرضية والظلال مزيج من لونيك.

**يتجنّب:** الأشكال المسطّحة بلا عمق، والتدرّجات الناعمة كظلال الرندر، والحركة الانسيابية تمامًا (كل شيء على اثنتي عشرة رسمة في الثانية)، والتوهّج الرقمي، والكلام بلا جسم.

## For Claude

- Every solid is a sprite made once with `solid()` in `motion.js` (silhouette stacked `D` px along `DIR` in the side colours, hatched, then the face in firm wax). Words: `solidText()` gives one sprite per word; measure rows with `rowsOf()` and let `words()` draw and `kit.rec` them, since the text is drawn into sprites at create time.
- Colour sets come from `sets(P)`: `plain` (lighter brand colour), `key` (accent, lightened when it is too dark on the night), `dim` (leads, titles, old values). Words on a slab face are written in `P.night`.
- Time is stepped: use `ground.step(t)` for every animation and `ground.cam(t)` for the sway; content sits at depth 0.3 (`dx = -cam * 0.3`), its floor shadows at 0.48.
- Arrivals are `drop()` (gravity, a small squash) one word or slab at a time; an opening line with a negative `at` compresses its timing so it has landed by frame 0. Replacing a value is a thrown ball and tumbling words, not a fade.
- The light is fixed in the upper right (the moon); never draw a highlight or shadow that disagrees with `DIR`.
- The joint trucks the camera sideways in seven steps; parts do not animate out.
