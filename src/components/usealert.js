import { useState, useCallback } from "react";

export function useAlert() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
    showCancel: false,
    cancelText: "Cancel",
    onConfirm: null,
  });

  const showAlert = useCallback(
    ({
      title = "Alert",
      message,
      type = "info",
      confirmText = "OK",
      showCancel = false,
      cancelText = "Cancel",
      onConfirm,
    }) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        showCancel,
        cancelText,
        onConfirm,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(
    (message, title = "Success") => {
      showAlert({ title, message, type: "success" });
    },
    [showAlert]
  );

  const showError = useCallback(
    (message, title = "Error") => {
      showAlert({ title, message, type: "error" });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message, title = "Warning") => {
      showAlert({ title, message, type: "warning" });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message, title = "Info") => {
      showAlert({ title, message, type: "info" });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    ({ title = "Confirm", message, onConfirm, confirmText = "Confirm", cancelText = "Cancel" }) => {
      showAlert({
        title,
        message,
        type: "warning",
        showCancel: true,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    [showAlert]
  );

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}
