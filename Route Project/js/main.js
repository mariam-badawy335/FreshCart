const API_BASE = "https://ecommerce.routemisr.com/api/v1/products";



function starLabel(rating) {
  const filled = Math.round(Number(rating) || 0);
  return "★".repeat(Math.min(5, filled)) + "☆".repeat(Math.max(0, 5 - filled));
}

function productCardHtml(product) {
  const id = product.id || product._id;
  const href = `product.html?id=${encodeURIComponent(id)}`;
  const title = escapeHtml(product.title);
  const category = escapeHtml(product.category?.name || "Shop");
  const image = escapeHtml(product.imageCover);
  const rating = product.ratingsAverage ?? 0;

  return `<article class="product-card">
              <div class="product-media">
                <a class="product-media-link" href="${href}">
                  <img src="${image}" alt="${title}" width="600" height="400" />
                </a>
                <div class="product-actions">
                  <a class="product-action" href="#wishlist" aria-label="Add ${title} to wishlist"><i class="bi bi-heart" aria-hidden="true"></i></a>
                  <a class="product-action" href="#support" aria-label="Refund policy for ${title}"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i></a>
                  <a class="product-action" href="${href}" aria-label="View ${title}"><i class="bi bi-eye" aria-hidden="true"></i></a>
                </div>
              </div>
              <div class="product-body">
                <p class="product-category">${category}</p>
                <h3 class="product-name"><a href="${href}">${title}</a></h3>
                <div class="product-meta">
                  <span class="product-price">${escapeHtml(product.price)} EGP</span>
                  <span class="product-rating" aria-hidden="true">${starLabel(rating)}</span>
                  <span class="visually-hidden">Rated ${escapeHtml(rating)} out of 5</span>
                </div>
                <button class="btn-cart" type="button" data-id="${escapeHtml(id)}" data-title="${title}" data-price="${escapeHtml(product.price)}" data-image="${image}" data-category="${category}">Add to cart</button>
              </div>
            </article>`;
}

const productQuery = {
  keyword: "",
  sort: "",
  category: "",
  brand: "",
  priceGte: "",
  priceLte: "",
  page: 1,
  limit: 20,
};

function buildProductUrl() {
  const params = new URLSearchParams();
  params.set("limit", String(productQuery.limit));
  params.set("page", String(productQuery.page));
  if (productQuery.keyword) {
    params.set("keyword", productQuery.keyword);
  }
  if (productQuery.sort) {
    params.set("sort", productQuery.sort);
  }
  if (productQuery.brand) {
    params.set("brand", productQuery.brand);
  }
  if (productQuery.category) {
    params.append("category[in]", productQuery.category);
  }
  if (productQuery.priceGte) {
    params.set("price[gte]", productQuery.priceGte);
  }
  if (productQuery.priceLte) {
    params.set("price[lte]", productQuery.priceLte);
  }
  return `${API_BASE}?${params.toString()}`;
}

async function getProductsData() {
  const productsContainer = document.querySelector(".product-grid");
  if (!productsContainer || productsContainer.classList.contains("related-grid")) {
    return;
  }

  productsContainer.innerHTML = `<p class="text-center">Loading products…</p>`;
  const results = document.querySelector("#product-results");

  try {
    const response = await fetch(buildProductUrl());
    if (!response.ok) {
      throw new Error("Could not load products");
    }
    const products = await response.json();
    displayProducts(products, productsContainer);
    const count = products.results ?? (products.data || []).length;
    const page = products.metadata?.currentPage || productQuery.page;
    const pages = products.metadata?.numberOfPages || 1;
    if (results) {
      results.textContent = count
        ? `Showing page ${page} of ${pages} (${count} matches)`
        : "No products match these filters.";
    }
    renderPager(products.metadata);
  } catch (error) {
    productsContainer.innerHTML = `<p class="text-center">${escapeHtml(error.message)}</p>`;
    if (results) {
      results.textContent = "";
    }
  }
}

function displayProducts(products, container) {
  const productsContainer = container || document.querySelector(".product-grid");
  if (!productsContainer) {
    return;
  }

  let productBox = "";
  const list = products.data || [];
  for (let i = 0; i < list.length; i++) {
    productBox += productCardHtml(list[i]);
  }
  productsContainer.innerHTML = productBox || "<p>No products found.</p>";
}

