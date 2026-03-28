# Markdown Guide for Content Creation

Complete reference for writing biographies and books with proper formatting.

---

## 1. HEADINGS (Titles & Subtitles)

Use `#` symbols at the beginning of a line. More `#` = smaller heading.

```markdown
# Main Title (H1) - Largest
## Subtitle (H2) - Large
### Section Header (H3) - Medium
#### Subsection (H4) - Small
##### Minor Header (H5) - Smaller
###### Tiny Header (H6) - Smallest
```

**Visual Result:**
# Main Title (H1)
## Subtitle (H2)
### Section Header (H3)

**Best Practice for Biographies:**
```markdown
# Hazrat [Full Name] ← Main title (use H1 only once)

## Early Life ← Major sections (use H2)

### Education ← Subsections (use H3)
```

---

## 2. Paragraphs (Normal Text)

Just type text normally. A blank line creates a new paragraph.

```markdown
This is a paragraph. It can wrap across multiple lines 
in your editor, but it will render as one paragraph.

This is a second paragraph after a blank line.
Paragraphs automatically get proper spacing and margins.
```

**Visual Result:**
This is a paragraph. It can wrap across multiple lines in your editor, but it will render as one paragraph.

This is a second paragraph after a blank line.

---

## 3. BULLET POINTS (Unordered Lists)

Use `-`, `*`, or `+` followed by a space. Indent for nested lists.

```markdown
- First bullet point
- Second bullet point
- Third bullet point
  - Nested bullet (indented)
  - Another nested item
- Back to main level
```

**Visual Result:**
- First bullet point
- Second bullet point
- Third bullet point
  - Nested bullet (indented)
  - Another nested item
- Back to main level

**Biography Example:**
```markdown
## Contributions

- Established a khanqah
- Mentored numerous disciples
- Wrote several treatises
  - On Islamic jurisprudence
  - On Sufi philosophy
- Traveled extensively
```

---

## 4. NUMBERED LISTS (Ordered Lists)

Use `1.`, `2.`, `3.` etc. Numbers don't have to be in order (Markdown auto-corrects).

```markdown
1. First step
2. Second step
3. Third step
   1. Substep A
   2. Substep B
4. Fourth step
```

**Visual Result:**
1. First step
2. Second step
3. Third step
   1. Substep A
   2. Substep B
4. Fourth step

**Timeline Example:**
```markdown
## Life Timeline

1. Born in 1750 in Lahore
2. Began Islamic studies at age 10
3. Traveled to scholarly centers
   1. Studied in Delhi
   2. Studied in Mecca
4. Returned to establish khanqah
5. Passed away in 1820
```

---

## 5. TEXT FORMATTING

### Bold Text
Use `**text**` or `__text__`

```markdown
This is **bold text** in a sentence.
This is __also bold__.
```

**Visual:** This is **bold text** in a sentence.

### Italic Text
Use `*text*` or `_text_`

```markdown
This is *italic text* in a sentence.
This is _also italic_.
```

**Visual:** This is *italic text* in a sentence.

### Bold + Italic
Use `***text***` or `___text___`

```markdown
This is ***bold and italic***.
```

**Visual:** This is ***bold and italic***.

### Strikethrough
Use `~~text~~`

```markdown
This is ~~deleted~~ correct text.
```

**Visual:** This is ~~deleted~~ correct text.

**Biography Example:**
```markdown
Hazrat Rahman Bakhsh was a **renowned Sufi saint** known for his *spiritual wisdom* 
and ***deep philosophical insights***. He ~~initially~~ ultimately chose the path 
of spiritual service.
```

---

## 6. COLOR & STYLING LIMITATIONS

### What Works in This Setup:
- **Bold**, *Italic*, ***Bold Italic***
- Headings (H1-H6)
- Lists and nested lists
- Links
- Code blocks

### What Does NOT Work (Requires HTML):
- Text color
- Font size changes (except headings)
- Alignment (left/center/right)
- Highlighting/background color

**Why?** Your system uses `ReactMarkdown` which renders standard Markdown, not extended features.

---

## 7. BLOCKQUOTES (Important/Highlighted Text)

Use `>` at the beginning of a line.

