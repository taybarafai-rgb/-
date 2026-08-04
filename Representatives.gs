/**
 * Representatives.gs
 * Affiliate/Representative service: register reps, lookup by code, generate links, and profile API
 */

const RepresentativeService = Object.freeze({
  generateRepCode() {
    // Short rep code: 6 uppercase alphanumeric characters from UUID
    const raw = DatabaseService.generateId() || Utilities.getUuid();
    return String(raw).replace(/[^A-Z0-9]/ig, '').toUpperCase().slice(0, 6);
  },

  getRepresentativeByCode(repCode) {
    if (!repCode) return null;
    const rows = DatabaseService.findByValue('REPRESENTATIVES', 'کد نماینده', repCode);
    return rows && rows.length ? rows[0] : null;
  },

  generateAffiliateLink(repCode) {
    // base URL: use ScriptApp.getService().getUrl() isn't available in all contexts; fallback to empty
    // We'll return a relative query parameter link that the front-end can transform if needed
    // However, Google Apps Script web app URL is available via ScriptApp.getService().getUrl() in deployed webapps
    let baseUrl = '';
    try {
      baseUrl = ScriptApp.getService().getUrl() || '';
    } catch (e) {
      // ignore — fallback to empty and front-end should use window.location
    }

    if (baseUrl) return `${baseUrl}?ref=${repCode}`;
    return `?ref=${repCode}`;
  }
});

/**
 * Public API to register a representative
 * repData: { firstName, lastName, mobile, province, city, percent, notes }
 */
function apiRegisterRepresentative(repData) {
  try {
    if (!repData || !repData.mobile) return ResponseService.error('داده‌های نماینده ناقص است. حداقل شماره موبایل لازم است.');

    const repCode = RepresentativeService.generateRepCode();
    const repId = DatabaseService.generateId();
    const now = Utils.now();

    const cols = CONFIG.SHEETS.REPRESENTATIVES.COLUMNS;
    const row = {};

    row[cols[0]] = repId; // 'شناسه نماینده'
    row[cols[1]] = repCode; // 'کد نماینده'
    row[cols[2]] = repData.firstName || '';
    row[cols[3]] = repData.lastName || '';
    row[cols[4]] = repData.mobile || '';
    row[cols[5]] = repData.province || '';
    row[cols[6]] = repData.city || '';
    row[cols[7]] = (typeof repData.percent !== 'undefined') ? repData.percent : '';
    row[cols[8]] = 'active'; // 'وضعیت فعالیت'
    row[cols[9]] = RepresentativeService.generateAffiliateLink(repCode); // 'لینک اختصاصی'
    row[cols[10]] = now; // 'تاریخ ثبت'
    row[cols[11]] = repData.notes || '';

    DatabaseService.addRow('REPRESENTATIVES', row);

    return ResponseService.success({ repId, repCode, affiliateLink: row[cols[9]] }, 'نماینده با موفقیت ثبت شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}

/**
 * Public API: get affiliate profile by code
 */
function apiGetAffiliateProfile(repCode) {
  try {
    if (!repCode) return ResponseService.error('کد نماینده وارد نشده است.');
    const rep = RepresentativeService.getRepresentativeByCode(repCode);
    if (!rep) return ResponseService.error('نماینده‌ای با این کد یافت نشد.');

    // For now, return representative row and let Commissions.gs be used to fetch commissions
    const commissions = (typeof getCommissionsByRep === 'function') ? getCommissionsByRep(repCode) : [];

    return ResponseService.success({ representative: rep, commissions: commissions }, 'پروفایل نماینده دریافت شد.');
  } catch (err) {
    return ResponseService.error(err.message || String(err));
  }
}