function bindGallery(root) {
  const stage = root.querySelector(".pdp-stage-img");
  const thumbs = root.querySelectorAll(".pdp-thumb");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      stage.src = thumb.dataset.src;
      stage.alt = thumb.dataset.alt || stage.alt;
      thumbs.forEach((item) => item.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });
}

function bindQuantity(root, unitPrice) {
  const input = root.querySelector("#product-qty");
  const total = root.querySelector("[data-total-price]");
  if (!input || !total) {
    return;
  }

  const updateTotal = () => {
    const qty = Math.max(1, Number(input.value) || 1);
    input.value = String(qty);
    total.textContent = `${unitPrice * qty} EGP`;
  };

  input.addEventListener("input", updateTotal);
  input.addEventListener("change", updateTotal);
}

function renderProductMarkup(product, relatedHtml) {
  const title = escapeHtml(product.title);
  const category = escapeHtml(product.category?.name || "Shop");
  const brand = escapeHtml(product.brand?.name || "Navis");
  const subcategory = escapeHtml(product.subcategory?.[0]?.name || "—");
  const description = escapeHtml(product.description || "").replace(/\n/g, "<br>");
  const rating = product.ratingsAverage ?? 0;
  const reviews = product.ratingsQuantity ?? 0;
  const sold = product.sold ?? 0;
  const quantity = product.quantity ?? 1;
  const cover = product.imageCover;
  const gallery = [cover, ...(product.images || [])].filter(Boolean);
  const uniqueGallery = [...new Set(gallery)];

  const thumbs = uniqueGallery
    .map((src, index) => {
      const active = index === 0 ? " is-active" : "";
      return `<button class="pdp-thumb${active}" type="button" data-src="${escapeHtml(src)}" data-alt="${title}, view ${index + 1}">
                  <img src="${escapeHtml(src)}" alt="" width="72" height="72" />
                  <span class="visually-hidden">Show image ${index + 1} of ${title}</span>
                </button>`;
    })
    .join("");

  return `
        <nav class="pdp-breadcrumb" aria-label="Breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
            <li class="breadcrumb-item"><a href="index.html#categories">${category}</a></li>
            <li class="breadcrumb-item active" aria-current="page">${title}</li>
          </ol>
        </nav>

        <div class="pdp-buy">
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="pdp-gallery">
                <div class="pdp-stage">
                  <img class="pdp-stage-img" src="${escapeHtml(uniqueGallery[0])}" alt="${title}" width="900" height="700" />
                </div>
                <div class="pdp-thumbs">${thumbs}</div>
              </div>
            </div>
            <div class="col-lg-6">
              <p class="pdp-kicker">${category} · ${brand}</p>
              <h1 class="pdp-title">${title}</h1>
              <p class="pdp-rating mb-2">
                <span aria-hidden="true">${starLabel(rating)}</span>
                <span class="visually-hidden">Rated ${escapeHtml(rating)} out of 5</span>
                <span class="text-muted"> ${escapeHtml(rating)} (${escapeHtml(reviews)} reviews)</span>
              </p>
              <p class="pdp-price">${escapeHtml(product.price)} EGP</p>
              <p class="pdp-stock"><i class="bi bi-check-circle" aria-hidden="true"></i> In stock · ${escapeHtml(quantity)} available</p>
              <p>${description}</p>
              <div class="mb-3">
                <label class="form-label fw-semibold" for="product-qty">Quantity</label>
                <input class="form-control pdp-qty" id="product-qty" type="number" name="qty" min="1" max="${escapeHtml(quantity)}" value="1" />
              </div>
              <div class="pdp-total">
                <span>Total price</span>
                <span data-total-price>${escapeHtml(product.price)} EGP</span>
              </div>
              <div class="pdp-actions">
                <button class="btn-cart" type="button" data-id="${escapeHtml(product.id || product._id)}" data-title="${title}" data-price="${escapeHtml(product.price)}" data-image="${escapeHtml(cover)}" data-category="${category}">Add to cart</button>
                <button class="btn-buy" type="button">Buy now</button>
              </div>
              <a class="btn-wishlist-full" href="#wishlist"><i class="bi bi-heart" aria-hidden="true"></i> Add to wishlist</a>
              <div class="pdp-trust">
                <p class="mb-0"><i class="bi bi-truck" aria-hidden="true"></i> Free delivery on orders over 50 EGP</p>
                <p class="mb-0"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> 30-day returns</p>
                <p class="mb-0"><i class="bi bi-shield-check" aria-hidden="true"></i> Secure payment</p>
              </div>
            </div>
          </div>
        </div>

        <div class="pdp-panel">
          <ul class="nav nav-tabs pdp-tabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="tab-details" data-bs-toggle="tab" data-bs-target="#panel-details" type="button" role="tab" aria-controls="panel-details" aria-selected="true">Product details</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="tab-reviews" data-bs-toggle="tab" data-bs-target="#panel-reviews" type="button" role="tab" aria-controls="panel-reviews" aria-selected="false">Reviews (${escapeHtml(reviews)})</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="tab-ship" data-bs-toggle="tab" data-bs-target="#panel-ship" type="button" role="tab" aria-controls="panel-ship" aria-selected="false">Shipping &amp; returns</button>
            </li>
          </ul>
          <div class="tab-content pt-3">
            <div class="tab-pane fade show active" id="panel-details" role="tabpanel" aria-labelledby="tab-details">
              <h2 class="h5">About this product</h2>
              <p>${description}</p>
              <div class="row">
                <div class="col-md-6">
                  <h3 class="h6">Product information</h3>
                  <dl class="pdp-specs">
                    <dt>Category</dt><dd>${category}</dd>
                    <dt>Subcategory</dt><dd>${subcategory}</dd>
                    <dt>Brand</dt><dd>${brand}</dd>
                    <dt>Items sold</dt><dd>${escapeHtml(sold)}</dd>
                  </dl>
                </div>
                <div class="col-md-6">
                  <h3 class="h6">Key features</h3>
                  <ul>
                    <li>Premium quality product</li>
                    <li>Authentic brand guarantee</li>
                    <li>Secure payment and tracked delivery</li>
                    <li>Quality tested before shipping</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews">
              <h2 class="h5">Customer reviews</h2>
              <p>Average rating ${escapeHtml(rating)} out of 5 from ${escapeHtml(reviews)} reviews.</p>
            </div>
            <div class="tab-pane fade" id="panel-ship" role="tabpanel" aria-labelledby="tab-ship">
              <h2 class="h5">Shipping</h2>
              <p>Standard shipping is free on orders over 50 EGP. Most orders leave the warehouse within two business days.</p>
              <h2 class="h5">Returns</h2>
              <p>Unused items can be returned within 30 days. Start a refund from your account or contact support.</p>
            </div>
          </div>
        </div>

        <section aria-labelledby="related-heading">
          <h2 class="section-title" id="related-heading">You may also like</h2>
          <div class="product-grid related-grid">${relatedHtml}</div>
        </section>`;
}

