(() => {
  'use strict';
  const catalogue = window.BIOHALL_CATALOGUE;
  if (!catalogue) return;
  const { products, config } = catalogue;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const selectedVariant = (product, index = product.defaultVariation) => product.variations[index] || { sku: null, label: '', attributes: {}, id: null };
  const productLink = (product) => `single-product.html?product=${encodeURIComponent(product.slug)}`;
  const focusBeforeDialog = new WeakMap();
  function openDialog(dialog) {
    focusBeforeDialog.set(dialog, document.activeElement);
    dialog.showModal();
    document.body.classList.add('cp-modal-open');
  }
  $$('.cp-dialog').forEach((dialog) => {
    $$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!$$('.cp-dialog[open]').length) document.body.classList.remove('cp-modal-open');
      if (dialog.id === 'cp-filter-modal') $('#cp-filter-mount')?.append($('#cp-filters'));
      const focus = focusBeforeDialog.get(dialog);
      if (focus?.isConnected && focus.getClientRects().length) focus.focus({ preventScroll: true });
    });
  });

  function card(product, index) {
    const variant = selectedVariant(product);
    return `<article class="cp-card" data-product-id="${esc(product.id)}"><div class="cp-card-photo"><span class="cp-card-index">${String(index + 1).padStart(2, '0')} / BIOHALL</span><img src="${esc(product.images[0])}" alt="${esc(product.name)}" width="650" height="1000" loading="lazy"></div><div class="cp-card-copy"><span class="cp-category-label">${esc(product.category)}</span><h3>${esc(product.name)}</h3><p>${esc(product.shortDescription)}</p>${variant.sku ? `<div class="cp-card-code">Selected item: ${esc(variant.sku)}</div>` : ''}<a class="cp-view" href="${productLink(product)}">VIEW PRODUCT <span aria-hidden="true">↗</span></a></div></article>`;
  }
  const filterForm = $('#cp-filter-form');
  if (filterForm) {
    let page = 1;
    const query = new URLSearchParams(location.search);
    const initialCategory = query.get('category');
    if (initialCategory) $$('input[name="category"]', filterForm).find((input) => input.value === initialCategory)?.setAttribute('checked', 'checked');
    $('#cp-search').value = query.get('s') || '';
    const grid = $('#cp-product-grid');
    const pagination = $('#cp-pagination');
    function render() {
      const data = new FormData(filterForm);
      const search = String(data.get('s') || '').trim().toLowerCase();
      const category = data.get('category');
      const capacity = data.get('capacity');
      let results = products.filter((product) => {
        if (category !== 'all' && product.categorySlug !== category) return false;
        if (capacity !== 'all' && !product.variations.some((variation) => variation.capacity === capacity)) return false;
        return !search || `${product.name} ${product.category} ${product.variations.map((variation) => variation.sku).join(' ')}`.toLowerCase().includes(search);
      });
      if ($('#cp-sort').value === 'az') results = [...results].sort((a, b) => a.name.localeCompare(b.name));
      if ($('#cp-sort').value === 'za') results = [...results].sort((a, b) => b.name.localeCompare(a.name));
      const pages = Math.max(1, Math.ceil(results.length / config.pageSize));
      page = Math.min(page, pages);
      const start = (page - 1) * config.pageSize;
      const visible = results.slice(start, start + config.pageSize);
      grid.innerHTML = visible.length ? visible.map((product, index) => card(product, start + index)).join('') : '<div class="cp-empty"><h3>No matching products.</h3><p>Try a different category, item code, or capacity, or clear the filters.</p></div>';
      $('#cp-result-count').innerHTML = results.length ? `Showing <strong>${start + 1}–${start + visible.length}</strong> of <strong>${results.length}</strong> selected products` : 'No products match your filters';
      pagination.innerHTML = pages > 1 ? `<button type="button" data-page="${page - 1}" aria-label="Previous product page" ${page === 1 ? 'disabled' : ''}>←</button>${Array.from({ length: pages }, (_, index) => `<button type="button" data-page="${index + 1}" aria-label="Product page ${index + 1}" ${index + 1 === page ? 'aria-current="page"' : ''}>${index + 1}</button>`).join('')}<button type="button" data-page="${page + 1}" aria-label="Next product page" ${page === pages ? 'disabled' : ''}>→</button>` : '';
    }
    filterForm.addEventListener('input', () => { page = 1; render(); });
    filterForm.addEventListener('reset', () => requestAnimationFrame(() => { $('input[name="category"][value="all"]', filterForm).checked = true; $('select[name="capacity"]', filterForm).value = 'all'; $('#cp-search').value = ''; page = 1; render(); }));
    filterForm.addEventListener('submit', (event) => event.preventDefault());
    $('#cp-sort').addEventListener('change', () => { page = 1; render(); });
    pagination.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page); render();
      $('.cp-toolbar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      $('button[aria-current]', pagination)?.focus({ preventScroll: true });
    });
    const filterModal = $('#cp-filter-modal');
    $('#cp-filter-toggle').addEventListener('click', () => {
      $('#cp-filter-dialog-mount').append($('#cp-filters'));
      openDialog(filterModal);
      $('#cp-search').focus();
    });
    $('.cp-filter-apply').addEventListener('click', () => filterModal.close());
    matchMedia('(min-width: 901px)').addEventListener('change', (event) => { if (event.matches && filterModal.open) filterModal.close(); });
    render();
  }

  if (!$('#cp-product-root')) return;
  const query = new URLSearchParams(location.search);
  const product = products.find((item) => item.slug === (query.get('product') || catalogue.featured));
  if (!product) {
    $('#catalogue-main').innerHTML = '<section class="cp-section"><div class="container shell cp-empty"><h1>Product not found.</h1><p>This item is not included in the preview catalogue.</p><a class="cp-button" href="products.html">Explore Products <span aria-hidden="true">↗</span></a></div></section>';
    return;
  }
  let variationIndex = product.defaultVariation;
  let activeImage = 0;
  let downloadUrl = null;
  const productRoot = $('#cp-product-root');
  productRoot.dataset.productId = product.id || '';
  $('#cp-product-title').textContent = product.name;
  $('#cp-product-category').textContent = product.category;
  $('#cp-product-description').textContent = product.shortDescription;
  $('#cp-product-source').href = product.url;
  $('#cp-breadcrumb-category').textContent = product.category;
  $('#cp-breadcrumb-category').href = `products.html?category=${encodeURIComponent(product.categorySlug)}`;
  $('#cp-breadcrumb-product').textContent = product.name;
  $('#cp-product-features').innerHTML = product.features.slice(0, 4).map((feature) => `<li>${esc(feature)}</li>`).join('');
  document.title = `${product.name} | Biohall Labware`;
  function changeImage(index) {
    activeImage = index;
    $('#cp-main-image').src = product.images[index];
    $('#cp-main-image').alt = product.name;
    $('#cp-lightbox-image').src = product.images[index];
    $('#cp-lightbox-image').alt = product.name;
    $('#cp-image-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(product.images.length).padStart(2, '0')}`;
    $$('.cp-thumbnail').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  $('#cp-thumbnails').innerHTML = product.images.length > 1 ? product.images.map((image, index) => `<button type="button" class="cp-thumbnail" data-image-index="${index}" aria-label="Show product photograph ${index + 1}" aria-pressed="${index === 0}"><img src="${esc(image)}" alt=""></button>`).join('') : '';
  $('#cp-thumbnails').addEventListener('click', (event) => { const button = event.target.closest('[data-image-index]'); if (button) changeImage(Number(button.dataset.imageIndex)); });
  changeImage(0);
  $('#cp-zoom').addEventListener('click', () => { $('#cp-lightbox-title').textContent = product.name; openDialog($('#cp-lightbox')); });
  const select = $('#cp-variation');
  $('#cp-variation-region').hidden = !product.variations.length;
  select.innerHTML = product.variations.map((variation, index) => `<option value="${index}">${esc(variation.label)}${variation.sku ? ` — ${esc(variation.sku)}` : ''}</option>`).join('');
  select.value = String(variationIndex);
  function specsTable() {
    return product.rows.length ? `<div class="cp-table-scroll"><table class="cp-table"><caption>Manufacturer-published item codes and specifications. Highlighted row: selected item.</caption><thead><tr>${product.headers.map((header) => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${product.rows.map((row, index) => `<tr data-selected="${index === variationIndex}">${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p>Technical data has not been published in this preview record. Consult the manufacturer’s product page.</p>';
  }
  function updateVariation() {
    const variation = selectedVariant(product, variationIndex);
    $('#cp-product-sku').textContent = variation.sku ? `Selected item code: ${variation.sku}` : 'Refer to the manufacturer’s item specification';
    const specifications = Object.entries(variation.attributes).filter(([key]) => !/code/i.test(key));
    $('#cp-quick-specs').innerHTML = specifications.slice(0, 3).map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('');
    $('#cp-specification-table').innerHTML = specsTable();
    const attributes = [['Product category', product.category], ...(product.material ? [['Material', product.material]] : []), ...Object.entries(variation.attributes)];
    $('#cp-additional-content').innerHTML = `<table class="cp-table cp-attributes"><tbody>${attributes.map(([key, value]) => `<tr><th scope="row">${esc(key)}</th><td>${esc(value)}</td></tr>`).join('')}</tbody></table><p class="cp-prototype-note">Item-code options reflect the published specification table. WooCommerce variation IDs will be supplied during integration.</p>`;
    const message = `Hello Biohall Team, I would like to enquire about the following product:\n\nProduct: ${product.name}\n${variation.sku ? `SKU: ${variation.sku}\n` : ''}${variation.label ? `Selected option: ${variation.label}\n` : ''}Product URL: ${product.url}\n\nPlease share more information regarding availability, specifications, and quotation.`;
    const whatsapp = $('#cp-whatsapp');
    if (/^\d{8,15}$/.test(config.whatsappNumber || '')) whatsapp.href = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    else { whatsapp.removeAttribute('href'); whatsapp.setAttribute('aria-disabled', 'true'); }
  }
  select.addEventListener('change', () => { variationIndex = Number(select.value); updateVariation(); });
  updateVariation();
  $('#cp-panel-description').innerHTML = `<h2>Considered for laboratory work.</h2><p>${esc(product.shortDescription)}</p>${product.features.length ? `<ul>${product.features.map((feature) => `<li>${esc(feature)}</li>`).join('')}</ul>` : ''}<a class="cp-source-link" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer">Full manufacturer product record ↗</a>`;
  $('#cp-applications-content').innerHTML = product.applications.length ? `<ul>${product.applications.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><p>Confirm the selected item’s suitability for your process with the Biohall team.</p>` : '<p>Contact Biohall to confirm application suitability for this specific product and selected item code.</p>';
  $('#cp-downloads-content').innerHTML = product.documents.map((document) => `<a class="cp-document" href="${esc(document.url)}" target="_blank" rel="noopener noreferrer"><div>${esc(document.title)}<small>${esc(document.type)} / Manufacturer catalogue</small></div><span aria-hidden="true">↓</span></a>`).join('') + '<p class="cp-prototype-note">General manufacturer catalogue. No product-specific datasheet is presented unless one is published.</p>';
  const related = products.filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug).slice(0, 3);
  $('#cp-related').hidden = !related.length;
  $('#cp-related-grid').innerHTML = related.map((item, index) => card(item, index)).join('');
  function activateTab(key, focus = false) {
    $$('.cp-tabs [role="tab"]').forEach((tab) => { const selected = tab.dataset.tab === key; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; if (selected && focus) tab.focus(); });
    $$('.cp-panel').forEach((panel) => { panel.hidden = panel.id !== `cp-panel-${key}`; });
  }
  $$('.cp-tabs [role="tab"]').forEach((tab, index, tabs) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activateTab(tabs[next].dataset.tab, true); }
    });
  });
  activateTab('description');

  const quoteForm = $('#cp-quote-form');
  function field(name) { return quoteForm.elements.namedItem(name); }
  $('#cp-get-quote').addEventListener('click', () => {
    const variation = selectedVariant(product, variationIndex);
    $('#cp-quote-product').textContent = product.name;
    $('#cp-quote-code').textContent = [variation.sku, variation.label].filter(Boolean).join(' / ');
    $('#cp-quote-image').src = product.images[activeImage];
    field('product_name').value = product.name;
    field('product_sku').value = variation.sku || '';
    field('product_id').value = product.id || '';
    field('product_url').value = product.url;
    field('selected_variation').value = variation.label;
    field('variation_id').value = variation.id || '';
    $('#cp-form-status').hidden = true;
    openDialog($('#cp-quote-modal'));
    field('full_name').focus();
  });
  quoteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(quoteForm));
    payload.quantity = Number(payload.quantity);
    payload.selected_attributes = selectedVariant(product, variationIndex).attributes;
    const submit = $('#cp-submit-inquiry');
    const status = $('#cp-form-status');
    submit.disabled = true; submit.textContent = 'Preparing inquiry…'; quoteForm.setAttribute('aria-busy', 'true');
    status.hidden = true;
    try {
      if (config.quoteEndpoint) {
        const response = await fetch(config.quoteEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('The inquiry service could not accept this request. Please contact the team directly.');
        status.textContent = 'Your inquiry has been submitted to the configured inquiry service.';
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        const text = `BIOHALL PRODUCT INQUIRY\n\n${Object.entries(payload).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join('\n')}`;
        downloadUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
        status.innerHTML = `<strong>Inquiry prepared — nothing has been sent.</strong><br>This static prototype has no submission endpoint. Download your inquiry or open a draft in your email app.<br><a href="${downloadUrl}" download="biohall-product-inquiry.txt">Download inquiry</a> &nbsp; · &nbsp; <a href="mailto:${config.email}?subject=${encodeURIComponent(`Product inquiry: ${product.name}`)}&body=${encodeURIComponent(text)}">Open email draft</a>`;
      }
    } catch (error) {
      status.textContent = error.message || 'The inquiry could not be prepared. Please contact Biohall directly.';
    } finally {
      status.hidden = false; submit.disabled = false; submit.innerHTML = 'Submit Inquiry <span aria-hidden="true">↗</span>'; quoteForm.removeAttribute('aria-busy');
    }
  });
})();
