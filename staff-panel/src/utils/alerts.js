import Swal from "sweetalert2";

export const getSwalConfig = () => {
  const isLight = document.body.classList.contains("light");
  return {
    background: isLight ? "#FAFAF6" : "#0A2F2F",
    color: isLight ? "#0A2F2F" : "#EAF3F1",
    confirmButtonColor: "#F2A33A",
    cancelButtonColor: "#1F6F6B",
    buttonsStyling: false,
    customClass: {
      popup: isLight 
        ? "rounded-2xl border border-lagoon-100 shadow-2xl font-sans" 
        : "rounded-2xl border border-lagoon-700/40 shadow-2xl font-sans",
      title: "font-display font-bold text-lg",
      htmlContainer: isLight ? "text-xs font-medium text-lagoon-700" : "text-xs font-medium text-lagoon-100/80",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg bg-saffron-500 hover:bg-saffron-600 text-lagoon-950 transition-all",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs shadow-md bg-lagoon-800/80 hover:bg-lagoon-800 text-lagoon-50 transition-all",
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
