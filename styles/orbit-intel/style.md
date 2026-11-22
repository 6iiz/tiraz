# استخبارات الفضاء · Orbit Intel

**طابعه:** صورة قمر صناعي لمكانٍ من الأعلى تمامًا: نهرٌ يتعرّج بين حقول مرقّعة، وبلدة بشوارع وأسطح وظلال، وطرق طويلة تعبرها. الصورة كلها مُدرّجة إلى رماديّ المحلّل، وفوقها طبقة ثانية من الخطوط الرفيعة: لوحات تعليق داكنة شفّافة بحواف دقيقة، وشبكة تصويب، وخطوط قياس. والكاميرا تهبط نحو الأرض ببطء طوال الريل كله نزولًا واحدًا لا ينقطع عند الانتقال.

**يناسب:** الأخبار والتحقيقات والتحليل، والعقار والتطوير العمراني، واللوجستيات والتوصيل، والاستشارات والأمن، وكل علامة تريد أن تقول «رأينا الصورة كاملة، وهذا ما يهم فيها».

**حركته المميِّزة:** التصويب. شبكة التصويب تنطلق من هدفٍ على الأرض وتطير إلى الكلمة المهمة فتنغلق حولها، وتبقى مربوطة بمكانها على الأرض بخيط متقطّع. والعبارة المهمة تُصوَّب مرة واحدة كلها ولو كانت كلمتين. وفي الرقم يُرسم خط قياس على الأرض بين نقطتين والقراءة تعدّ معه، وفي القائمة تُثبَّت علامات المواقع على الأرض مع كل بند، وفي المقارنة يمرّ فاصلٌ على الصورة فيكشف «بعد»: حيًّا جديدًا تحدّده خطوط بلون علامتك.

**ألوانك فيه:**
- الصورة كلها مزيج بين اللون الأغمق والأفتح من لونيك، فتبقى رمادية هادئة مهما كانت ألوانك.
- اللون الأفتح للكلام وحواف اللوحات، والأغمق للوحات نفسها.
- لون التمييز (`accent`) لطبقة التحليل وحدها: شبكة التصويب، وخطوط القياس، والشطب، وحدود الجديد. ويُفتَّح نحو لونك الفاتح حين يُكتب به حتى يُقرأ.

**يتجنّب:** تلوين الصورة أو تجميلها، والتوهّج والواجهات المختلقة، والأرقام المزخرفة على الصورة، والكتابة على الصورة مباشرة بلا لوحة، وأكثر من تصويب واحد في الإطار.

## For Claude

- The picture is built once per page in `ground.js` (seeded plate + a "later" plate) and the camera descends on `t + clock` (`tokens.cam`: a halving of the view every `half` seconds). Never restart it per scene.
- All text sits on a caption plate (`plate()` + `plateP()`), clipped to its opening; words enter with `settle()` (≤ 0.75 s total, so a line at `at: -0.8` is whole at frame 0).
- One emphasis per key phrase: `lockOn()` on each run from `runs(layout(…))`, padded by about 0.4 of a word space so the box never touches a neighbour; the tether is drawn only when the phrase is on the block's last row.
- Ground targets are picked in screen space at the scene's start (`fromScreen`) and tracked with `toScreen`, so annotations stay pinned while the camera moves.
- No numbers or words on the imagery (scale bar has no figures). Lead-ins keep ≥ 44 px via `balanced()`.
- Sound: `swish` for plates, `type` under words, a short `whoosh` for the reticle's flight, `click` when it locks, `pop` (low) for site pins.
