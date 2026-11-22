# الترتيبات · Arrangements

الترتيب هو هيكل القصة: أي جزء يأتي أولًا، وكم يدوم، ولماذا. وهو مستقل عن الأسلوب، فكل ترتيب يعمل مع أي أسلوب في `styles/`، لأن الأساليب كلها تقدّم الأجزاء نفسها بالمواصفات نفسها: `line` و`count` و`list` و`compare`، ثم `ending`.

| الملف | الترتيب | يناسب |
|---|---|---|
| `system.json` | نظام واستثناء | التميّز عن المنافسين |
| `before-after.json` | قبل وبعد | التحوّل: سعر، أو وقت، أو جهد |
| `steps.json` | خطوات أو أسباب | الشرح والمزايا |
| `proof.json` | رقم يثبت | رقم حقيقي قوي |
| `question.json` | سؤال وجواب | التوعية والتعليم |

## For Claude: turning an arrangement into a reel spec

- Each beat becomes one scene: `"part": "line"` → `{ "scene": "/brand/look/parts/line.js", "spec": { "duration", "at"?, "cut"?, "says" } }`; `"part": "ending"` → `{ "scene": "/brand/look/ending.js", "specUrl": "/brand/look/ending.json" }`. Drop the `why` field.
- Replace every «…» placeholder with the customer's words (voice.md, one *key* word per line). Every number comes from facts.md, written exactly; a beat whose number does not exist there is cut or rewritten, never filled with a guess (the placeholder `0` is not a value).
- Keep the first beat's negative `"at"`, so the hook is on screen in the first frame. Beats may be added, removed or reordered when the idea needs it; the arrangement is a starting shape, not a rule.
- Use the look's own joint (`"transition": { "joint": "/brand/look/joint.js", "duration": … }` as in `look/preview.json`) and its mark (`"over"`).
- The parts `line`, `count`, `list` and `compare` exist in every look installed from `styles/`. A look designed from scratch may not have all four: write the missing part into `<brand>/look/parts/` in that look first.
