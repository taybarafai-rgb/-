/**
 * Product backend functions.
 * The customer purchase flow starts by searching products through the product code.
 */
const ProductService = Object.freeze({
  getProducts() {
    return DatabaseService.getSheetData('PRODUCTS');
  },

  getProductByCode(productCode) {
    const normalizedCode = Utils.normalizeProductCode(productCode);
    if (!normalizedCode) return null;

    return this.getProducts().find((product) => {
      const storedCode = Utils.normalizeProductCode(product['کد محصول']);
      return storedCode === normalizedCode;
    }) || null;
  },

  toCustomerProduct(product) {
    if (!product) return null;

    return {
      code: product['کد محصول'] || '',
      name: product['نام محصول'] || '',
      material: product['جنس محصول'] || '',
      size: product['سایز محصول'] || '',
      price: product['قیمت'] || '',
      description: product['توضیحات'] || '',
      imageUrl: product['لینک تصویر'] || '',
      stockStatus: product['وضعیت موجودی'] || ''
    };
  }
});

function getProducts() {
  return ResponseService.success(ProductService.getProducts());
}

function getProductByCode(productCode) {
  const product = ProductService.getProductByCode(productCode);
  if (!product) {
    return ResponseService.error('کد محصول صحیح نیست یا این محصول موجود نمی‌باشد.');
  }

  return ResponseService.success(ProductService.toCustomerProduct(product));
}

function apiCustomerFindProductByCode(productCode) {
  return getProductByCode(productCode);
}
