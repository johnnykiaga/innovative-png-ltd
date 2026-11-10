# Innovative PNG Ltd – Website

A clean, modern showcase website for **Innovative PNG Ltd** (Mount Hagen, Papua New Guinea) with a built-in admin panel. No database and no build step: it is plain HTML, CSS and JavaScript.

## What's included

- **Home** – hero, category cards, featured products, "why us" strip, call-to-action band
- **Shop** – product grid with category filters and search (the header search works too)
- **About** and **Contact** – both fully editable; the contact form opens the visitor's email app (or posts to a form service, see below)
- **Admin panel** (`admin/index.html`) – edit nearly everything without touching code

## View the site

Open `index.html` in a browser, or run a tiny local server:

```bash
cd innovative-png-ltd
python3 -m http.server 8080     # or: npx serve .
```

Then visit `http://localhost:8080`.

## How the content works (no database needed)

All the site's content lives in one file: **`js/content.js`**. That is what every visitor sees.

The admin panel edits a *draft* saved in your own browser. Nobody else sees the draft until you **publish** it:

1. Log in to the admin and make your changes.
2. Click **Publish ⬇** (top right) or go to the **Publish & Backup** tab and click *Download content.js*.
3. Replace `js/content.js` in the website folder with the downloaded file.
4. Upload / deploy the site again (or commit it if it is hosted on GitHub Pages, Netlify, Cloudflare Pages…).
5. Back in the admin, click **Discard edits** so your browser shows the published copy again.

While you have unpublished edits, the public pages show a small orange "Preview" bar **in your browser only**, so you always know what you are looking at.

Why this approach? For a demo it needs no server, no accounts and no monthly cost, and your content is a normal file you can keep in Git. When the shop is ready for something bigger, the only file that talks to storage is `js/data.js`, so a real database (Supabase, Firebase, …) can be added later by changing that one file.

## What you can control in the admin

| Tab | What it does |
|---|---|
| **Page Editor** | Home hero text, badges, buttons, "why us" strip, call-to-action band, plus the Shop, About and Contact page texts and their photos |
| **Products** | Add / edit / copy / delete, search and filter, **Visible** vs **In stock**, ★ featured, and ↑ ↓ to set the order on the shop page |
| **Categories** | Add, rename, reorder, delete. Drives the menu, home cards, shop filters and footer |
| **Business Info** | Name, tagline, top bar message, phone, email, address, opening hours, footer text. Used on every page |
| **Settings** | Currency symbol, price note, show/hide out-of-stock items, number of featured items, show/hide photo placeholders, contact-form service URL, change password |
| **Publish & Backup** | Download `content.js`, download / import a JSON backup, discard draft edits |

**Visible vs In stock:** *Visible* decides whether a product appears on the site at all. *In stock* only changes its badge ("Currently unavailable"). In Settings you can also hide all out-of-stock products from visitors.

## Contact form

- **Default:** the form opens the visitor's email app with the message ready to send to your business email.
- **Better:** create a free form at [Formspree](https://formspree.io) (or similar), paste its URL in **Settings → Contact form service URL**, and messages are sent straight to your inbox without opening an email app.

## Photos

Photo areas show dashed placeholders until you upload a photo (Settings can hide the placeholders for a cleaner look). Uploaded photos are stored inside the content as base64, which is fine for a few photos but makes `content.js` large. For a faster live site, put photo files in the `images/` folder and use their paths instead of uploading in the admin. The browser also limits draft storage to roughly 5 MB; the admin will tell you if it is full.

## Admin password

- Open `admin/index.html` (or click **Admin** in the footer).
- The starting password is **`innovative2024`**. The admin shows a red warning until you change it in **Settings → Change password**.
- **Important:** this password only locks the admin *screen in a browser*. The site is static, so it is not real security (anyone who can read the project files can see how it works). That is fine for a demo, because edits only ever affect a draft in one browser and nothing goes live until you replace `js/content.js`. If you later host an admin that changes the live site directly, it needs a real backend with real logins.

## Going live

1. Change the admin password (Settings).
2. Replace the demo products, prices and text with real ones and publish.
3. Host the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages, or your own domain).
4. Optionally connect the contact form (above).

## File structure

```
innovative-png-ltd/
├── index.html, shop.html, about.html, contact.html
├── css/styles.css
├── js/
│   ├── content.js     <- the published content (replace this to publish)
│   ├── data.js        <- loads content, applies the admin draft, saves safely
│   └── main.js        <- builds the shared header/footer and each page
├── admin/
│   ├── index.html
│   └── admin.js
├── images/
└── README.md
```

Built for the customer of Innovative PNG Ltd – Mount Hagen.
