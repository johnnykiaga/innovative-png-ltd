// Default site data – can be overridden by admin via localStorage
const DEFAULT_DATA = {
  products: [
    {
      id: 1,
      name: "Glass Screen Protector",
      category: "phone",
      price: 14.99,
      description: "Crystal-clear tempered glass protection for your phone screen.",
      image: null,
      inStock: true,
      featured: true
    },
    {
      id: 2,
      name: "Fast Charging Adapter 30W",
      category: "charging",
      price: 24.99,
      description: "Compact 30W fast-charging wall adapter. Charges phones and small devices quickly.",
      image: null,
      inStock: true,
      featured: true
    },
    {
      id: 3,
      name: "Leather Phone Case",
      category: "phone",
      price: 19.99,
      description: "Durable leather-style case with precise cutouts and good grip.",
      image: null,
      inStock: true,
      featured: true
    },
    {
      id: 4,
      name: "Wireless Charging Pad",
      category: "charging",
      price: 29.99,
      description: "Sleek wireless charging pad compatible with most modern smartphones.",
      image: null,
      inStock: false,
      featured: false
    },
    {
      id: 5,
      name: "Coloured Pencils (12 pack)",
      category: "stationery",
      price: 8.50,
      description: "Bright, smooth coloured pencils ideal for school and art projects.",
      image: null,
      inStock: false,
      featured: false
    },
    {
      id: 6,
      name: "Leather Wallet Case",
      category: "phone",
      price: 34.99,
      description: "Phone case with card slots – phone and wallet in one.",
      image: null,
      inStock: false,
      featured: false
    },
    {
      id: 7,
      name: "Smartphone Lens Clip",
      category: "phone",
      price: 12.99,
      description: "Clip-on lens set for creative mobile photography.",
      image: null,
      inStock: true,
      featured: true
    },
    {
      id: 8,
      name: "USB-C Charging Cable (1m)",
      category: "charging",
      price: 9.99,
      description: "Durable USB-C cable for everyday charging and data transfer.",
      image: null,
      inStock: true,
      featured: false
    },
    {
      id: 9,
      name: "A4 Exercise Books (Pack of 5)",
      category: "stationery",
      price: 11.50,
      description: "Standard A4 exercise books suitable for school use.",
      image: null,
      inStock: true,
      featured: false
    },
    {
      id: 10,
      name: "Wireless Mouse",
      category: "laptop",
      price: 22.00,
      description: "Comfortable wireless mouse for laptops and desktops.",
      image: null,
      inStock: true,
      featured: true
    }
  ],
  site: {
    businessName: "Innovative PNG Ltd",
    tagline: "Stationery, Mobile & Laptop Accessories",
    phone: "+675 7994 9919",
    email: "innovativepngltd@gmail.com",
    address: "Shop No.01, Sec16, Lot02, Tininga Central Road, Mount Hagen-281, Western Highlands Province, Papua New Guinea",
    hours: "Monday – Friday, 8:00am – 5:00pm"
  }
};

// Load data (localStorage overrides defaults)
function getSiteData() {
  try {
    const stored = localStorage.getItem('innovativePngData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveSiteData(data) {
  localStorage.setItem('innovativePngData', JSON.stringify(data));
}

// Expose globally
window.SiteData = {
  get: getSiteData,
  save: saveSiteData,
  defaults: DEFAULT_DATA
};
