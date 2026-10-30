import axios from 'axios';
import Swal from 'sweetalert2';

// Axios Instance
const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://api.e-annapurna.co.in/";
  }
  return "http://localhost:5000/";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
});

// Configure SweetAlert to match Lagoon-900 / Saffron-500 theme
export const showToast = (message, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0f172a', // lagoon-900
    color: '#ffffff',
    iconColor: '#f59e0b', // saffron-500
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  Toast.fire({
    icon: icon,
    title: message
  });
};


export default api;