"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/Button";
import Input from "@/components/Input";

export default function InstructorSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: user?.name || "",
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
  const [editingBankDetails, setEditingBankDetails] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bankError, setBankError] = useState("");
  const [bankSuccess, setBankSuccess] = useState("");

  useEffect(() => {
    const fetchBankDetails = async () => {
      const userId = user?.id || user?._id;
      if (userId && user?.role === "instructor") {
        try {
          console.log("Fetching bank details for:", userId);
          const response = await fetch(`/api/instructor/bank-details?instructorId=${userId}`);
          const data = await response.json();
          console.log("Bank details response:", data);
          if (data.success && data.bankDetails) {
            console.log("Setting bank details:", data.bankDetails);
            setBankDetails({
              bankAccountNumber: data.bankDetails.bankAccountNumber || "",
              bankName: data.bankDetails.bankName || "",
            });
          }
          setLoadingBankDetails(false);
        } catch (error) {
          console.error("Error fetching bank details:", error);
          setLoadingBankDetails(false);
        }
      } else {
        console.log("User not ready or not instructor:", { userId, role: user?.role });
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

      const response = await fetch("/api/instructor/bank-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructorId: userId,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankName: bankDetails.bankName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBankSuccess("Bank details updated successfully!");
        setBankDetails(data.bankDetails);
        setEditingBankDetails(false);
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
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const emailChanged = (formData.email || "").trim() !== (user?.email || "").trim();
        if (emailChanged) {
          setSuccess("Email updated successfully! Redirecting to login...");
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              localStorage.clear();
            } catch (_) {}
            window.location.href = "/login";
          }
        } else {
          setSuccess("Account settings updated successfully!");
        }
      } else {
        setError(data.message || "Failed to update account settings");
      }
    } catch (error) {
      setError("Error updating account settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setError("User ID not found");
        setLoading(false);
        return;
      }

      
      const updateData = {
        userId: userId,
        email: formData.email,
      };

      if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
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

        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Account updated successfully! Redirecting to login...");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.clear();
          } catch (_) {}
          window.location.href = "/login";
        }
      } else {
        setError(data.message || "Failed to update account");
      }
    } catch (error) {
      setError("Error updating account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 tracking-tight bg-white pt-20 md:pt-0 rounded-lg shadow-md p-6">
     
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Bank Account Details
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update your bank account information to receive payments
        </p>

        {loadingBankDetails ? (
          <div className="text-gray-600 py-4">Loading...</div>
        ) : !editingBankDetails ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankDetails.bankAccountNumber || "Not set"}
                readOnly
                className="w-full px-4 py-2 border rounded-md bg-gray-50 text-black cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={bankDetails.bankName || "Not set"}
                readOnly
                className="w-full px-4 py-2 border rounded-md bg-gray-50 text-black cursor-not-allowed"
              />
            </div>

            <Button
              onClick={() => setEditingBankDetails(true)}
              className="bg-[#4f7c82] text-white"
            >
              {bankDetails.bankAccountNumber ? "Update Bank Details" : "Add Bank Details"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleBankSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number 
              </label>
              <input
                type="text"
                name="bankAccountNumber"
                placeholder="Enter bank account number"
                value={bankDetails.bankAccountNumber}
                onChange={handleBankChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none text-black"
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name 
              </label>
              <input
                type="text"
                name="bankName"
                placeholder="Enter bank name"
                value={bankDetails.bankName}
                onChange={handleBankChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none text-black"
              />
            </div>

            {bankError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {bankError}
              </div>
            )}

            {bankSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {bankSuccess}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-[#4f7c82] text-white flex-1"
                disabled={loadingBank}
                isLoading={loadingBank}
              >
                {loadingBank ? "Updating..." : "Update Bank Details"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingBankDetails(false);
                  setBankError("");
                  setBankSuccess("");
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Change Password
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update your email and password to keep your account secure
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <Button
          type="submit"
          className="bg-[#4f7c82] text-white w-full"
          disabled={loading}
          isLoading={loading}
        >
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>
      </div>
    </div>
  );
}
