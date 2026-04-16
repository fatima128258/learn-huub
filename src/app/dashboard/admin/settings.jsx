"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import Toast from "@/components/Toast";

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [bankDetails, setBankDetails] = useState({
    bankAccountNumber: "",
    bankName: "",
  });
  const [loadingBankDetails, setLoadingBankDetails] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bankError, setBankError] = useState("");
  const [bankSuccess, setBankSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchBankDetails = async () => {
      const userId = user?.id || user?._id;
      if (userId && user?.role === "admin") {
        try {
          const response = await fetch(`/api/admin/bank-details?adminId=${userId}`);
          const data = await response.json();
          if (data.success) {
            setBankDetails(data.bankDetails);
          }
          setLoadingBankDetails(false);
        } catch (error) {
          console.error("Error fetching bank details:", error);
          setLoadingBankDetails(false);
        }
      } else {
        setLoadingBankDetails(false);
      }
    };

    if (user) {
      fetchBankDetails();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
    setBankError("");
    setBankSuccess("");
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankError("");
    setBankSuccess("");
    setLoadingBank(true);

    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setBankError("User ID not found");
        setLoadingBank(false);
        return;
      }

      const response = await fetch("/api/admin/bank-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: userId,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankName: bankDetails.bankName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBankDetails(data.bankDetails);
        setToastMessage("Bank details updated successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } else {
        setBankError(data.message || "Failed to update bank details");
      }
    } catch (error) {
      setBankError("Error updating bank details: " + error.message);
    } finally {
      setLoadingBank(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {

      if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password");
        setLoading(false);
        return;
      }

      
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters long");
        setLoading(false);
        return;
      }
     
      const uppercaseRegex = /[A-Z]/;
      if (!uppercaseRegex.test(formData.newPassword)) {
        setError("New password must contain at least one uppercase letter");
        setLoading(false);
        return;
      }

     
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }
    }
      // Validate password change
      // if (formData.newPassword) {
      //   if (!formData.currentPassword) {
      //     setError("Current password is required to change password");
      //     setLoading(false);
      //     return;
      //   }

      //   if (formData.newPassword.length < 6) {
      //     setError("New password must be at least 6 characters long");
      //     setLoading(false);
      //     return;
      //   }

      //   if (formData.newPassword !== formData.confirmPassword) {
      //     setError("New passwords do not match");
      //     setLoading(false);
      //     return;
      //   }
      // }

      
      if (formData.email !== user.email) {
        // Email is being changed
      }

      const userId = user?.id || user?._id;
      if (!userId) {
        setError("User ID not found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToastMessage("Profile updated successfully! Redirecting to login...");
        setShowToast(true);
        
        
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.clear();
        }
        
      
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (error) {
      setError("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 sm:mt-6 bg-white pt-16 xl:pt-0 rounded-lg shadow-md p-4 sm:p-6">
      
      <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Bank Account Details
        </h2>

        {loadingBankDetails ? (
          <div className="text-gray-600 py-4">Loading...</div>
        ) : (
          <form onSubmit={handleBankSubmit} className="space-y-6">
            {/* Bank Account Number */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Bank Account Number 
              </label>
              <Input
                type="text"
                name="bankAccountNumber"
                placeholder="Enter bank account number"
                value={bankDetails.bankAccountNumber}
                onChange={handleBankChange}
                required
              />
            </div>

            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Bank Name 
              </label>
              <Input
                type="text"
                name="bankName"
                placeholder="Enter bank name"
                value={bankDetails.bankName}
                onChange={handleBankChange}
                required
              />
            </div>

            
            {bankError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {bankError}
              </div>
            )}

            
            <Button
              type="submit"
              className="bg-[#4f7c82] text-white w-full text-xs sm:text-sm font-normal sm:font-medium"
              disabled={loadingBank}
              isLoading={loadingBank}
            >
              {loadingBank ? "Updating..." : "Update Bank Details"}
            </Button>
          </form>
        )}
      </div>

      
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        Edit Email & Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Email Address 
          </label>
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            New Password 
            {/* New Password (leave empty to keep current) */}

          </label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              placeholder="Enter new password "
              value={formData.newPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l13.42 13.42" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Confirm New Password 
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required={!!formData.newPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l13.42 13.42" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password 
          </label>
          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              name="currentPassword"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={handleChange}
              required={!!formData.newPassword}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l13.42 13.42" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

       
        <Button
          type="submit"
          className="bg-[#4f7c82] text-white w-full text-xs sm:text-sm font-normal sm:font-medium"
          disabled={loading}
          isLoading={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </form>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

