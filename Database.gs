/**
 * Centralized Google Sheets access layer.
 * No other backend file should read from or write to SpreadsheetApp directly.
 */
const DatabaseService = Object.freeze({
  getSpreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  getSheetConfig(sheetKeyOrName) {
    const directConfig = CONFIG.SHEETS[sheetKeyOrName];
    if (directConfig) return directConfig;

    const matchingKey = Object.keys(CONFIG.SHEETS).find((key) => CONFIG.SHEETS[key].NAME === sheetKeyOrName);
    if (matchingKey) return CONFIG.SHEETS[matchingKey];

    throw new Error(`Unknown sheet: ${sheetKeyOrName}`);
  },

  getSheet(sheetKeyOrName) {
    const sheetConfig = this.getSheetConfig(sheetKeyOrName);
    return this.getSpreadsheet().getSheetByName(sheetConfig.NAME);
  },

  ensureSheet(sheetKeyOrName) {
    const spreadsheet = this.getSpreadsheet();
    const sheetConfig = this.getSheetConfig(sheetKeyOrName);
    let sheet = spreadsheet.getSheetByName(sheetConfig.NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetConfig.NAME);
    }

    this.ensureHeaders(sheet, sheetConfig.COLUMNS);
    return sheet;
  },

  ensureAllSheets() {
    const createdOrVerifiedSheets = Object.keys(CONFIG.SHEETS).map((sheetKey) => {
      const sheet = this.ensureSheet(sheetKey);
      return sheet.getName();
    });

    return ResponseService.success({ sheets: createdOrVerifiedSheets }, 'ساختار دیتابیس بررسی و آماده شد.');
  },

  ensureHeaders(sheet, expectedHeaders) {
    const lastColumn = sheet.getLastColumn();
    const currentHeaders = lastColumn > 0
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      : [];

    if (!currentHeaders.length || currentHeaders.every((header) => header === '')) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      return;
    }

    expectedHeaders.forEach((header) => {
      if (currentHeaders.indexOf(header) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      }
    });
  },

  getHeaderMap(sheet) {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) return {};

    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return headers.reduce((map, header, index) => {
      if (header) map[header] = index + 1;
      return map;
    }, {});
  },

  getSheetData(sheetKeyOrName) {
    const sheet = this.ensureSheet(sheetKeyOrName);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];

    const headers = values[0];
    return values.slice(1).map((row) => headers.reduce((item, header, index) => {
      if (header) item[header] = row[index];
      return item;
    }, {}));
  },

  addRow(sheetKeyOrName, data) {
    const sheet = this.ensureSheet(sheetKeyOrName);
    const sheetConfig = this.getSheetConfig(sheetKeyOrName);
    const row = sheetConfig.COLUMNS.map((columnName) => Object.prototype.hasOwnProperty.call(data, columnName) ? data[columnName] : '');
    sheet.appendRow(row);
    return row;
  },

  updateRow(sheetKeyOrName, rowNumber, data) {
    if (rowNumber <= 1) {
      throw new Error('Header row cannot be updated.');
    }

    const sheet = this.ensureSheet(sheetKeyOrName);
    const headerMap = this.getHeaderMap(sheet);

    Object.keys(data).forEach((columnName) => {
      const columnNumber = headerMap[columnName];
      if (columnNumber) {
        sheet.getRange(rowNumber, columnNumber).setValue(data[columnName]);
      }
    });

    return this.getRowAsObject(sheet, rowNumber);
  },

  getRowAsObject(sheet, rowNumber) {
    const lastColumn = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const values = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];

    return headers.reduce((item, header, index) => {
      if (header) item[header] = values[index];
      return item;
    }, {});
  },

  findByValue(sheetKeyOrName, columnName, value) {
    return this.getSheetData(sheetKeyOrName).filter((row) => String(row[columnName]) === String(value));
  },

  generateId() {
    return Utils.generateUuid();
  }
});