async function getRelatedProducts(current) {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    const currentId = current.id || current._id;
    const categoryId = current.category?._id;
    const all = payload.data || [];
    const sameCategory = all.filter(
      (item) => (item.id || item._id) !== currentId && item.category?._id === categoryId
    );
    const fallback = all.filter((item) => (item.id || item._id) !== currentId);
    return (sameCategory.length ? sameCategory : fallback).slice(0, 5);
  } catch (_error) {
    return [];
  }
}

async function getProductDetails() {
  const root = document.querySelector("#product-detail");
  if (!root) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    root.innerHTML = `<p class="pdp-status">No product selected. <a href="index.html">Back to shop</a></p>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error("Product could not be found.");
    }
    const payload = await response.json();
    const product = payload.data;
    if (!product) {
      throw new Error("Product could not be found.");
    }

    document.title = `${product.title} | Navis`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", String(product.description || product.title).replace(/\s+/g, " ").slice(0, 160));
    }

    const related = await getRelatedProducts(product);
    root.innerHTML = renderProductMarkup(product, related.map(productCardHtml).join(""));
    bindGallery(root);
    bindQuantity(root, Number(product.price) || 0);
  } catch (error) {
    root.innerHTML = `<p class="pdp-status">${escapeHtml(error.message)} <a href="index.html">Back to shop</a></p>`;
  }
}

function fillSelect(select, items) {
  if (!select) {
    return;
  }
  const current = select.value;
  const firstLabel = select.options[0]?.textContent || "All";
  select.innerHTML = `<option value="">${firstLabel}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item._id;
    option.textContent = item.name;
    select.append(option);
  });
  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

