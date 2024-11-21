import { CreateRestAPIClient } from "../utils/restAgent.js";

export class OrderService {
  static basePath = "/api/v1/order";
  static api = CreateRestAPIClient();
  static async getUserOrders(userId) {
    try {
      const response = await this.api.get(`${this.basePath}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  }

  static async createOrder(order) {
    try {
      const response = await this.api.post(this.basePath + "/", order);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  static async getOrder(orderId) {
    try {
      const response = await this.api.get(`${this.basePath}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  static async deleteOrder(orderId) {
    try {
      const response = await this.api.delete(`${this.basePath}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  static async deleteUserOrders(userId) {
    try {
      const response = await this.api.delete(`${this.basePath}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user orders:", error);
      throw error;
    }
  }
}

export class ProductService {
  static basePath = "/products";
  static api = CreateRestAPIClient(process.env.PRODUCT_SERVICE_URL);

  static async getAllProducts() {
    try {
      const response = await this.api.get(this.basePath);
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  }

  static async getProductById(productId) {
    try {
      const response = await this.api.get(`${this.basePath}/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }
}
