/**
 * Orders.gs
 * Order creation logic for لبیک یا مهدی
 * - apiCustomerPlaceOrder(orderPayload)
 * - testPlaceOrderSample()
 *
 * Conventions:
 * - Uses DatabaseService and CONFIG from Config.gs
 * - Does NOT change inventory
 * - Uses LockService to avoid race conditions on writes
 * - orderCode format: YYYYMMDD-XXXX
 */

/**
 * Build a human-friendly order code: YYYYMMDD-XXXX
 * where XXXX are the first 4 characters of a generated UUID (alphanumeric uppercase)
 */
function _buildOrderCode() {
  const datePart = Utilities.formatDate(new Date(), CONFIG.APP.TIMEZONE, 'yyyyMMdd');
  const raw = DatabaseService.generateId() || Utilities.getUuid();
  const clean = String(raw).replace(/[^A-Z0-9]/ig, '').toUpperCase();
  const suffix = clean.slice(0, 4) || clean;
  return `${datePart}-${suffix}`;
}

/**
 * Internal helper: map and create an ORDERS row object according to CONFIG.SHEETS.ORDERS.COLUMNS
 */
function _buildOrderRow({ orderId, orderCode, customer, shipping, repCode, totals, notes }) {
  const cols = CONFIG.SHEETS.ORDERS.COLUMNS;
  const now = Utils.now();
  const row = {};

  // Fill based on column names in Config.gs
  row[cols[0]] = orderId; // 'شناسه سفارش'
  row[cols[1]] = orderCode; // 'کد سفارش'
  row[cols[2]] = now; // 'تاریخ ثبت'
  row[cols[3]] = customer.id || ''; // 'شناسه مشتری'
  row[cols[4]] = (customer.firstName || '') + (customer.lastName ? ' ' + customer.lastName : ''); // 'نام مشتری'
  row[cols[5]] = customer.mobile || ''; // 'شماره موبایل'
  row[cols[6]] = shipping.province || (customer.province || ''); // 'استان'
  row[cols[7]] = shipping.city || (customer.city || ''); // 'شهر'
  row[cols[8]] = shipping.address || (customer.address || ''); // 'آدرس'
  row[cols[9]] = repCode || ''; // 'کد نماینده'
  row[cols[10]] = totals.productsTotal || 0; // 'جمع محصولات'
  row[cols[11]] = totals.shippingCost || 0; // 'هزینه ارسال'
  row[cols[12]] = totals.finalTotal || 0; // 'مبلغ نهایی'
  row[cols[13]] = 'new'; // 'وضعیت سفارش'
  row[cols[14]] = 'unpaid'; // 'وضعیت پرداخت'
  row[cols[15]] = notes || '';

  return row;
}

/**
 * Internal helper: build ORDER_DETAILS row for a single item
 */
function _buildOrderDetailRow({ detailId, orderCode, product, qty }) {
  const cols = CONFIG.SHEETS.ORDER_DETAILS.COLUMNS;
  const row = {};

  row[cols[0]] = detailId; // 'شناسه جزئیات'
  row[cols[1]] = orderCode; // 'کد سفارش'
  row[cols[2]] = product.code || ''; // 'کد محصول'
  row[cols[3]] = product.name || ''; // 'نام محصول'
  row[cols[4]] = product.material || ''; // 'جنس'
  row[cols[5]] = product.size || ''; // 'سایز'
  row[cols[6]] = qty || 0; // 'تعداد'
  row[cols[7]] = product.price || 0; // 'قیمت واحد'
  row[cols[8]] = (Number(product.price) || 0) * (Number(qty) || 0); // 'مبلغ کل'

  return row;
}

/**
 * Public API: place an order from the customer frontend.
 * orderPayload structure (example):
 * {
 *   customer: { id?, firstName, lastName, mobile, province, city, address },
 *   items: [ { productCode, qty }, ... ],
 *   shipping: { province, city, address, cost? },
 *   representativeCode: 'REP123', // optional
 *   notes: '...'
 * }
 */
function apiCustomerPlaceOrder(orderPayload) {
  try {
    // Basic validation
    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return ResponseService.error('پِیلود سفارش نامعتبر است. حداقل یک قلم سفارش لازم است.');
    }

    // Normalize payload
    const customer = orderPayload.customer || {};
    const items = orderPayload.items.map((it) => ({ productCode: it.productCode, qty: Number(it.qty) || 0 }));
    const shipping = orderPayload.shipping || {};
    const repCode = orderPayload.representativeCode || '';
    const notes = orderPayload.notes || '';

    // Validate items and gather product data
    const productRows = [];
    let productsTotal = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productCode) return ResponseService.error('کد محصول برای یکی از اقلام ارسال نشده است.');
      if (!it.qty || it.qty <= 0) return ResponseService.error('تعداد باید عددی بزرگتر از صفر باشد.');

      const product = ProductService.getProductByCode(it.productCode);
      if (!product) return ResponseService.error(`محصول با کد ${it.productCode} یافت نشد.`);

      productRows.push({ product, qty: it.qty });
      const unit = Number(product.price) || 0;
      productsTotal += unit * Number(it.qty);
    }

    const shippingCost = Number(shipping.cost) || 0;
    const finalTotal = productsTotal + shippingCost;

    // Lock to prevent concurrent writes
    const lock = LockService.getScriptLock();
    const gotLock = lock.tryLock(10000);
    if (!gotLock) {
      return ResponseService.error('سیستم در حال پردازش است، لطفاً لحظاتی بعد تلاش کنید.');
    }

    try {
      // IDs
      const orderId = DatabaseService.generateId();
      const orderCode = _buildOrderCode();

      // Build and add ORDERS row
      const orderRow = _buildOrderRow({ orderId, orderCode, customer, shipping, repCode, totals: { productsTotal, shippingCost, finalTotal }, notes });
      DatabaseService.addRow('ORDERS', orderRow);

      // Create ORDER_DETAILS rows
      for (let j = 0; j < productRows.length; j++) {
        const pr = productRows[j];
        const detailId = DatabaseService.generateId();
        const detailRow = _buildOrderDetailRow({ detailId, orderCode, product: pr.product, qty: pr.qty });
        DatabaseService.addRow('ORDER_DETAILS', detailRow);
      }

      return ResponseService.success({ orderId: orderId, orderCode: orderCode }, 'سفارش با موفقیت ثبت شد.');
    } finally {
      try { lock.releaseLock(); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * Test helper: creates a sample order payload and calls apiCustomerPlaceOrder.
 * NOTE: This function is intended to be executed from the GAS editor for testing.
 */
function testPlaceOrderSample() {
  const sample = {
    customer: {
      firstName: 'مشتری',
      lastName: 'آزمایشی',
      mobile: '09120000000',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان آزمایش'
    },
    items: [ { productCode: (DatabaseService.getSheetData('PRODUCTS')[0] || {})['کد محصول'] || '', qty: 1 } ],
    shipping: { province: 'تهران', city: 'تهران', address: 'خیابان آزمایش', cost: 0 },
    representativeCode: '',
    notes: 'سفارش آزمایشی توسط testPlaceOrderSample'
  };

  // If no productCode is found, return an informative error instead of trying to place an empty order
  if (!sample.items[0].productCode) {
    return ResponseService.error('هیچ محصولی در شیت PRODUCTS یافت نشد. برای اجرای تست حداقل یک محصول در شیت نیاز است.');
  }

  return apiCustomerPlaceOrder(sample);
}
