const CART_KEY = "navis-cart";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartQuantityTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function cartSubtotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function updateCartBadge() {
  const cart = getCart();
  const count = cartQuantityTotal(cart);
  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
  document.querySelectorAll('a[href="cart.html"][aria-label]').forEach((link) => {
    if (link.querySelector(".bi-bag")) {
      link.setAttribute("aria-label", count ? `Shopping cart, ${count} items` : "Shopping cart");
    }
  });
}

function addItemToCart(item) {
  const cart = getCart();
  const existing = cart.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function itemFromButton(button) {
  const qtyInput = document.querySelector("#product-qty");
  const quantity = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;

  return {
    id: button.dataset.id,
    title: button.dataset.title,
    price: Number(button.dataset.price),
    image: button.dataset.image,
    category: button.dataset.category || "Shop",
    quantity,
  };
}

function bindAddToCart() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".btn-cart");
    if (!button || !button.dataset.id) {
      return;
    }

    addItemToCart(itemFromButton(button));
    button.textContent = "Added";
    window.setTimeout(() => {
      button.textContent = "Add to cart";
    }, 900);
  });
}

function cartItemMarkup(item) {
  const lineTotal = Number(item.price) * Number(item.quantity);
  const title = escapeHtml(item.title);

  return `<li class="cart-item" data-id="${escapeHtml(item.id)}">
                  <img src="${escapeHtml(item.image)}" alt="${title}" width="88" height="88" />
                  <div class="cart-item-info">
                    <h2><a href="product.html?id=${encodeURIComponent(item.id)}">${title}</a></h2>
                    <p class="product-category mb-1">${escapeHtml(item.category)}</p>
                    <p class="product-price mb-0">${escapeHtml(item.price)} EGP</p>
                    <div class="qty-control" role="group" aria-label="Quantity for ${title}">
                      <button class="qty-btn" type="button" data-action="decrease" aria-label="Decrease quantity">−</button>
                      <input class="qty-input" type="number" min="1" max="99" value="${escapeHtml(item.quantity)}" readonly aria-label="Quantity" />
                      <button class="qty-btn qty-btn-plus" type="button" data-action="increase" aria-label="Increase quantity">+</button>
                    </div>
                  </div>
                  <div class="cart-item-side">
                    <p class="cart-line-label">Total</p>
                    <p class="cart-line-total">${lineTotal} EGP</p>
                    <button class="cart-remove" type="button" data-action="remove" aria-label="Remove ${title}">
                      <i class="bi bi-trash3" aria-hidden="true"></i>
                    </button>
                  </div>
                </li>`;
}

function renderCartPage() {
  const list = document.querySelector(".cart-list");
  if (!list) {
    return;
  }

  const cart = getCart();
  const count = cartQuantityTotal(cart);
  const subtotal = cartSubtotal(cart);
  const countLabel = document.querySelector(".cart-item-count");
  const subtotalRow = document.querySelector("[data-cart-subtotal]");
  const totalRow = document.querySelector("[data-cart-total]");
  const subtotalLabel = document.querySelector("[data-cart-subtotal-label]");

  if (countLabel) {
    countLabel.innerHTML =
      count === 0
        ? "Your cart is empty"
        : `You have <strong>${count} ${count === 1 ? "item" : "items"}</strong> in your cart`;
  }

  list.innerHTML =
    cart.length === 0
      ? `<li class="cart-empty">No items yet. <a href="index.html#products">Continue shopping</a></li>`
      : cart.map(cartItemMarkup).join("");

  if (subtotalLabel) {
    subtotalLabel.textContent = `Subtotal (${count} ${count === 1 ? "item" : "items"})`;
  }
  if (subtotalRow) {
    subtotalRow.textContent = `${subtotal} EGP`;
  }
  if (totalRow) {
    totalRow.textContent = `${subtotal} EGP`;
  }
}

function updateItemQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) {
    return;
  }
  const nextQty = Number(item.quantity) + delta;
  if (nextQty < 1) {
    removeItem(id);
    return;
  }
  item.quantity = nextQty;
  saveCart(cart);
  renderCartPage();
}

function removeItem(id) {
  saveCart(getCart().filter((entry) => entry.id !== id));
  renderCartPage();
}

function bindCartPage() {
  const list = document.querySelector(".cart-list");
  if (!list) {
    return;
  }

  list.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest(".cart-item");
    if (!actionButton || !row) {
      return;
    }

    const id = row.dataset.id;
    const action = actionButton.dataset.action;
    if (action === "increase") {
      updateItemQuantity(id, 1);
    } else if (action === "decrease") {
      updateItemQuantity(id, -1);
    } else if (action === "remove") {
      removeItem(id);
    }
  });

  const clearButton = document.querySelector(".cart-clear");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      saveCart([]);
      renderCartPage();
    });
  }

  renderCartPage();
}

bindAddToCart();
updateCartBadge();
bindCartPage();
