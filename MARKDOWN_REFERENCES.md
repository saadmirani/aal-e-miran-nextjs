# Markdown Quick Reference

Fast lookup guide for markdown syntax used in biographies and books.

---

## TEXT FORMATTING

| Syntax | Result | Use For |
|--------|--------|---------|
| `**text**` | **bold** | Important names, key concepts |
| `*text*` | *italic* | Emphasis, subtle highlighting |
| `***text***` | ***bold italic*** | Strong emphasis |
| `~~text~~` | ~~strikethrough~~ | Corrections, deletions |
| `` `code` `` | `code` | Inline code/technical terms |

---

## HEADINGS

| Syntax | Level | Best For |
|--------|-------|----------|
| `# Heading` | H1 | Main biography/book title (use once) |
| `## Heading` | H2 | Major sections (Early Life, Education) |
| `### Heading` | H3 | Subsections (specific topics) |
| `#### Heading` | H4 | Sub-subsections (rarely needed) |

**Example:**
```markdown
# Hazrat Ahmad Raza          ← Main title
## Early Life                ← Major section
### Childhood               ← Subsection
```

---

## LISTS

### Bullet Points (Unordered)

```markdown
- Item 1
- Item 2
- Item 3
  - Nested item (indent with 2 spaces)
  - Another nested
- Back to main level
```

**Result:**
- Item 1
- Item 2
- Item 3
  - Nested item
  - Another nested
- Back to main level

### Numbered Lists (Ordered)

```markdown
1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
4. Fourth step
```

**Result:**
1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
4. Fourth step

---

## BLOCKQUOTES

Use `>` for quotes, important statements, or highlights.

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> New paragraph within quote.

>> Nested quote goes deeper
```

**Result:**
> This is a blockquote.
> It can span multiple lines.
>
> New paragraph within quote.

---

## TABLES

Create structured data with pipes `|` and dashes `-`.

### Basic Table Syntax

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data A   | Data B   | Data C   |
| Data D   | Data E   | Data F   |
```

**Result:**
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data A   | Data B   | Data C   |
| Data D   | Data E   | Data F   |

### Table with Alignment

Use `:` to align columns:
- `:---` = Left align
- `:---:` = Center align
- `---:` = Right align

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L1   |  C1    |    R1 |
| L2   |  C2    |    R2 |
```

**Result:**
| Left | Center | Right |
|:-----|:------:|------:|
| L1   |  C1    |    R1 |
| L2   |  C2    |    R2 |

### Complex Table Example

```markdown
| Concept | Definition | Example |
|---------|-----------|---------|
| **Ijma** | Scholarly consensus | All scholars agreed on ruling |
| **Qiyas** | Analogical reasoning | *Applied old ruling to new case* |
| **Ijtihad** | Independent judgment | Scholar's ***deep analysis*** |
```

**Result:**
| Concept | Definition | Example |
|---------|-----------|---------|
| **Ijma** | Scholarly consensus | All scholars agreed on ruling |
| **Qiyas** | Analogical reasoning | *Applied old ruling to new case* |
| **Ijtihad** | Independent judgment | Scholar's ***deep analysis*** |

### Tips for Better Tables

1. **Keep columns balanced** - don't make too many columns
2. **Use formatting in cells** - You can use `**bold**`, `*italic*` inside cells
3. **For long content** - Use shorter text, avoid paragraphs
4. **Limit rows** - Tables work best with 3-8 rows

---

## PARAGRAPHS & LINE BREAKS

### Regular Paragraph
```markdown
This is a paragraph.
It continues on the next line.

This is a new paragraph (after blank line).
```

### Soft Line Break (within paragraph)
```markdown
Line 1  
Line 2 (add 2 spaces at end of Line 1)
```

### Horizontal Line (Divider)
```markdown
Content above

---

