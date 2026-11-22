# حكاية الرسم البياني · Chart Tale

**الطابع:** الريل كله رسم بياني واحد لا ينقطع. ورقة فاتحة بأليافها، وخطوط شبكة خفيفة، ومحور سفلي بعلاماته، وقلم رصاص حقيقي يرسم خطًّا واحدًا بحبر داكن وتحته مساحة مظلّلة بلون علامتك. الكاميرا تمشي مع القلم طوال الريل، فما رُسم ينساب إلى الخلف بنقاطه، والجديد يولد عند رأس القلم. الكلام ملاحظات تنبت من الخط نفسه: ساق رفيعة تصعد من النقطة التي رسمها القلم للتو، وفي أعلاها تُكتب الملاحظة. ليس لوحة رسوم بيانية داكنة بأعمدة، بل قصة على خطّ زمني واحد على الورق.

**لمن يناسب:** كل علامة عندها رحلة تحكيها بالأرقام: نمو متجر أو مقهى، ومشروع من أول يوم، والتقارير السنوية، والاستشارات والتعليم، والجمعيات التي تعرض أثرها، وأي رسالة فيها «من وين بلّشنا ولوين وصلنا».

**الحركة المميِّزة:** القلم الذي لا يتوقّف. الزمن يجري باتجاه القراءة، فعند العلامة العربية يمشي القلم إلى اليسار والماضي على اليمين. الكلمات تُكتب كتابة من جهة القراءة لا تطير، والعبارة المهمة تُحاط بدائرة يد واحدة بلون علامتك لا تُغلق تمامًا. الرقم يُقرأ من الخط: نقطة بلونك وخط قراءة متقطّع يعود عبر الرسم. القائمة محطّات مرقّمة يتركها القلم على الخط وتبتعد معه. والمقارنة نقطتان من الخط نفسه: القديمة تُشطب باليد، والجديدة يصعد إليها سهم الفرق. وفي الخاتمة يرفع القلم يده، وتنتفخ آخر نقطة فتصير قرصًا عليه شعارك.

**كيف يوزّع ألوان الزبون:**
- **الأفتح** من لونيك هو الورقة.
- **الأغمق** هو الحبر: الخط والمحور والكتابة وجسم القلم، ومنه الشبكة والرماديات.
- **لون التمييز** هو المساحة تحت الخط (مخفّفة جدًّا)، ودائرة اليد حول العبارة المهمة، والنقاط المهمة، والسهم، وممحاة القلم، وقرص الشعار. وتُكتب به العبارة المهمة إن كان مقروءًا على الورقة، وإلا بقيت بالحبر ودائرتها بلونك.

**يتجنّب:** القطع في الرسم البياني بين المشاهد، والأعمدة واللوحات الداكنة، والأرقام المخترعة على المحاور، والكلمات الطائرة، والتوهّج والظلال الثقيلة، وأي لون ليس من ألوان العلامة.

## For Claude

- One chart for the whole reel: `ground.js` draws it from the reel's time (`t + clock`), so it never cuts; the joint (`joint.js`) only swaps the notes with a soft sweep in the direction of time. Never draw a second chart in a part.
- Time runs in the reading direction: `ground.dir` is −1 for right-to-left brands (pencil at `penX` = 330, the past to the right). Use `ground.tip(t)`, `ground.point(wx, t)` and `ground.wxAt(time)` to pin notes to the line; never hard-code chart positions.
- The axes carry tick marks only, no numbers: every number on screen comes from `says`.
- Words are written on with `M.write` (a clip opening from the reading side; letters never move). Exits use `M.erase`. The key phrase gets one `M.loop` per run (several words = one loop) in `pal.line`; its text is `pal.keyText` (the accent only when it reads at 4.5:1 on the paper).
- The hook: with `at: -0.8` the stem, every word and the loop are complete by t = 0 (stagger fitted into 0.5 s).
- Leads, titles and labels use `minPx: 46` and wrap to two rows rather than shrink.
- Draw the pencil last (`ground.draw(ctx, t, { pen: false })`, then `ground.pen(ctx, t)`), so stems and notes never cover it.
- Sound: paper and pencil kinds: `rustle` for writing, `tick` for points and milestones, `scratch` for the struck old value, `click`/`ding` for a landed number or the new value.