```markdown
> This is a blockquote. Great for important quotes or key statements.
>
> Multiple lines stay in the same blockquote.
> This line too.

> Nested quotes also work
>> Even deeper quotes with `>>`
```

**Visual Result:**
> This is a blockquote. Great for important quotes or key statements.

**Example:**
```markdown
## Famous Quote

> "Knowledge is the best inheritance. Pass it to those who seek it."
> 
> — Hazrat Rahman Bakhsh Qadri
```

---

## 8. CODE & PREFORMATTED TEXT

### Inline Code
Use backticks `` `code` ``

```markdown
The command `git commit -m "message"` saves your changes.
```

**Visual:** The command `git commit -m "message"` saves your changes.

### Code Blocks
Use triple backticks with optional language

````markdown
```javascript
function greet(name) {
  console.log("Hello, " + name);
}
```

```text
Any preformatted text
    with spacing preserved
        line by line
```
````

---

## 9. HORIZONTAL RULES (Dividers)

Use `---`, `***`, or `___` on their own line

```markdown
Some content above

---

Some content below
```

**Visual Result:**

Some content above

---

Some content below

---

## 10. LINE BREAKS

### Soft Break (Regular space between lines)
End a line with **2 spaces** then press Enter

```markdown
Line 1  
Line 2 (with 2 spaces after Line 1)
```

### Hard Break (New paragraph)
Press Enter **twice** (creates blank line)

```markdown
Paragraph 1

Paragraph 2
```

---

## 11. LINKS

### External URLs
```markdown
[Display Text](https://www.example.com)
```

**Example:**
```markdown
Learn more at [Bazm-e-Saadaat](https://www.bazmesaadaat.org)
```

### Internal Links (within site)
```markdown
[Link to Rahman Bakhsh](../biography/rahman-bakhsh-qadri)
```

---

## 12. IMAGES (Not recommended for this setup)

Would require external image hosting. For biographies/books, use text descriptions instead.

```markdown
![Alt text](https://example.com/image.jpg)
```

---

## 13. SPECIAL CHARACTERS

### Urdu & Special Text

**Unicode Support:** ✓ Full Urdu/Arabic support

```markdown
# حضرت رحمان بخش قادری

## ابتدائی زندگی

پیدائش سال ١٧٥٠ میں لاہور میں ہوئی۔

- علمی تعلیم حاصل کی
- روحانی سفر کا آغاز
  - بغداد میں تعلیم
  - مکہ میں روحانی تربیت
```

### Escape Special Characters

If you want to show Markdown symbols as text (not formatted):

```markdown
Use \*asterisks\* to show literal *
Use \[brackets\] to show literal [
Use \# to show literal #
```

**Visual:** Use \*asterisks\* to show literal asterisks

---

## 14. COMPLETE BIOGRAPHY EXAMPLE

```markdown
---
title: "Hazrat Ahmad Raza Barelvi"
slug: "ahmad-raza-barelvi"
---

# Hazrat Ahmad Raza Barelvi

## Early Life

Ahmad Raza was born in **1272 AH** (1856 CE) in Bareilly, India. He came from a 
scholarly family with a strong tradition of Islamic learning and spirituality.

## Education & Training

### Early Education
Ahmad Raza received his initial education at home from his father and other scholars. 
He demonstrated exceptional brilliance from a young age.

### Advanced Studies
He traveled extensively to pursue higher learning:
1. Studied Islamic jurisprudence in Delhi
2. Completed Quran memorization
3. Learned hadith sciences in Lucknow
   - Under renowned hadith scholars
   - Specialized in interpretation

## Major Contributions

Ahmad Raza's work included:

- **Scholarly Works:** Hundreds of treaties on Islamic jurisprudence
- **Spiritual Leadership:** Guided thousands of spiritual seekers
- **Educational Institutions:** Established centers of learning
  - Madrasa Manzar-e-Islam
  - Multiple schools across India
- **Fatwa Issuance:** Issued legal rulings on contemporary issues

## Legacy

> "The Quran is the solution to all problems of human life."
> 
> — Hazrat Ahmad Raza Barelvi

His influence extended across the Islamic world. Students and followers 
**continue his scholarly tradition** today through:

1. Published works in libraries worldwide
2. Spiritual orders (*Tariqah*) bearing his name
3. Educational institutions named after him
4. Scholarly analysis of hadith and jurisprudence

## Conclusion

Hazrat Ahmad Raza remains a *towering figure* in Islamic scholarship and spirituality, 
remembered for his ***comprehensive knowledge*** and ***practical wisdom***.
```

