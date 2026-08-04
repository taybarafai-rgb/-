/**
 * Project-wide technical configuration for the Labbayk Ya Mahdi sales system.
 * Business values that admins can edit should live in the Settings sheet.
 */
const CONFIG = Object.freeze({
  APP: Object.freeze({
    NAME: 'سامانه فروش لبیک یا مهدی',
    DEFAULT_ROUTE: 'customer',
    TIMEZONE: 'Asia/Tehran'
  }),

  SHEETS: Object.freeze({
    PRODUCTS: Object.freeze({
      NAME: 'محصولات',
      COLUMNS: Object.freeze([
        'شناسه محصول',
        'کد محصول',
        'نام محصول',
        'دسته بندی',
        'جنس محصول',
        'سایز محصول',
        'قیمت',
        'توضیحات',
        'لینک تصویر',
        'وضعیت موجودی',
        'تاریخ ثبت',
        'آخرین بروزرسانی'
      ])
    }),
    CUSTOMERS: Object.freeze({
      NAME: 'مشتریان',
      COLUMNS: Object.freeze([
        'شناسه مشتری',
        'نام',
        'نام خانوادگی',
        'شماره موبایل',
        'استان',
        'شهر',
        'آدرس',
        'کد پستی',
        'تعداد سفارش‌ها',
        'مجموع خرید',
        'تاریخ اولین خرید',
        'آخرین خرید'
      ])
    }),
    ORDERS: Object.freeze({
      NAME: 'سفارشات',
      COLUMNS: Object.freeze([
        'شناسه سفارش',
        'کد سفارش',
        'تاریخ ثبت',
        'شناسه مشتری',
        'نام مشتری',
        'شماره موبایل',
        'استان',
        'شهر',
        'آدرس',
        'کد نماینده',
        'جمع محصولات',
        'هزینه ارسال',
        'مبلغ نهایی',
        'وضعیت سفارش',
        'وضعیت پرداخت',
        'توضیحات'
      ])
    }),
    ORDER_DETAILS: Object.freeze({
      NAME: 'جزئیات سفارشات',
      COLUMNS: Object.freeze([
        'شناسه جزئیات',
        'کد سفارش',
        'کد محصول',
        'نام محصول',
        'جنس',
        'سایز',
        'تعداد',
        'قیمت واحد',
        'مبلغ کل'
      ])
    }),
    PAYMENTS: Object.freeze({
      NAME: 'پرداخت‌ها',
      COLUMNS: Object.freeze([
        'شناسه پرداخت',
        'کد سفارش',
        'شماره موبایل مشتری',
        'مبلغ پرداختی',
        'روش پرداخت',
        'تصویر رسید',
        'تاریخ ارسال رسید',
        'وضعیت بررسی',
        'توضیحات مدیر'
      ])
    }),
    SHIPPING: Object.freeze({
      NAME: 'تعرفه ارسال',
      COLUMNS: Object.freeze([
        'استان',
        'شهر',
        'هزینه ارسال'
      ])
    }),
    REPRESENTATIVES: Object.freeze({
      NAME: 'نمایندگان',
      COLUMNS: Object.freeze([
        'شناسه نماینده',
        'کد نماینده',
        'نام',
        'نام خانوادگی',
        'شماره موبایل',
        'استان',
        'شهر',
        'درصد پورسانت',
        'وضعیت فعالیت',
        'لینک اختصاصی',
        'تاریخ ثبت',
        'توضیحات'
      ])
    }),
    COMMISSIONS: Object.freeze({
      NAME: 'پورسانت ها',
      COLUMNS: Object.freeze([
        'شناسه پورسانت',
        'کد نماینده',
        'کد سفارش',
        'مبلغ فروش',
        'درصد پورسانت',
        'مبلغ پورسانت',
        'وضعیت'
      ])
    }),
    SETTINGS: Object.freeze({
      NAME: 'تنظیمات',
      COLUMNS: Object.freeze([
        'کلید',
        'مقدار'
      ])
    })
  })
});
