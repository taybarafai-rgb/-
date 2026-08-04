/**
 * Admin.gs
 * Admin APIs: dashboard stats, orders management, representatives listing
 */

/**
 * apiAdminDashboardStats
 * Returns basic stats for admin dashboard:
 * - totalOrders
 * - totalSales
 * - totalProducts
 * - totalRepresentatives
 * - pendingPaymentsCount
 * - totalCommissions
 */
function apiAdminDashboardStats() {
  try {
    const orders = DatabaseService.getSheetData('ORDERS') || [];
    const products = DatabaseService.getSheetData('PRODUCTS') || [];
    const reps = DatabaseService.getSheetData('REPRESENTATIVES') || [];
    const payments = DatabaseService.getSheetData('PAYMENTS') || [];
    const commissions = DatabaseService.getSheetData('COMMISSIONS') || [];

    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (Number(o['مبلغ نهایی']) || 0), 0);
    const totalProducts = products.length;
    const totalRepresentatives = reps.length;
    const pendingPaymentsCount = payments.filter(p => String(p['وضعیت بررسی']) === 'pending_review').length;
    const totalCommissions = commissions.reduce((s, c) => s + (Number(c['مبلغ پورسانت']) || 0), 0);

    return ResponseService.success({ totalOrders, totalSales, totalProducts, totalRepresentatives, pendingPaymentsCount, totalCommissions }, 'آمار داشبورد مدیریت');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiAdminListOrders({ query, page, perPage, filter })
 * query can be orderCode, mobile or customer name fragment
 */
function apiAdminListOrders(params) {
  try {
    params = params || {};
    const query = (params.query || '').toString().trim();
    const page = Number(params.page) || 1;
    const perPage = Number(params.perPage) || 50;

    const all = DatabaseService.getSheetData('ORDERS') || [];
    let filtered = all;

    if (query) {
      filtered = all.filter(o => {
        return String(o['کد سفارش']).includes(query) || String(o['شماره موبایل']).includes(query) || String(o['نام مشتری']).includes(query);
      });
    }

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return ResponseService.success({ total, page, perPage, items }, 'لیست سفارش‌ها');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiAdminGetOrderDetails(orderCode)
 */
function apiAdminGetOrderDetails(orderCode) {
  try {
    if (!orderCode) return ResponseService.error('کد سفارش لازم است.');
    const orders = DatabaseService.findByValue('ORDERS', 'کد سفارش', orderCode);
    if (!orders || orders.length === 0) return ResponseService.error('سفارش یافت نشد.');
    const order = orders[0];
    const details = DatabaseService.findByValue('ORDER_DETAILS', 'کد سفارش', orderCode) || [];
    return ResponseService.success({ order, details }, 'جزئیات سفارش');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiAdminUpdateOrderStatus(orderCode, newStatus)
 * newStatus: one of ['new','confirmed','ready_to_ship','shipped','completed','cancelled']
 */
function apiAdminUpdateOrderStatus(orderCode, newStatus) {
  try {
    const allowed = ['new','confirmed','ready_to_ship','shipped','completed','cancelled'];
    if (!orderCode) return ResponseService.error('کد سفارش لازم است.');
    if (!newStatus || allowed.indexOf(newStatus) === -1) return ResponseService.error('وضعیت نامعتبر است.');

    const orders = DatabaseService.findByValue('ORDERS', 'کد سفارش', orderCode);
    if (!orders || orders.length === 0) return ResponseService.error('سفارش یافت نشد.');
    const order = orders[0];

    const orderCols = CONFIG.SHEETS.ORDERS.COLUMNS;
    const update = {};
    // map newStatus to human readable/order sheet values if desired; store english key in sheet's 'وضعیت سفارش'
    update[orderCols[13]] = newStatus; // 'وضعیت سفارش'

    if (typeof DatabaseService.updateRow === 'function') {
      DatabaseService.updateRow('ORDERS', order[orderCols[0]], update);
    } else if (typeof DatabaseService.updateRowById === 'function') {
      DatabaseService.updateRowById('ORDERS', order[orderCols[0]], update);
    } else {
      Logger.log('Admin: cannot update order status, updateRow not available');
    }

    return ResponseService.success({}, 'وضعیت سفارش به‌روزرسانی شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiAdminListRepresentatives({ page, perPage })
 */
function apiAdminListRepresentatives(params) {
  try {
    params = params || {};
    const page = Number(params.page) || 1;
    const perPage = Number(params.perPage) || 50;

    const all = DatabaseService.getSheetData('REPRESENTATIVES') || [];
    const total = all.length;
    const start = (page - 1) * perPage;
    const items = all.slice(start, start + perPage);

    return ResponseService.success({ total, page, perPage, items }, 'لیست نمایندگان');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}
