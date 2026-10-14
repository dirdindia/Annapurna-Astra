import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/",
  // baseURL:"https://zoox.onrender.com/"
  // baseURL:"https://api.grandportico.in/"
});

let activeRequests = 0;
let loaderElement = null;

const createLoader = () => {
  if (loaderElement) return;
  
  // Create overlay container
  loaderElement = document.createElement("div");
  loaderElement.id = "global-api-loader";
  loaderElement.style.position = "fixed";
  loaderElement.style.top = "0";
  loaderElement.style.left = "0";
  loaderElement.style.width = "100vw";
  loaderElement.style.height = "100vh";
  loaderElement.style.backgroundColor = "rgba(10, 47, 47, 0.72)"; // lagoon-900 with backdrop blur
  loaderElement.style.backdropFilter = "blur(6px)";
  loaderElement.style.display = "flex";
  loaderElement.style.justifyContent = "center";
  loaderElement.style.alignItems = "center";
  loaderElement.style.zIndex = "99999";
  loaderElement.style.transition = "opacity 0.15s ease-in-out";
  loaderElement.style.opacity = "0";

  // Create loading content block
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.gap = "12px";

  // Spinner animation CSS
  const spinner = document.createElement("div");
  spinner.className = "api-loading-spinner";
  
  if (!document.getElementById("api-loader-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "api-loader-styles";
    styleSheet.innerHTML = `
      .api-loading-spinner {
        width: 44px;
        height: 44px;
        border: 4px solid rgba(242, 163, 58, 0.2);
        border-top-color: #F2A33A;
        border-radius: 50%;
        animation: api-spin 0.7s linear infinite;
      }
      @keyframes api-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Label text
  const loadingText = document.createElement("p");
  loadingText.innerText = "Processing request...";
  loadingText.style.color = "#F2A33A";
  loadingText.style.fontFamily = "'Manrope', 'Outfit', sans-serif";
  loadingText.style.fontSize = "12px";
  loadingText.style.fontWeight = "700";
  loadingText.style.letterSpacing = "0.05em";

  container.appendChild(spinner);
  container.appendChild(loadingText);
  loaderElement.appendChild(container);
  document.body.appendChild(loaderElement);

  // Trigger HSL fade-in
  setTimeout(() => {
    if (loaderElement) loaderElement.style.opacity = "1";
  }, 10);
};

const showLoader = () => {
  activeRequests++;
  if (activeRequests === 1) {
    createLoader();
  }
};

const hideLoader = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0 && loaderElement) {
    loaderElement.style.opacity = "0";
    setTimeout(() => {
      if (activeRequests === 0 && loaderElement) {
        loaderElement.remove();
        loaderElement = null;
      }
    }, 150);
  }
};

// Add a request interceptor to attach JWT token and show loader
api.interceptors.request.use(
  (config) => {
    // Show loader unless explicitly set to false
    if (config.showLoader !== false) {
      showLoader();
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

// Add a response interceptor to hide loader
api.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

export const tableAPI = {
  getTables: () => api.get("/api/tables"),
  createTable: (data) => api.post("/api/tables", data),
  updateTable: (id, data) => api.put(`/api/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/api/tables/${id}`),
};

export const orderAPI = {
  createOrUpdateOrder: (data) => api.post("/api/orders", data),
  getActiveOrder: (tableId) => api.get(`/api/orders/active/${tableId}`),
  checkoutOrder: (orderId) => api.post(`/api/orders/${orderId}/checkout`),
  markKotPrinted: (orderId, items) => api.put(`/api/orders/${orderId}/mark-printed`, { items }),
  printKOT: (data) => api.post("/api/orders/print-kot", data),
};

export const roomBookingAPI = {
  exportBookings: (params) => api.get("/api/room-bookings/export", { params, responseType: 'blob' }),
};

export const authAPI = {
  getProfile: () => api.get("/api/auth/profile"),
  updatePassword: (data) => api.put("/api/auth/update-password", data),
  updateStaffPermissions: (data) => api.put("/api/auth/update-staff-permissions", data),
  updateSubscription: (data) => api.put("/api/auth/subscription", data),
  updateProfile: (data) => api.put("/api/auth/update-profile", data),
};

export const uploadAPI = {
  uploadFiles: (formData) => api.post("/api/upload/upload-files", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
};

export const qrOrderAPI = {
  getOrders: (params) => api.get("/api/public/admin/qr-orders", { params }),
  approveOrder: (orderId) => api.put(`/api/public/admin/qr-orders/${orderId}/approve`),
  rejectOrder: (orderId, reason) => api.put(`/api/public/admin/qr-orders/${orderId}/reject`, { reason }),
  approveAddon: (orderId, addonIndex) => api.put(`/api/public/admin/qr-orders/${orderId}/addons/${addonIndex}/approve`),
  rejectAddon: (orderId, addonIndex, reason) => api.put(`/api/public/admin/qr-orders/${orderId}/addons/${addonIndex}/reject`, { reason }),
  getTableBookings: () => api.get("/api/public/admin/table-bookings"),
  updateTableBooking: (bookingId, data) => api.put(`/api/public/admin/table-bookings/${bookingId}`, data),
};

export const publicAPI = {
  getMenu: (hotelId) => api.get(`/api/public/hotel/${hotelId}`, { showLoader: false }),
  placeOrder: (data) => api.post("/api/public/order", data, { showLoader: false }),
  getOrderStatus: (orderId) => api.get(`/api/public/order/${orderId}`, { showLoader: false }),
  getOrderByMobile: (hotelId, mobile) => api.get("/api/public/orders/by-mobile", { params: { hotelId, mobile }, showLoader: false }),
  createPaymentOrder: (data) => api.post("/api/public/payment/create-order", data, { showLoader: false }),
  verifyPayment: (data) => api.post("/api/public/payment/verify", data, { showLoader: false }),
  bookTable: (data) => api.post("/api/public/table-booking", data, { showLoader: false }),
};

export default api;

