/**
 * Commissions.gs
 * Manage commission calculation and records for representatives
 */

const CommissionService = Object.freeze({
  calculateCommission(saleAmount, percent) {
    const s = Number(saleAmount) || 0;
    const p = Number(percent) || 0;
    return Math.round((s * p) / 100 * 100) / 100; // round to 2 decimals
  }
});

/**
 * Add a commission record to the COMMISSIONS sheet.
 * payload: { repCode, orderCode, saleAmount, percent }
 */
function addCommissionRecord(payload) {
  try {
    if (!payload || !payload.repCode || !payload.orderCode) return ResponseService.error('پارامترهای لازم برای ثبت پورسانت ناقص است.');

    const repCode = payload.repCode;
    const orderCode = payload.orderCode;
    const saleAmount = Number(payload.saleAmount) || 0;
    const percent = (typeof payload.percent !== 'undefined') ? payload.percent : '';

    const commissionAmount = CommissionService.calculateCommission(saleAmount, percent);

    const cols = CONFIG.SHEETS.COMMISSIONS.COLUMNS;
    const id = DatabaseService.generateId();
    const row = {};

    row[cols[0]] = id; // 'شناسه پورسانت'
    row[cols[1]] = repCode; // 'کد نماینده'
    row[cols[2]] = orderCode; // 'کد سفارش'
    row[cols[3]] = saleAmount; // 'مبلغ فروش'
    row[cols[4]] = percent; // 'درصد پورسانت'
    row[cols[5]] = commissionAmount; // 'مبلغ پورسانت'
    row[cols[6]] = 'pending'; // 'وضعیت'

    DatabaseService.addRow('COMMISSIONS', row);

    return ResponseService.success({ id, repCode, orderCode, saleAmount, percent, commissionAmount }, 'پورسانت با موفقیت ثبت شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * Get commissions for a representative (returns array). Uses DatabaseService.getSheetData and filters.
 */
function getCommissionsByRep(repCode) {
  try {
    if (!repCode) return [];
    const all = DatabaseService.getSheetData('COMMISSIONS');
    return all.filter((r) => String(r['کد نماینده']) === String(repCode));
  } catch (err) {
    return [];
  }
}
