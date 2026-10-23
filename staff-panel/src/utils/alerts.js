import Swal from "sweetalert2";

export const getSwalConfig = () => {
  const isLight = document.body.classList.contains("light");
  return {
    background: isLight ? "#FFFFFF" : "#0A2F2F",
    color: isLight ? "#0A2F2F" : "#FFFFFF",
    confirmButtonColor: "#F2A33A",
    cancelButtonColor: "#155B58",
    buttonsStyling: true,
    customClass: {
      popup: "swal-custom-popup",
      title: "swal-custom-title",
      htmlContainer: "swal-custom-html",
      confirmButton: "swal-custom-confirm-btn",
      cancelButton: "swal-custom-cancel-btn",
      actions: "swal-custom-actions",
    }
  };
};

export const showAlert = (title, text, icon = "info") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon,
  });
};

export const showSuccess = (title, text) => {
  return showAlert(title, text, "success");
};

export const showError = (title, text) => {
  return showAlert(title, text, "error");
};

export const showConfirm = (title, text, confirmButtonText = "Yes, do it") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
  });
};
