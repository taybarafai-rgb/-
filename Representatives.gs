/**
 * Representatives.gs additions: Affiliate dashboard APIs
 */

/**
 * apiGetAffiliateDashboard(repCode)
 * returns: { rep: <row>, ordersCount, totalSales, totalCommissions }
 */
function apiGetAffiliateDashboard(repCode) {
  try {
    if (!repCode) return ResponseService.error('کد نماینده لازم است.');
    const rep = RepresentativeService.getRepresentativeByCode(repCode);
    if (!rep) return ResponseService.error('نماینده یافت نشد.');

    const allOrders = DatabaseService.getSheetData('ORDERS') || [];
    const repOrders = allOrders.filter(o => String(o['کد نماینده']) === String(repCode));
    const ordersCount = repOrders.length;
    const totalSales = repOrders.reduce((s, o) => s + (Number(o['مبلغ نهایی']) || 0), 0);

    const allComms = DatabaseService.getSheetData('COMMISSIONS') || [];
    const repComms = allComms.filter(c => String(c['کد نماینده']) === String(repCode));
    const totalCommissions = repComms.reduce((s, c) => s + (Number(c['مبلغ پورسانت']) || 0), 0);

    return ResponseService.success({ representative: rep, ordersCount, totalSales, totalCommissions }, 'آمار نماینده');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiGetAffiliateOrders(repCode, params)
 * params: { page, perPage }
 */
function apiGetAffiliateOrders(repCode, params) {
  try {
    if (!repCode) return ResponseService.error('کد نماینده لازم است.');
    params = params || {};
    const page = Number(params.page) || 1;
    const perPage = Number(params.perPage) || 50;

    const allOrders = DatabaseService.getSheetData('ORDERS') || [];
    const repOrders = allOrders.filter(o => String(o['کد نماینده']) === String(repCode));
    const total = repOrders.length;
    const start = (page - 1) * perPage;
    const items = repOrders.slice(start, start + perPage);

    return ResponseService.success({ total, page, perPage, items }, 'سفارشات نماینده');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * apiGetAffiliateCommissions(repCode, params)
 * params: { page, perPage }
 */
function apiGetAffiliateCommissions(repCode, params) {
  try {
    if (!repCode) return ResponseService.error('کد نماینده لازم است.');
    params = params || {};
    const page = Number(params.page) || 1;
    const perPage = Number(params.perPage) || 50;

    const allComms = DatabaseService.getSheetData('COMMISSIONS') || [];
    const repComms = allComms.filter(c => String(c['کد نماینده']) === String(repCode));
    const total = repComms.length;
    const start = (page - 1) * perPage;
    const items = repComms.slice(start, start + perPage);

    return ResponseService.success({ total, page, perPage, items }, 'پورسانت‌های نماینده');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}