async function loadFilterOptions() {
  const categorySelect = document.querySelector("#filter-category");
  const brandSelect = document.querySelector("#filter-brand");
  const categoryGrid = document.querySelector("#category-grid");

  try {
    const [categoriesRes, brandsRes] = await Promise.all([
      fetch("https://ecommerce.routemisr.com/api/v1/categories"),
      fetch("https://ecommerce.routemisr.com/api/v1/brands?limit=40"),
    ]);
    const categories = categoriesRes.ok ? await categoriesRes.json() : { data: [] };
    const brands = brandsRes.ok ? await brandsRes.json() : { data: [] };

    fillSelect(categorySelect, categories.data || []);
    fillSelect(brandSelect, brands.data || []);

    if (categoryGrid) {
      categoryGrid.innerHTML = (categories.data || [])
        .map(
          (category) => `<a class="category-tile" href="#products" data-category-id="${escapeHtml(category._id)}">
              <img src="${escapeHtml(category.image)}" alt="" width="72" height="72" />
              <span>${escapeHtml(category.name)}</span>
            </a>`
        )
        .join("");
    }
  } catch (_error) {
    if (categoryGrid && !categoryGrid.innerHTML.trim()) {
      categoryGrid.innerHTML = `<p>Categories could not be loaded.</p>`;
    }
  }
}

function readFiltersFromForm() {
  const form = document.querySelector("#product-filters");
  if (!form) {
    return;
  }
  productQuery.sort = form.sort.value;
  productQuery.category = form.category.value;
  productQuery.brand = form.brand.value;
  productQuery.priceGte = form.priceGte.value;
  productQuery.priceLte = form.priceLte.value;
}

function highlightActiveCategory() {
  document.querySelectorAll(".category-tile").forEach((tile) => {
    tile.classList.toggle("is-active", tile.dataset.categoryId === productQuery.category);
  });
}

function renderPager(metadata) {
  const pager = document.querySelector("#product-pager");
  if (!pager) {
    return;
  }
  const pages = metadata?.numberOfPages || 1;
  const current = metadata?.currentPage || 1;
  if (pages <= 1) {
    pager.innerHTML = "";
    return;
  }
  let buttons = "";
  for (let page = 1; page <= pages; page++) {
    const active = page === current ? " is-active" : "";
    const currentPage = page === current ? ' aria-current="page"' : "";
    buttons += `<button type="button" class="${active.trim()}" data-page="${page}" aria-label="Page ${page}"${currentPage}>${page}</button>`;
  }
  pager.innerHTML = buttons;
}

function bindHomeFilters() {
  const searchForm = document.querySelector("#home-search");
  const filterForm = document.querySelector("#product-filters");
  const categoryGrid = document.querySelector("#category-grid");
  const pager = document.querySelector("#product-pager");
  const searchInput = document.querySelector("#site-search");

  const urlKeyword = new URLSearchParams(window.location.search).get("keyword");
  if (urlKeyword && searchInput) {
    searchInput.value = urlKeyword;
    productQuery.keyword = urlKeyword;
  }

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    productQuery.keyword = searchInput?.value.trim() || "";
    productQuery.page = 1;
    getProductsData();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });

  filterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    readFiltersFromForm();
    productQuery.page = 1;
    highlightActiveCategory();
    getProductsData();
  });

  filterForm?.addEventListener("reset", () => {
    window.setTimeout(() => {
      productQuery.sort = "";
      productQuery.category = "";
      productQuery.brand = "";
      productQuery.priceGte = "";
      productQuery.priceLte = "";
      productQuery.keyword = searchInput?.value.trim() || "";
      productQuery.page = 1;
      highlightActiveCategory();
      getProductsData();
    }, 0);
  });

  categoryGrid?.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-category-id]");
    if (!tile) {
      return;
    }
    event.preventDefault();
    productQuery.category = tile.dataset.categoryId;
    productQuery.page = 1;
    const categorySelect = document.querySelector("#filter-category");
    if (categorySelect) {
      categorySelect.value = productQuery.category;
    }
    highlightActiveCategory();
    getProductsData();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });

  pager?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) {
      return;
    }
    productQuery.page = Number(button.dataset.page) || 1;
    getProductsData();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });
}

const productGrid = document.querySelector(".product-grid");
if (productGrid && !productGrid.classList.contains("related-grid")) {
  bindHomeFilters();
  loadFilterOptions().then(highlightActiveCategory);
  getProductsData();
}

if (document.querySelector("#product-detail")) {
  getProductDetails();
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}