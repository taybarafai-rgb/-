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

    // prepare payment row
    const cols = CONFIG.SHEETS.PAYMENTS.COLUMNS;
    const paymentId = DatabaseService.generateId();
    const now = Utils.now();
    const row = {};

    row[cols[0]] = paymentId; // 'شناسه پرداخت'
    row[cols[1]] = orderCode; // 'کد سفارش'
    row[cols[2]] = mobile; // 'شماره موبایل'
    row[cols[3]] = amount; // 'مبلغ'
    row[cols[4]] = method; // 'روش پرداخت'
    row[cols[5]] = receipt; // 'لینک رسید'
    row[cols[6]] = 'pending_review'; // 'وضعیت'
    row[cols[7]] = now; // 'تاریخ ثبت'
    row[cols[8]] = description; // 'توضیحات'

    DatabaseService.addRow('PAYMENTS', row);

    // update order payment status to pending_review
    const orderCols = CONFIG.SHEETS.ORDERS.COLUMNS;
    const orderUpdate = {};
    orderUpdate[orderCols[14]] = 'pending_review'; // assuming col 14 is payment status (index may vary)
    // Use DatabaseService.updateRowById if available, else update via find and replace
    if (typeof DatabaseService.updateRow === 'function') {
      DatabaseService.updateRow('ORDERS', order[orderCols[0]], orderUpdate);
    } else if (typeof DatabaseService.updateRowById === 'function') {
      DatabaseService.updateRowById('ORDERS', order[orderCols[0]], orderUpdate);
    } else {
      // best effort: write a warning to Logger (no destructive actions)
      Logger.log('Payments: could not update ORDERS payment status automatically (DatabaseService.updateRow not available).');
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
    const all = DatabaseService.getSheetData('PAYMENTS');
    return all.filter(r => String(r['کد سفارش']) === String(orderCode));
  } catch (err) {
    return [];
  }
}

/**
 * List payments with optional filter { status }
 */
function listPayments(filter) {
  try {
    const all = DatabaseService.getSheetData('PAYMENTS') || [];
    if (!filter || !filter.status) return all;
    return all.filter(r => String(r['وضعیت']) === String(filter.status));
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

    const payments = DatabaseService.findByValue('PAYMENTS', 'شناسه پرداخت', paymentId);
    if (!payments || payments.length === 0) return ResponseService.error('پرداخت مورد نظر یافت نشد.');
    const payment = payments[0];

    const cols = CONFIG.SHEETS.PAYMENTS.COLUMNS;
    const update = {};
    update[cols[6]] = status; // update status column
    update[cols[9]] = note || ''; // optional admin note column (if exists)
    update[cols[10]] = Utils.now(); // verified_at (if column exists)

    // try to update payment row
    if (typeof DatabaseService.updateRow === 'function') {
      DatabaseService.updateRow('PAYMENTS', payment[cols[0]], update);
    } else if (typeof DatabaseService.updateRowById === 'function') {
      DatabaseService.updateRowById('PAYMENTS', payment[cols[0]], update);
    } else {
      Logger.log('Payments.adminVerifyPayment: updateRow not available');
    }

    // update order payment status accordingly
    const orderCols = CONFIG.SHEETS.ORDERS.COLUMNS;
    const orders = DatabaseService.findByValue('ORDERS', 'کد سفارش', payment['کد سفارش']);
    if (orders && orders.length) {
      const order = orders[0];
      const orderUpdate = {};
      if (status === 'approved') {
        orderUpdate[orderCols[14]] = 'paid';
        // optionally update order status to confirmed
        orderUpdate[orderCols[13]] = 'confirmed';
      } else if (status === 'rejected') {
        orderUpdate[orderCols[14]] = 'rejected';
      }

      if (typeof DatabaseService.updateRow === 'function') {
        DatabaseService.updateRow('ORDERS', order[orderCols[0]], orderUpdate);
      } else if (typeof DatabaseService.updateRowById === 'function') {
        DatabaseService.updateRowById('ORDERS', order[orderCols[0]], orderUpdate);
      } else {
        Logger.log('Payments.adminVerifyPayment: could not update ORDERS, updateRow not available');
      }
    }

    return ResponseService.success({}, 'وضعیت پرداخت به‌روزرسانی شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}
