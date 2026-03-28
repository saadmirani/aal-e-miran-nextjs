# Adding New Biographies and Books

## Professional Content Structure

This project uses a clean separation of concerns:
- **Content**: Markdown files in `/content/` directory
- **Styling**: CSS files in `/app/biography/` and `/app/books/` directories  
- **Logic**: React components in `/app/biography/[slug]/` and `/app/books/[slug]/` directories

## Adding a New Biography

### Step 1: Create Content Files

Create a directory for the new biography under `/content/biographies/`:
```
content/
  biographies/
    your-saint-name/
      index-en.md    ← English version
      index-ur.md    ← Urdu version
```

### Step 2: Write Content

**`index-en.md`** (Example):
```markdown
---
title: "Hazrat [Saint Name]"
slug: "saint-slug-name"
---

# Hazrat [Saint Name]

## Early Life
[Content...]

## Spiritual Journey
[Content...]
```

**`index-ur.md`** (Same structure with Urdu content):
```markdown
---
title: "حضرت [درویش کا نام]"
slug: "saint-slug-name"
---

# حضرت [درویش کا نام]
[Content in Urdu...]
```

### Step 3: Register in Content Loader

Edit `/utils/contentLoader.js` - Add your biography to the imports and BIOGRAPHIES map:

```javascript
import newBioEnContent from '@/content/biographies/your-saint-name/index-en.md';
import newBioUrContent from '@/content/biographies/your-saint-name/index-ur.md';

const contents = {
   biography: {
      'existing-bio': { ... },
      'your-saint-name': {
         en: newBioEnContent,
         ur: newBioUrContent,
      },
   },
   ...
};
```

### Step 4: Update Page Component

Edit `/app/biography/[slug]/page.jsx` - Add the imports to BIOGRAPHIES object:

```javascript
import newBioEnContent from '@/content/biographies/your-saint-name/index-en.md';
import newBioUrContent from '@/content/biographies/your-saint-name/index-ur.md';

const BIOGRAPHIES = {
   'your-saint-name': {
      en: newBioEnContent,
      ur: newBioUrContent,
   },
};
```

### Step 5: Test

Visit: `https://www.bazmesaadaat.org/biography/your-saint-name`

## Adding a New Book

Follow the same process but:

1. Create in `/content/books/book-slug/`
2. Update `/utils/contentLoader.js` - add to book imports and BOOKS map
3. Update `/app/books/[slug]/page.jsx` - add to BOOKS constant
4. Visit: `https://www.bazmesaadaat.org/books/book-slug`

## File Naming Convention

**Biography files**:
- Directory: `/content/biographies/saint-name-kebab-case/`
- Files: `index-en.md`, `index-ur.md`
- Slug: matches directory name (e.g., `ahmad-raza-barelvi`)

**Book files**:
- Directory: `/content/books/book-title-kebab-case/`
- Files: `index-en.md`, `index-ur.md`
- Slug: matches directory name (e.g., `kitab-ul-ansab`)

## Styling

All styling is handled by:
- `/app/biography/biography.css` - Typography, layout, RTL support
- `/app/books/books.css` - Typography, layout, RTL support

**Key CSS Classes**:
- `.biography-container[dir="rtl"]` - RTL container for biographies
- `.books-container[dir="rtl"]` - RTL container for books
- `.biography-title` / `.book-heading-1` - Nastaliq font applied for Urdu
- All markdown headings and paragraphs have dedicated classes for styling

## Nastaliq Font

The Noto Nastaliq Urdu font is automatically applied to all Urdu content when:
- Language is switched to Urdu (اردو)
- RTL direction is applied to the container
- All headings and body text scale up for better Urdu typography

## Markdown Features Supported

- Headings (# ## ###)
- Paragraphs
- Bold/Strong text (**text**)
- Lists (unordered)
- Line breaks

## Frontend Flow

1. User visits `/biography/[slug]` or `/books/[slug]`
2. Component loads markdown from imports
3. Uses `gray-matter` to parse YAML frontmatter
4. Uses `ReactMarkdown` to render content
5. CSS maps markdown elements to styled classes
6. Language context controls RTL and Nastaliq font

## Professional Standards

✅ Content is separate from code
✅ Markdown files loaded as raw text via `raw-loader`
✅ Consistent file naming and structure
✅ Clear separation: UI logic, content, styling
✅ Easy to add new saints or books
✅ Proper RTL support for Urdu
✅ Nastaliq font for authentic Urdu typography
