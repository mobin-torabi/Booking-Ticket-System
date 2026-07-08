import toast from "react-hot-toast";

export const showSuccess = (message) => toast.success(message);

export const showError = (message) => toast.error(message);

export const showLoading = (message = "Loading...") => toast.loading(message);

export const dismissToast = (toastId) => toast.dismiss(toastId);

export const showInfo = (message) => toast(message);

export const showPromise = (
  promise,
  {
    loading = "Loading...",
    success = "Operation completed successfully.",
    error,
  } = {},
) =>
  toast.promise(promise, {
    loading,
    success,
    error: (err) => error,
  });

/*

Example Usage:

Success
import { showSuccess } from "../utils/toast";

showSuccess("Booking created successfully!");


Error
import { showError } from "../utils/toast";

showError("Invalid username or password.");


Loading
import {
    showLoading,
    dismissToast,
} from "../utils/toast";

const toastId = showLoading("Creating booking...");

// API request...

dismissToast(toastId);

showSuccess("Booking created!");

///////

Generally use it like this:

import { showPromise } from "../utils/toast";

await showPromise(
    bookingApi.createBooking(data),
    {
        loading: "Creating booking...",
        success: "Booking created successfully!",
        error: "Failed to create booking.",
    }
);

*/
