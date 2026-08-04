/**
 * Web app entry point and lightweight router.
 */
function doGet(e) {
  const route = (e && e.parameter && e.parameter.route) || CONFIG.APP.DEFAULT_ROUTE;
  return Router.render(route);
}

/**
 * Creates or verifies the approved Google Sheets database structure.
 */
function setupProject() {
  return DatabaseService.ensureAllSheets();
}

/**
 * Lightweight manual smoke test for the Database service inside Apps Script.
 */
function testDatabaseService() {
  const setupResult = DatabaseService.ensureAllSheets();
  const products = DatabaseService.getSheetData('PRODUCTS');
  const generatedId = DatabaseService.generateId();

  return ResponseService.success({
    setup: setupResult,
    productsRows: products.length,
    generatedId: generatedId
  }, 'تست پایه DatabaseService با موفقیت اجرا شد.');
}
