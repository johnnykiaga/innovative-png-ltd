# Innovative PNG Ltd – Professional Website

A clean, modern website for **Innovative PNG Ltd** (Mount Hagen, Papua New Guinea) with a built-in simple admin panel for editing products and images.

## What’s included

- **Homepage** – Hero, categories, featured products, why us section
- **Shop** – Filterable product grid (Stationery / Phone / Charging / Laptop)
- **About** – Company story and values
- **Contact** – Address, hours, phone, email + contact form
- **Admin panel** – Login, add/edit/delete products, upload images, edit business info, export data

## How to view the site

Just open the files in a browser:

1. Open `index.html` in Chrome, Firefox or Edge
2. Or run a simple local server:

```bash
cd innovative-png-ltd
npx serve .
# or: python3 -m http.server 8080
```

Then visit `http://localhost:3000` (or 8080).

## Admin Login

- URL: `/admin/index.html` (or click “Admin Login” in the footer)
- Username: `admin` (any value works)
- Password: **`innovative2024`**

**Important:** Change the password in `admin/index.html` (search for `innovative2024`) before giving this to the client for real use.

## What the admin can do

- Add, edit and delete products
- Upload product images (stored in the browser as base64)
- Mark products as “In Stock” / “Sold out” and “Featured”
- Edit business name, phone, email, address and hours
- Download a JSON backup of all data
- Reset everything to the original demo content

All changes are saved in the browser’s `localStorage`. They stay on that computer/browser until cleared.

## Image placeholders

Every image area is a clear dashed placeholder. Replace them later with real photos of the shop and products. In the admin you can already upload product images.

## Next steps for production

1. Change the admin password
2. Host the files on any static hosting (Netlify, Cloudflare Pages, GitHub Pages, or their existing domain)
3. Later you can move product data + images to a real backend or to Squarespace / WordPress if preferred
4. Connect the contact form to an email service (Formspree, Netlify Forms, etc.)

## File structure

```
innovative-png-ltd/
├── index.html
├── shop.html
├── about.html
├── contact.html
├── css/styles.css
├── js/data.js
├── js/main.js
├── admin/index.html
└── README.md
```

Built for the customer of Innovative PNG Ltd – Mount Hagen.
