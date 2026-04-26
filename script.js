const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = n => `TL ${Number(n).toFixed(2)}`;
const clone = value => JSON.parse(JSON.stringify(value));

const DEFAULT_DB = {
  products: [
    {
      id: "p-laptop-pro",
      name: "MacBook Pro 14",
      price: 32999,
      category: "laptop",
      stock: 8,
      image: "images/products/laptop.png",
      description: "Apple laptop with a sharp display, fast performance, and all-day battery."
    },
    {
      id: "p-phone-max",
      name: "iPhone 15 Pro",
      price: 24999,
      category: "phone",
      stock: 12,
      image: "images/products/phone.png",
      description: "Apple 5G smartphone with OLED display, strong cameras, and premium build."
    },
    {
      id: "p-headphones",
      name: "Sony WH-1000XM5",
      price: 6999,
      category: "audio",
      stock: 15,
      image: "images/products/headphones.png",
      description: "Wireless noise-canceling headphones with long battery life and rich sound."
    },
    {
      id: "p-console",
      name: "PlayStation 5",
      price: 18999,
      category: "gaming",
      stock: 6,
      image: "images/products/console.png",
      description: "Sony gaming console with fast loading, 4K gaming support, and DualSense controller."
    },
    {
      id: "p-watch",
      name: "Apple Watch Series 9",
      price: 5499,
      category: "wearable",
      stock: 18,
      image: "images/products/watch.png",
      description: "Apple smartwatch with health tracking, GPS, notifications, and water resistance."
    },
    {
      id: "p-keyboard",
      name: "Logitech G Pro Keyboard",
      price: 2999,
      category: "accessory",
      stock: 22,
      image: "images/products/keyboard.png",
      description: "Compact mechanical gaming keyboard with responsive switches and RGB lighting."
    },
    {
      id: "p-monitor",
      name: "Samsung Odyssey G5 27",
      price: 8999,
      category: "accessory",
      stock: 10,
      image: "images/products/monitor.png",
      description: "Curved 27-inch gaming monitor with smooth refresh rate and sharp color."
    },
    {
      id: "p-earbuds",
      name: "AirPods Pro",
      price: 3999,
      category: "audio",
      stock: 24,
      image: "images/products/earbuds.png",
      description: "Apple true wireless earbuds with compact charging case and active noise cancellation."
    },
    {
      id: "p-mouse",
      name: "Logitech MX Master 3S",
      price: 1499,
      category: "accessory",
      stock: 30,
      image: "images/products/mouse.png",
      description: "Ergonomic wireless mouse with quiet clicks, precise tracking, and fast scrolling."
    },
    {
      id: "p-powerbank",
      name: "Anker PowerCore 20000",
      price: 2299,
      category: "accessory",
      stock: 20,
      image: "images/products/powerbank.png",
      description: "High-capacity portable charger for phones, tablets, and travel."
    },
    {
      id: "p-speaker",
      name: "Amazon Echo Dot",
      price: 4499,
      category: "smart-home",
      stock: 14,
      image: "images/products/speaker.png",
      description: "Compact smart speaker with voice assistant features and room-friendly sound."
    }
  ],
  customers: [],
  orders: [],
  reviews: [
    { id: "r-1", name: "Billiy Eilush", rating: 5, comment: "This is good. Very quiet. Suspiciously good." },
    { id: "r-2", name: "Adele", rating: 5, comment: "I tried singing Set Fire to the Rain, but the speaker won the high note." },
    { id: "r-3", name: "The Weeknd-ish", rating: 4, comment: "Bought headphones and now I cannot feel my face, mostly because the bass is too strong." },
    { id: "r-4", name: "Taylor Swiftly", rating: 5, comment: "The laptop has eras. Battery era, gaming era, homework era. All successful." },
    { id: "r-5", name: "Eminim", rating: 5, comment: "The mouse clicks so fast I accidentally wrote three albums and a shopping list." },
    { id: "r-6", name: "Imagange Dragons", rating: 5, comment: "The speaker had so much thunder I checked if my room unlocked a boss level." }
  ]
};

class StoreDatabase {
  constructor(key = "techStoreFunnyDatabaseV1") {
    this.key = key;
    this.data = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.key);
    if (!saved) return clone(DEFAULT_DB);
    try {
      const parsed = JSON.parse(saved);
      return {
        products: this.mergeProducts(parsed.products || []),
        customers: parsed.customers || [],
        orders: parsed.orders || [],
        reviews: parsed.reviews?.length ? parsed.reviews : clone(DEFAULT_DB.reviews)
      };
    } catch {
      return clone(DEFAULT_DB);
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }

  mergeProducts(savedProducts) {
    return DEFAULT_DB.products.map(defaultProduct => {
      const saved = savedProducts.find(product => product.id === defaultProduct.id);
      return { ...defaultProduct, ...(saved || {}), image: defaultProduct.image };
    });
  }

  getProduct(id) {
    return this.data.products.find(product => product.id === id);
  }

  upsertCustomer(customer) {
    const existing = this.data.customers.find(entry => entry.email === customer.email);
    if (existing) {
      Object.assign(existing, customer);
      this.save();
      return existing;
    }

    const record = { id: uid(), ...customer };
    this.data.customers.push(record);
    this.save();
    return record;
  }

  addReview(review) {
    this.data.reviews.unshift({ id: uid(), ...review });
    this.save();
  }

  addOrder(order) {
    order.items.forEach(line => {
      const product = this.getProduct(line.productId);
      if (product) product.stock = Math.max(0, product.stock - line.quantity);
    });
    this.data.orders.unshift(order);
    this.save();
  }
}