Content below
```

---

## LINKS

### External Links
```markdown
[Display Text](https://example.com)
```

**Example:**
```markdown
Learn more at [Bazm-e-Saadaat](https://www.bazmesaadaat.org)
```

### Internal Links (within site)
```markdown
[Link Text](../biography/saint-name-slug)
```

---

## SPECIAL CHARACTERS & ESCAPING

### Show Markdown Symbols as Text

Use backslash `\` before the symbol:

```markdown
\*asterisk\*      → *asterisk* (shown as text, not italic)
\[bracket\]       → [bracket] (shown as text, not link)
\# hash           → # hash (shown as text, not heading)
\- dash           → - dash (shown as text, not list)
```

---

## COMMON BIOGRAPHIES TABLE FORMAT

For comparing saints or scholars:

```markdown
| Name | Born | Died | Known For |
|------|------|------|-----------|
| **Hazrat Ahmad Raza** | 1856 CE | 1921 CE | Islamic jurisprudence |
| **Hazrat Haji Imdadullah** | 1817 CE | 1899 CE | Spiritual guidance |
| **Hazrat Thanvi** | 1864 CE | 1943 CE | Tafsir and hadith |
```

**Result:**
| Name | Born | Died | Known For |
|------|------|------|-----------|
| **Hazrat Ahmad Raza** | 1856 CE | 1921 CE | Islamic jurisprudence |
| **Hazrat Haji Imdadullah** | 1817 CE | 1899 CE | Spiritual guidance |
| **Hazrat Thanvi** | 1864 CE | 1943 CE | Tafsir and hadith |

---

## MASTER QUICK REFERENCE

### Formatting Symbols

| Want This | Type This |
|-----------|-----------|
| **Bold** | `**text**` |
| *Italic* | `*text*` |
| ***Bold Italic*** | `***text***` |
| ~~Strikethrough~~ | `~~text~~` |
| `Code` | `` `text` `` |

### Structure Elements

| Element | Syntax | Notes |
|---------|--------|-------|
| Main Title | `# Title` | Use once per document |
| Major Section | `## Section` | Major topics/chapters |
| Subsection | `### Subsection` | Detailed breakdown |
| Bullet List | `- item` | Unordered, use 2 spaces to nest |
| Numbered List | `1. item` | Ordered, auto-numbers |
| Quote | `> text` | For quotes/highlights |
| Table | `\| col1 \| col2 \|` | Structured data |
| Divider | `---` | Visual separator |

### Advanced Elements

| Element | Syntax | Example |
|---------|--------|---------|
| Link | `[text](url)` | `[Learn more](https://example.com)` |
| Nested List | Indent + spaces | `- Main`<br/>`  - Sub` |
| Link Internal | `[text](../path)` | `[Biography](../biography/ahmad-raza)` |
| Bold in Table | Cell with `**text**` | Works in any table cell |
| Escape Char | `\` + symbol | `\*` shows `*` as text |

---

## COMPLETE BIOGRAPHY TEMPLATE WITH TABLE

```markdown
---
title: "Hazrat [Full Name]"
slug: "saint-name-slug"
---

# Hazrat [Full Name]

## Early Life

[Paragraph about birth and family]

## Education & Training

| Stage | Location | Duration | Focus |
|-------|----------|----------|-------|
| Primary | Home | 5 years | Quran memorization |
| Secondary | [City] | 7 years | Islamic sciences |
| Advanced | [City] | 10 years | Specialized studies |

### Key Teachers
- **First Teacher:** [Name] - [specialty]
- **Second Teacher:** [Name] - [specialty]

## Contributions

- **Academic:** [descriptions with **bold**]
- **Spiritual:** [*italic emphasis*]
- **Institutional:** [***combined emphasis***]

## Famous Quote

> "Important lesson or insight"
>
> — Hazrat [Name]

## Timeline

1. Born in [year]
2. Started education
3. Travels for learning
4. Established institutions
5. Major achievements
6. Passed away in [year]

## Legacy

[Concluding paragraph]
```

---

## MARKDOWN DO's & DON'Ts

### ✅ DO
- Use `#` for main title only once
- Use `##` for major sections
- Use `###` for subsections
- Use `-`, `*`, or `+` for bullets
- Use `>` for important quotes
- Use `|` to create tables
- Use `**bold**` for names and key concepts
- Use `*italic*` for emphasis
- Use full Urdu/Arabic text freely

### ❌ DON'T
- Use multiple `#` titles per document
- Use too many heading levels (stick to H1, H2, H3)
- Create tables with more than 5-6 columns
- Mix `-` and `*` in same list (choose one)
- Use excessive bold/italic (defeats purpose)
- Indent without proper structure
- Leave no space after `#` or `-`

---

## EXAMPLE: URDU BIOGRAPHY WITH TABLE

```markdown
---
title: "حضرت علی بن ابی طالب"
slug: "ali-ibn-abi-talib"
---

# حضرت علی بن ابی طالب (علیہ السلام)

## شرافتیں اور خصوصیات

| صفت | تفصیل | اہمیت |
|-----|--------|--------|
| **شجاعت** | جنگوں میں بہادری | دشمنوں کا خوف |
| *حکمت* | عادل فیصلے | معاملات میں تدبر |
| ***علم*** | قرآن و سنت میں ماہر | دینی رہنمائی |

## اہم فیصلے

- **بغیر شرط خلیفہ** - جس سے کسی کو خاص حق نہ ملے
- *عام انصاف* - تمام کے لیے یکساں قانون
- ***روحانی رہنمائی*** - اماموں کی خلافت

## نشانی حکایت

> "علم سے بڑی دولت نہیں، غربت سے بڑی دولت نہیں"
>
> — حضرت علی کرم اللہ وجہ

## نتیجہ

حضرت علی اسلام کے **سب سے عظیم** شخصیات میں سے ایک تھے۔
```

---

## TESTING YOUR MARKDOWN

### VS Code Preview
1. Open `.md` file
2. Press `Ctrl + Shift + V` (Mac: `Cmd + Shift + V`)
3. See live preview beside your code

### Online Editors
- https://markdown-it.github.io/
- https://dillinger.io/
- https://stackedit.io/

### Before Committing
✅ All tables render correctly
✅ All links work
✅ Bold/italic display properly
✅ Lists are properly indented
✅ Urdu text shows correctly
✅ No syntax errors

---

**Print this reference or bookmark it for quick lookup while creating content!**
