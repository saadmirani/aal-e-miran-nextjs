# Next.js Biographies & Books Project - Setup Guide

## ✅ Complete Project Structure Created

Your Next.js application has been set up with the following structure:

```
aal-e-miran-nextjs/
├── app/
│   ├── biography/[slug]/page.jsx      ✅ Biography pages (dynamic routes)
│   ├── books/[slug]/page.jsx          ✅ Books pages (dynamic routes)
│   ├── page.jsx                       ✅ Home page
│   ├── layout.jsx                     ✅ Root layout with LanguageProvider
│   └── layout.css                     ✅ Global styles
├── components/
│   ├── Navbar.jsx                     ✅ Navigation with language toggle
│   └── Navbar.css
├── context/
│   └── LanguageContext.jsx            ✅ Language state management (EN/UR)
├── content/
│   ├── biographies/
│   │   └── rahman-bakhsh-qadri/
│   │       ├── en.md                  ✅ Sample English biography
│   │       └── ur.md                  ✅ Sample Urdu biography
│   └── books/
│       └── kitab-ul-ansab/
│           ├── en.md                  ✅ Sample English book
│           └── ur.md                  ✅ Sample Urdu book
├── utils/
│   └── markdownLoader.js              ✅ Markdown file parser
├── package.json                       ✅ Dependencies configured
├── next.config.js                     ✅ Next.js configuration
├── jsconfig.json                      ✅ Path aliases (@/ imports)
├── vercel.json                        ✅ Vercel deployment config
├── .env.local.example                 ✅ Environment variables template
├── .gitignore                         ✅ Git ignore rules
└── README.md                          ✅ Full documentation
```

## 🎯 Sample Pages Already Created

### Biography Page
- **URL**: `/biography/rahman-bakhsh-qadri`
- **Features**:
  - English & Urdu versions
  - Markdown content rendering
  - Beautiful UI matching your React app
  - Language switcher
  - Back button navigation

### Book Page
- **URL**: `/books/kitab-ul-ansab`
- **Features**:
  - Same language support
  - Professional layout
  - Structured content with sections
  - SEO-optimized

## 🚀 Getting Started (3 Steps)

### Step 1: Initialize the Project

```bash
cd aal-e-miran-nextjs
npm install
```

### Step 2: Create Environment File

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_DOMAIN=bazmesaadaat.com
```

### Step 3: Run Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 🔗 Integration with Your React App

### Scenario 1: Link from React App to Biography

In your React app (Biographies component):

```javascript
<a href="https://bazmesaadaat.com/biography/rahman-bakhsh-qadri">
  Read Full Biography
</a>
```

### Scenario 2: Link from Biography Back to Tree

In Next.js biography page:

```javascript
<a href="https://bazmesaadaat.com/?section=simla">
  View Family Tree
</a>
```

## 📝 Adding New Content

### To Add a New Biography:

1. Create folder: `content/biographies/your-saint-slug/`
2. Create `en.md`:
```markdown
---
title: "Saint Name"
slug: "your-saint-slug"
author: "Author Name"
---

# Saint Name

## Early Life
Content here...
```

3. Create `ur.md` with Urdu version
4. Page automatically available at: `/biography/your-saint-slug`

### To Add a New Book:

Same process in `content/books/your-book-slug/`

Page available at: `/books/your-book-slug`

## 🎨 UI Features

✅ **Responsive Design** - Works on mobile, tablet, desktop
✅ **Language Toggle** - Click EN/اردو button in navbar
✅ **Dark Navbar** - Blue gradient matching your React app
✅ **Professional Typography** - Readable, clean formatting
✅ **Back Navigation** - Easy navigation between pages
✅ **SEO Optimized** - Meta tags, structured data ready

## 🌐 Deployment Setup

### On Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Connect your repository
4. Configure environment:
   - Add `NEXT_PUBLIC_DOMAIN=bazmesaadaat.com`
5. Deploy!

### Automatic Deploys

Every push to GitHub = automatic deploy on Vercel

## 🔄 Domain Switching

To change domain (e.g., from bazmesaadaat to bazmeansaab):

**In Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Update: `NEXT_PUBLIC_DOMAIN=bazmeansaab.com`
3. Redeploy

**That's it!** All links automatically use new domain.

## 📊 File Sizes

- `package.json` - Dependencies pre-configured
- `next.config.js` - Minimal setup
- `vercel.json` - Deployment config
- All CSS is component-scoped (no bloat)

## ✨ Features Implemented

✅ Multi-language support (EN/UR)
✅ Markdown content rendering
✅ Dynamic routing ([slug])
✅ Language persistence (localStorage)
✅ SEO-friendly structure
✅ Responsive design
✅ Professional UI matching React app
✅ Sample biography + book pages
✅ Environment variable support
✅ Vercel deployment ready

## 🎯 Next Steps

**1. Install & Run Locally:**
```bash
cd aal-e-miran-nextjs
npm install
npm run dev
```

**2. Test Sample Pages:**
- Visit `/biography/rahman-bakhsh-qadri`
- Visit `/books/kitab-ul-ansab`
- Test language toggle

**3. Add Your Content:**
- Create new biography folders
- Add markdown files
- Test routes

**4. Link from React App:**
- Update biography links to point to `/biography/[slug]`
- Update book links to point to `/books/[slug]`

**5. Deploy to Vercel:**
- Push to GitHub
- Create Vercel account
- Connect repository
- Add env variable
- Deploy!

## 📞 Support

**Key Files to Know:**
- `app/layout.jsx` - Main layout wrapper
- `context/LanguageContext.jsx` - Language management
- `app/biography/[slug]/page.jsx` - Biography template
- `app/books/[slug]/page.jsx` - Books template
- `content/` - Where all markdown files go

**Common Issues:**
- Pages not loading? → Clear `.next` folder (`rm -rf .next`)
- Language not saving? → Check browser localStorage
- Styles not working? → Hard refresh (Ctrl+Shift+R)

---

## 📋 Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Created `.env.local` file
- [ ] Ran `npm run dev`
- [ ] Tested `/biography/rahman-bakhsh-qadri`
- [ ] Tested `/books/kitab-ul-ansab`
- [ ] Added first new biography/book
- [ ] Tested language switcher
- [ ] Tested back navigation

Once you complete these steps, your Next.js app will be ready for production deployment!

---

**Questions?** The README.md file has detailed documentation for all features.

**Ready to go!** 🚀
