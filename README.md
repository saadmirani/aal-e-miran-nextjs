# Aal-e-Miran Next.js - Biographies & Books

A Next.js application for publishing genealogical biographies and books about Islamic saints and scholars with SEO optimization, multi-language support (English & Urdu), and static generation.

## 📁 Project Structure

```
aal-e-miran-nextjs/
├── app/                           # Next.js app directory
│   ├── biography/[slug]/          # Dynamic biography pages
│   ├── books/[slug]/              # Dynamic book pages
│   ├── layout.jsx                 # Root layout with providers
│   └── page.jsx                   # Home page
├── components/                    # React components
│   └── Navbar.jsx                 # Navigation bar
├── context/                       # React context
│   └── LanguageContext.jsx        # Language switcher state
├── content/                       # Markdown content
│   ├── biographies/
│   │   └── [slug]/
│   │       ├── en.md              # English version
│   │       └── ur.md              # Urdu version
│   └── books/
│       └── [slug]/
│           ├── en.md
│           └── ur.md
├── utils/                         # Utility functions
│   └── markdownLoader.js          # Markdown file loader
├── public/                        # Static assets
├── package.json
├── next.config.js
└── vercel.json                    # Vercel deployment config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd aal-e-miran-nextjs
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file
```bash
cp .env.local.example .env.local
```

4. Run development server
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📝 Adding Content

### Adding a New Biography

1. Create a new folder in `content/biographies/`:
```
content/biographies/your-saint-name/
├── en.md
└── ur.md
```

2. Create `en.md` with the following structure:
```markdown
---
title: "Full Name"
slug: "your-saint-name"
date: "2024-01-01"
author: "Author Name"
---

# Your Title

## Section 1
Content here...
```

3. Create `ur.md` with Urdu content

The page will automatically be available at:
- `/biography/your-saint-name`

### Adding a New Book

Follow the same process in `content/books/your-book-name/`

The page will be available at:
- `/books/your-book-name`

## 🌐 Language Switching

Users can toggle between English and Urdu using the language switcher in the navbar. The preference is saved to localStorage.

## 🎨 Styling

The application uses:
- **Inline CSS** for component styles
- **Global CSS** in `app/layout.css`
- **Responsive Design** with mobile-first approach

### Color Scheme
- Primary Blue: `#1e3c72` to `#2a5298` (gradient)
- Text: `#374151` (dark gray)
- Background: `#f9fafb` (light gray)
- Accents: `#6b7280` (medium gray)

## 📱 Responsive Breakpoints

- Desktop: `1200px+`
- Tablet: `768px - 1199px`
- Mobile: `< 768px`

## 🔍 SEO Features

- Server-side rendering for better indexing
- Dynamic metadata generation
- Structured data (JSON-LD ready)
- Sitemap support (can be added)
- Open Graph meta tags
- Twitter Card support

## 🔗 Linking Strategy

### From React App to Next.js

```javascript
// In your React component
<a href="https://bazmesaadaat.com/biography/rahman-bakhsh-qadri">
  Read Full Biography
</a>
```

### From Next.js Back to React App

```javascript
// In biography component
<Link href="https://bazmesaadaat.com/?section=simla">
  View Family Tree
</Link>
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variable:
   - `NEXT_PUBLIC_DOMAIN=bazmesaadaat.com`
4. Deploy

Vercel will automatically rebuild on each push.

### Domain Configuration

In Vercel dashboard, set up rewrites to route:
- `/biography/*` → Next.js app
- `/books/*` → Next.js app

## 🔄 Domain Migration

If changing domain from `bazmesaadaat.com` to `bazmeansaab.com`:

1. Update environment variable in Vercel:
   ```
   NEXT_PUBLIC_DOMAIN=bazmeansaab.com
   ```

2. Redeploy

All links will automatically use the new domain.

## 📦 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## 🎯 Performance Tips

1. **Image Optimization**: Use Next.js `<Image>` component
2. **Static Generation**: Pages are pre-rendered at build time
3. **Markdown Caching**: Consider caching frequently accessed content
4. **Bundle Size**: Monitor with `npm run build`

## 🤝 Contributing

1. Create a new branch for your feature
2. Add biography/book content to `content/` folder
3. Test locally
4. Submit pull request

## 📄 License

[Add your license here]

## 📧 Contact

For questions or support, contact: [your-email@example.com]

---

## 🗺️ Content Folder Structure Example

```
content/
├── biographies/
│   ├── rahman-bakhsh-qadri/
│   │   ├── en.md
│   │   └── ur.md
│   ├── shah-mansoor/
│   │   ├── en.md
│   │   └── ur.md
│   └── [more saints...]
└── books/
    ├── kitab-ul-ansab/
    │   ├── en.md
    │   └── ur.md
    ├── [more books...]
```

## 🔐 Security

- No sensitive data in `.env` files (use Vercel secrets)
- Validate user input on server-side
- Keep dependencies updated

## 📊 Analytics

To add Google Analytics:
1. Create `_document.jsx` in `app/` folder
2. Add GA script before `</head>`

## 🆘 Troubleshooting

**Issue**: Pages not showing
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`

**Issue**: Language not persisting
- Check browser localStorage
- Clear browser cache

**Issue**: Markdown not rendering
- Verify frontmatter format (YAML)
- Check file encoding (UTF-8)

---

**Last Updated**: January 2024
