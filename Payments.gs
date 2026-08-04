/**
 * Payments.gs
 * Payment submission and admin verification logic
 */

/**
 * Submit a payment receipt for an order.
 * paymentPayload: { orderCode, mobile, amount, paymentMethod, receiptImageUrl, description }
 */
function apiSubmitPaymentReceipt(paymentPayload) {
  try {
    if (!paymentPayload) return ResponseService.error('پِیلود پرداخت نامعتبر است.');

    const orderCode = paymentPayload.orderCode || '';
    const mobile = paymentPayload.mobile || '';
    const amount = Number(paymentPayload.amount) || 0;
    const method = paymentPayload.paymentMethod || '';
    const receipt = paymentPayload.receiptImageUrl || '';
    const description = paymentPayload.description || '';

    if (!orderCode) return ResponseService.error('کد سفارش لازم است.');
    if (!mobile) return ResponseService.error('شماره موبایل لازم است.');
    if (!amount || amount <= 0) return ResponseService.error('مبلغ پرداخت باید عددی بزرگتر از صفر باشد.');

    // find order by orderCode
    const orders = DatabaseService.findByValue('ORDERS', 'کد سفارش', orderCode);
    if (!orders || orders.length === 0) return ResponseService.error('سفارش با این کد یافت نشد.');
    const order = orders[0];

    // prepare payment row using CONFIG columns
    const cols = CONFIG.SHEETS.PAYMENTS.COLUMNS;
    const paymentId = DatabaseService.generateId();
    const now = Utils.now();
    const row = {};

    // map with safety: ensure cols length
    row[cols[0]] = paymentId; // 'شناسه پرداخت'
    row[cols[1]] = orderCode; // 'کد سفارش'
    row[cols[2]] = mobile; // 'شماره موبایل مشتری'
    row[cols[3]] = amount; // 'مبلغ پرداختی'
    row[cols[4]] = method; // 'روش پرداخت'
    row[cols[5]] = receipt; // 'تصویر رسید'
    row[cols[6]] = now; // 'تاریخ ارسال رسید'
    row[cols[7]] = 'pending_review'; // 'وضعیت بررسی'
    // notes column is cols[8] if exists
    if (cols.length > 8) row[cols[8]] = description;

    DatabaseService.addRow('PAYMENTS', row);

    // update order payment status to pending_review using updateRowById
    const orderUpdate = {};
    orderUpdate['وضعیت پرداخت'] = 'pending_review';

    try {
      if (typeof DatabaseService.updateRowById === 'function') {
        DatabaseService.updateRowById('ORDERS', 'کد سفارش', orderCode, orderUpdate);
      } else {
        Logger.log('Payments: updateRowById not available when updating order status.');
      }
    } catch (e) {
      Logger.log('Payments: failed to update order payment status for order %s: %s', orderCode, e && e.message ? e.message : e);
    }

    return ResponseService.success({ paymentId: paymentId, status: 'pending_review' }, 'رسید پرداخت با موفقیت ثبت شد و در انتظار بررسی قرار گرفت.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * Get payments by orderCode
 */
function getPaymentByOrder(orderCode) {
  try {
    if (!orderCode) return [];
    const all = DatabaseService.getSheetData('PAYMENTS') || [];
    return all.filter(r => String(r['کد سفارش']) === String(orderCode));
  } catch (err) {
    return [];
  }
}

/**
 * Get payment by its paymentId
 */
function getPaymentById(paymentId) {
  try {
    if (!paymentId) return null;
    const rows = DatabaseService.findByValue('PAYMENTS', 'شناسه پرداخت', paymentId) || [];
    return rows.length ? rows[0] : null;
  } catch (err) {
    return null;
  }
}

/**
 * List payments with optional filter { status }
 */
function listPayments(filter) {
  try {
    const all = DatabaseService.getSheetData('PAYMENTS') || [];
    if (!filter || !filter.status) return all;
    return all.filter(r => String(r['وضعیت بررسی']) === String(filter.status));
  } catch (err) {
    return [];
  }
}

/**
 * Admin verifies payment. status: 'approved' or 'rejected'
 */
function adminVerifyPayment(paymentId, status, note) {
  try {
    if (!paymentId) return ResponseService.error('شناسه پرداخت لازم است.');
    if (!status || (status !== 'approved' && status !== 'rejected')) return ResponseService.error('وضعیت نامعتبر است.');

    const payments = DatabaseService.findByValue('PAYMENTS', 'شناسه پرداخت', paymentId) || [];
    if (!payments || payments.length === 0) return ResponseService.error('پرداخت مورد نظر یافت نشد.');
    const payment = payments[0];

    const cols = CONFIG.SHEETS.PAYMENTS.COLUMNS;
    const update = {};
    // safely update status column (index 7)
    const statusCol = cols[7] || 'وضعیت بررسی';
    update[statusCol] = status;

    // optional admin note: column index 8 exists?
    if (cols.length > 8) {
      update[cols[8]] = note || '';
    }

    // attempt to update row via updateRowById
    try {
      if (typeof DatabaseService.updateRowById === 'function') {
        DatabaseService.updateRowById('PAYMENTS', cols[0], payment[cols[0]], update);
      } else {
        Logger.log('Payments.adminVerifyPayment: updateRowById not available');
      }
    } catch (e) {
      Logger.log('Payments.adminVerifyPayment: update payment error: %s', e && e.message ? e.message : e);
    }

    // update related order payment status accordingly
    const orders = DatabaseService.findByValue('ORDERS', 'کد سفارش', payment['کد سفارش']) || [];
    if (orders && orders.length) {
      const order = orders[0];
      const orderUpdate = {};
      if (status === 'approved') {
        orderUpdate['وضعیت پرداخت'] = 'paid';
        orderUpdate['وضعیت سفارش'] = 'confirmed';
      } else if (status === 'rejected') {
        orderUpdate['وضعیت پرداخت'] = 'rejected';
      }

      try {
        if (typeof DatabaseService.updateRowById === 'function') {
          DatabaseService.updateRowById('ORDERS', 'کد سفارش', order['کد سفارش'], orderUpdate);
        } else {
          Logger.log('Payments.adminVerifyPayment: could not update ORDERS, updateRowById not available');
        }
      } catch (e) {
        Logger.log('Payments.adminVerifyPayment: update order error: %s', e && e.message ? e.message : e);
      }
    }

    return ResponseService.success({}, 'وضعیت پرداخت به‌روزرسانی شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}