---

## 15. QUICK REFERENCE CHEAT SHEET

```markdown
# Heading 1          Main title
## Heading 2         Large section
### Heading 3        Subsection

**bold**             Bold text
*italic*             Italic text
***bold italic***    Both

- Bullet             Unordered list
1. Numbered          Ordered list

> Quote              Blockquote
> > Nested quote     Nested

[Link](url)          External link

---                  Horizontal line

Line 1  
Line 2               Soft break (2 spaces + enter)

Paragraph 1

Paragraph 2          Hard break (blank line)
```

---

## 16. MARKDOWN LIMITATIONS IN YOUR SYSTEM

### ❌ Not Supported (Would need HTML)
- Text color changes
- Font size (except headings)
- Text alignment (center, right)
- Background highlighting
- Subscript/Superscript
- Tables
- Footnotes

### ✅ Fully Supported
- All headings (H1-H6)
- Bold, italic, strikethrough
- Lists and nested lists
- Quotes
- Links
- Code blocks
- Urdu/Arabic text
- Blockquotes and emphasis

---

## 17. WHEN TO USE WHAT

| Content Type | Use This |
|---|---|
| Page Title | `# Title` |
| Major Section | `## Section Name` |
| Important concept | `**bold**` |
| Quote/Definition | `> blockquote` |
| Step-by-step | `1. First 2. Second` |
| Key points | `- bullet - bullet` |
| Explanation | Regular paragraph |
| Emphasis | `*italic*` or `***bold italic***` |

---

## 18. PROFESSIONAL TIPS FOR YOUR BIOGRAPHIES

1. **Always start with one `#` title** (main biography name)
2. **Use `##` for major life sections:** Early Life, Education, Contributions, Legacy
3. **Use `###` for subsections:** Under Education use ### for specific periods
4. **Make important names/concepts bold:** `**Hazrat Rahman Bakhsh**`
5. **Use lists for achievements and accomplishments**
6. **Use blockquotes for famous quotes**
7. **Keep paragraphs 2-4 sentences** for readability
8. **Use Urdu text freely** - it's fully supported

---

## 19. FILE STRUCTURE REMINDER

Your content files are organized as:

```
content/
  biographies/
    saint-name/
      index-en.md     ← English biography
      index-ur.md     ← Urdu biography
  books/
    book-name/
      index-en.md     ← English book
      index-ur.md     ← Urdu book
```

Each `.md` file should:
1. Start with `---` frontmatter with title/slug
2. Have one `# Main Title` 
3. Use `##` for sections
4. Use formatting as shown above

---

## EXAMPLE: URDU BIOGRAPHY WITH NASTALIQ

```markdown
---
title: "حضرت علی بن ابی طالب"
slug: "ali-ibn-abi-talib"
---

# حضرت علی بن ابی طالب (علیہ السلام)

## ابتدائی حیات

علی رضی اللہ عنہ کا پیدائش **سنہ 599 میں** خانہ کعبہ میں ہوا۔ وہ **حضرت علی** 
کے نام سے معروف ہیں اور *نبی کریم کے چچا زاد بھائی* تھے۔

## علمی و روحانی فضائل

علی کی خصوصیات میں شامل تھے:

- **قرآن کا گہرا علم**
- **شریعت اسلام کی تفہیم**
- **روحانی طاقت اور شجاعت**
  - جنگوں میں بہادری
  - دشمنوں کو شکست دینا
- **عادل فیصلے اور حکمت**

## مشہور قول

> "علم کے بغیر عمل بیکار ہے، اور عمل کے بغیر علم گمراہی ہے۔"
>
> — حضرت علی کرم اللہ وجہ

## نتیجہ

حضرت علی اسلام کی ***تاریخ میں ایک عظیم شخصیت*** ہیں جن کی ***علمی اور روحانی 
میراث*** آج بھی زندہ ہے۔
```

---

Now you have everything you need to create professional, well-formatted biographies and books with proper Markdown syntax!
