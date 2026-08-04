/**
 * Shared utility helpers used by backend services.
 */
const Utils = Object.freeze({
  generateUuid() {
    return Utilities.getUuid();
  },

  now() {
    return Utilities.formatDate(new Date(), CONFIG.APP.TIMEZONE, 'yyyy/MM/dd HH:mm:ss');
  },

  normalizeProductCode(value) {
    return this.toEnglishDigits(String(value || ''))
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
  },

  normalizeMobile(value) {
    return this.toEnglishDigits(String(value || ''))
      .trim()
      .replace(/[\s-]/g, '');
  },

  toEnglishDigits(value) {
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    const arabic = '٠١٢٣٤٥٦٧٨٩';

    return String(value || '').replace(/[۰-۹٠-٩]/g, (digit) => {
      const persianIndex = persian.indexOf(digit);
      if (persianIndex > -1) return String(persianIndex);

      const arabicIndex = arabic.indexOf(digit);
      if (arabicIndex > -1) return String(arabicIndex);

      return digit;
    });
  }
});
