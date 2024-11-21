const api = require("../utils/restAgent");

class OrderService {
  basePath = "/api/v1/order";
  static async getUserOrders(userId) {
    try {
      const response = await api.get(`${this.basePath}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  }

  static async getOrder(orderId) {
    try {
      const response = await api.get(`${this.basePath}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  static async deleteOrder(orderId) {
    try {
      const response = await api.delete(`${this.basePath}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  static async deleteUserOrders(userId) {
    try {
      const response = await api.delete(`${this.basePath}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user orders:", error);
      throw error;
    }
  }
}

module.exports = OrderService;
