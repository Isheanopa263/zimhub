/**
 * Standard API Response wrapper
 * Ensures consistent response structure across all endpoints
 */
class ApiResponse {
  /**
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human readable message
   * @param {*} data - Response payload
   * @param {object} meta - Pagination or extra metadata
   */
  static send(res, statusCode, message, data = null, meta = null) {
    const response = {
      success: statusCode >= 200 && statusCode < 300,
      message,
    };

    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;

    return res.status(statusCode).json(response);
  }

  static success(res, message, data = null, meta = null) {
    return this.send(res, 200, message, data, meta);
  }

  static created(res, message, data = null) {
    return this.send(res, 201, message, data);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
