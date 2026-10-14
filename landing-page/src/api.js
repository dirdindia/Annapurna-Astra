import axios from 'axios';
import Swal from 'sweetalert2';

// Axios Instance
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