class Cart {
  constructor() {
    this.items = [];
  }

  add(product, quantity = 1) {
    if (product.stock <= 0) throw new Error("This product is out of stock.");
    const existing = this.items.find(line => line.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedQty = currentQty + quantity;
    if (requestedQty > product.stock) throw new Error(`Only ${product.stock} in stock.`);

    if (existing) existing.quantity = requestedQty;
    else {
      this.items.push({
        id: uid(),
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity
      });
    }
  }

  remove(lineId) {
    this.items = this.items.filter(line => line.id !== lineId);
  }

  clear() {
    this.items = [];
  }

  get subtotal() {
    return this.items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  }

  get tax() {
    return this.subtotal * 0.08;
  }

  get total() {
    return this.subtotal + this.tax;
  }

  toJSON(customer = null) {
    return {
      customer,
      items: this.items,
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.total
    };
  }
}

const db = new StoreDatabase();
const cart = new Cart();

const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const itemSelect = document.getElementById("item");
const cartList = document.getElementById("cartList");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const orderJSON = document.getElementById("orderJSON");
const databaseJSON = document.getElementById("databaseJSON");

function renderProducts() {
  const category = categoryFilter.value;
  const products = db.data.products.filter(product => category === "all" || product.category === category);
  productGrid.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img class="product-photo" src="${product.image}" alt="${product.name}">
      <div class="description">
        <div class="product-meta">
          <span>${product.category}</span>
          <span>${product.stock} in stock</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">${money(product.price)}</p>
        <button class="add-btn" ${product.stock === 0 ? "disabled" : ""}>Add to Cart</button>
      </div>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => addToCart(product.id, 1));
    productGrid.append(card);
  });
}

function renderProductOptions() {
  itemSelect.innerHTML = "";
  db.data.products.forEach(product => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} - ${money(product.price)} (${product.stock} left)`;
    option.disabled = product.stock === 0;
    itemSelect.append(option);
  });
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-cart";
    empty.textContent = "Your cart is empty.";
    cartList.append(empty);
  }

  cart.items.forEach(line => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="radio" name="selectedLine" value="${line.id}">
        <span>${line.name} x${line.quantity}</span>
      </label>
      <strong>${money(line.unitPrice * line.quantity)}</strong>
    `;
    cartList.append(li);
  });

  subtotalEl.textContent = money(cart.subtotal);
  taxEl.textContent = money(cart.tax);
  totalEl.textContent = money(cart.total);
  orderJSON.textContent = JSON.stringify(cart.toJSON(), null, 2);
}

function renderReviews() {
  const reviewCards = document.getElementById("reviewCards");
  reviewCards.innerHTML = "";
  db.data.reviews.forEach(review => {
    const card = document.createElement("article");
    card.className = "review";
    const title = document.createElement("h3");
    const stars = document.createElement("p");
    const comment = document.createElement("p");
    title.textContent = review.name;
    stars.textContent = "*".repeat(Number(review.rating));
    comment.textContent = `"${review.comment}"`;
    card.append(title, stars, comment);
    reviewCards.append(card);
  });
}

function renderDatabase() {
  document.getElementById("productCount").textContent = db.data.products.length;
  document.getElementById("orderCount").textContent = db.data.orders.length;
  document.getElementById("customerCount").textContent = db.data.customers.length;
  document.getElementById("reviewCount").textContent = db.data.reviews.length;
  databaseJSON.textContent = JSON.stringify(db.data, null, 2);
}

function renderAll() {
  renderProducts();
  renderProductOptions();
  renderCart();
  renderReviews();
  renderDatabase();
}

function addToCart(productId, quantity) {
  const product = db.getProduct(productId);
  if (!product) return alert("Selected product not found.");
  try {
    cart.add(product, quantity);
    renderCart();
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById("removeSelected").addEventListener("click", () => {
  const selected = document.querySelector('input[name="selectedLine"]:checked');
  if (!selected) return;
  cart.remove(selected.value);
  renderCart();
});

document.getElementById("checkout").addEventListener("click", () => {
  if (cart.items.length === 0) return alert("Cart is empty.");

  const customer = db.upsertCustomer({
    fullName: document.getElementById("name").value.trim() || "Walk-in Customer",
    email: document.getElementById("email").value.trim() || "walkin@techstore.local",
    phone: document.getElementById("phone").value.trim() || "N/A"
  });

  const order = {
    id: uid(),
    customerId: customer.id,
    status: "paid",
    createdAt: new Date().toISOString(),
    items: clone(cart.items),
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total
  };

  db.addOrder(order);
  alert(`Order saved to database. Total paid: ${money(order.total)}`);
  cart.clear();
  renderAll();
});

document.getElementById("reviewForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("rname").value.trim();
  const rating = Number(document.getElementById("rrating").value);
  const comment = document.getElementById("rcomment").value.trim();
  if (!name || !comment) return;

  db.addReview({ name, rating, comment });
  event.currentTarget.reset();
  renderAll();
});

document.getElementById("orderForm").addEventListener("submit", event => {
  event.preventDefault();
  const productId = itemSelect.value;
  const quantity = Math.max(1, Number(document.getElementById("quantity").value || 1));
  addToCart(productId, quantity);
});

categoryFilter.addEventListener("change", renderProducts);

const THEME_KEY = "techStoreTheme";
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById("themeToggle");
  btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  btn.textContent = theme === "dark" ? "Light" : "Dark";
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (systemDark ? "dark" : "light"));
})();

document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

renderAll();
