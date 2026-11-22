# الأسلوب السويسري · Swiss

**طابعه:** تصميم طباعي صارم يتحرّك على شبكة. ورق فاتح، وحبر داكن، وستة أعمدة ظاهرة، ولون إشارة واحد فقط هو لون علامتك. كل شيء يصل على الإيقاع ويستقرّ في مكانه من الشبكة. لا شيء يرتدّ أو يتلاشى، فالكلمات تصعد من تحت سطرها وتغادر إلى الأعلى. وحين يُلغى شيء، يقطعه خط كالسكين ثم ينطوي على نفسه.

**يناسب:** الاستوديوهات، والشركات التقنية، والمكاتب الهندسية، وكل علامة تريد أن تبدو دقيقة وواثقة وهادئة. ويناسب الرسائل التي فيها نظام أو خطوات أو أرقام.

**حركته المميزة:** الاستثناء. النظام كله منضبط، إلا وحدة واحدة بلون علامتك تخرج عن الشبكة في الخاتمة بحركة مستقيمة غير منضبطة، ثم يُختم فيها شعارك.

**ألوانك فيه:**
- لونك الفاتح (`text`) هو الورق.
- لونك الداكن (`bg`) هو الحبر.
- لون التمييز (`accent`) لا يُستعمل لونًا للكتابة، بل كتلة خلف الكلمة المهمة، والكلمة فوقها بالحبر الداكن. ويُستعمل أيضًا في الوحدة التي تصير شعارك.
- الرماديات كلها مزيج من لونيك.

**يتجنّب:** التدرّجات، والظلال، والتوهّج، والجسيمات، والحركة المرتدّة، وأي لون ثانٍ للإشارة.

## For Claude

- One signal colour: `brand.colors.accent`, used as a fill (overprint ink on it), never as text colour on paper. Paper = `colors.text`, ink = `colors.bg`; greys are `mix(paper, ink, k)`.
- Only two timing curves: `E` (cubic-bezier .7,0,.2,1) when something clicks into place, and linear while a rule is being drawn. Nothing fades, nothing overshoots.
- Entrances: words rise out of a clip under their baseline (`arrive`), one per `tokens.dur.step`; exits rise out upward (`leave`); deletions use `knife`.
- Everything sits on the 6-column grid (`ground.cols`, `ground.colW`); text is flush to the reading side. Scale contrast: giant numerals next to small grey notes, mono face for technical labels.
- Timings are note values at 120 BPM (`tokens.beat` = 0.5 s, step = 1/16). Land arrivals on beats.
- The only unsnapped, linear move in a reel is the exception (the accent module in the ending). Don't add a second.
