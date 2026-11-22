# مكتبة الأساليب · Styles

114 أسلوبًا جاهزًا (خمسة منها ثلاثية الأبعاد، `"kind": "3d"` في `index.json`) يختار الزبون منها بدل أن يُصمَّم له شكل من الصفر. كل أسلوب يُرسَم بالكامل بألوان الزبون وخطّه وشعاره، فلا يحمل لونًا ولا اسمًا ولا شعارًا من عنده. وحين يُختار أسلوب، تُنسخ منه نسخة إلى مجلد الزبون وتصير له وحده.

`index.json` يعدّد الأساليب. وفي كل مجلد:
- `style.md`: طابع الأسلوب، وما يناسبه، وكيف يوزّع ألوان الزبون، وقواعده لـ Claude.
- `look/`: الشكل كاملًا، بالملفات نفسها التي يكتبها مسار «من الصفر» (الأرضية، والحركة، والوصلة، والعلامة، والخاتمة، والأجزاء، والمعاينة).

كل الأساليب تقدّم الأجزاء الأربعة نفسها بالمواصفات نفسها، فيعمل أي ترتيب من `../arrangements/` مع أي أسلوب:

| الجزء | المواصفة (`says`) |
|---|---|
| `parts/line.js` | `text` مع كلمة مفتاحية بين نجمتين، و`lead` اختياري |
| `parts/count.js` | `value`، و`label`، و`prefix` و`suffix` اختياريان |
| `parts/list.js` | `items` (من 1 إلى 5)، و`title` اختياري |
| `parts/compare.js` | `was` و`now` (كلمات أو أرقام)، و`label` و`unit` اختياريان |

## الأدوات

```
python styles/try.py <style> [--brand <brand folder>] [--full]     معاينة الأسلوب على هوية تجريبية أو على هوية الزبون
python styles/install.py <style> <brand folder>                    نسخ الأسلوب إلى مجلد الزبون ليصير شكله
```

## For Claude

- Never edit a style here for one customer: install it, then change their copy.
- A new style must keep the same file set and the same four part specs, take every colour from `brand.colors` (and mixes of them) and every face from `brand.fonts`, pass `try.py --full` with the check's `ok: true`, and be written from scratch (the kit ships only code and text we own, see `ARCHITECTURE.md` rule 4).
