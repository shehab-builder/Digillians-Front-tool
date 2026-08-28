import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://digillians-tool-backend-production.up.railway.app/api",
  withCredentials: true, // STRICTLY REQUIRED: Sends cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Global Response Interceptor for handling 401 Unauthorized (Expired Cookie)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Redirect to login or dispatch session expiry
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
