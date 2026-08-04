/**
 * Creates consistent responses for calls made through google.script.run.
 */
const ResponseService = Object.freeze({
  success(data, message) {
    return {
      success: true,
      data: data || null,
      message: message || ''
    };
  },

  error(message, data) {
    return {
      success: false,
      data: data || null,
      message: message || 'خطایی رخ داد.'
    };
  }
});
