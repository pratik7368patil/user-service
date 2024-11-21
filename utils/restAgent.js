import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export function CreateRestAPIClient(baseUrl = process.env.ORDER_SERVICE_URL) {
  const instance = axios.create({
    baseURL: baseUrl || "http://localhost:8080",
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      if (instance.authToken) {
        config.headers.Authorization = `Bearer ${instance.authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        return Promise.reject(error.response.data);
      } else if (error.request) {
        return Promise.reject({ message: "No response received from server" });
      } else {
        return Promise.reject({ message: error.message });
      }
    }
  );

  const get = (url, config = {}) => instance.get(url, config);
  const post = (url, data = {}, config = {}) =>
    instance.post(url, data, config);
  const put = (url, data = {}, config = {}) => instance.put(url, data, config);
  const del = (url, config = {}) => instance.delete(url, config);

  const setAuthToken = (token) => {
    instance.authToken = token;
  };

  const removeAuthToken = () => {
    delete instance.authToken;
  };

  return {
    get,
    post,
    put,
    delete: del,
    setAuthToken,
    removeAuthToken,
  };
}
