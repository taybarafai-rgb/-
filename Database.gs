  updateRowById(sheetKeyOrName, idColumnName, idValue, data) {
    // Find row number by scanning sheet for idValue in idColumnName
    const sheet = this.ensureSheet(sheetKeyOrName);
    const headerMap = this.getHeaderMap(sheet);
    const idCol = headerMap[idColumnName];
    if (!idCol) {
      throw new Error(`Column ${idColumnName} not found in sheet ${sheet.getName()}`);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    // read the column values (from row 2 to lastRow)
    const values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues().map(r => String(r[0]));
    const idx = values.indexOf(String(idValue));
    if (idx === -1) return null;

    const rowNumber = idx + 2; // offset because we skipped header row
    return this.updateRow(sheetKeyOrName, rowNumber, data);
  }