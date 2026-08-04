/**
 * Resolves route names to HTML templates.
 */
const Router = Object.freeze({
  ROUTES: Object.freeze({
    customer: 'customer',
    admin: 'admin',
    affiliate: 'affiliate_dashboard'
  }),

  render(route) {
    const templateName = this.ROUTES[route] || this.ROUTES.customer;
    return HtmlService.createTemplateFromFile(templateName)
      .evaluate()
      .setTitle(CONFIG.APP.NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  },

  include(fileName) {
    return HtmlService.createHtmlOutputFromFile(fileName).getContent();
  }
});

function include(fileName) {
  return Router.include(fileName);
}
