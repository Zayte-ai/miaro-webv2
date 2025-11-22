"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Save,
  Eye,
  EyeOff,
  Bell,
  Shield,
  Palette,
  Upload,
  X,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

export default function SettingsPage() {
  const { adminToken } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    // General Settings
    siteName: "MaisonMiaro",
    siteDescription: "Premium clothing brand for modern lifestyle",
    contactEmail: "contact@maisonmiaro.com",
    supportEmail: "support@maisonmiaro.com",
    faviconUrl: "",

    // Store Settings
    currency: "USD",
    taxRate: 8.25,
    shippingFee: 9.99,
    freeShippingThreshold: 100,

    // Notification Settings
    emailNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    customerSignupAlerts: false,

    // Security Settings
    requireStrongPasswords: true,
    enableTwoFactor: false,
    sessionTimeout: 24,

    // Display Settings
    productsPerPage: 12,
    featuredProductsCount: 8,
    enableReviews: true,
    enableWishlist: true,
  });

  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [loading, setLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.faviconUrl) {
      setFaviconPreview(settings.faviconUrl);
    }
  }, [settings.faviconUrl]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePasswordChange = (key: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/x-icon', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload .ico, .png, .jpg, or .svg files only.');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('File too large. Maximum size is 1MB.');
      return;
    }

    try {
      setUploadingFavicon(true);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      const formData = new FormData();
      formData.append('favicon', file);

      const response = await fetch('/api/admin/upload/favicon', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update settings with new favicon URL
      handleSettingChange('faviconUrl', data.url);
      alert('Favicon uploaded successfully!');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      alert('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconPreview('');
    handleSettingChange('faviconUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    // In a real app, this would update the password via API
    console.log("Updating password");
    alert("Password updated successfully!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "store", label: "Store", icon: ShoppingCart },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "display", label: "Display", icon: Palette },
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-gray-900">MaisonMiaro Admin</h1>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <Package className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/admin/dashboard/products"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <Package className="h-5 w-5 mr-3" />
            Products
          </Link>
          <Link
            href="/admin/dashboard/orders"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <ShoppingCart className="h-5 w-5 mr-3" />
            Orders
          </Link>
          <Link
            href="/admin/dashboard/customers"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <Users className="h-5 w-5 mr-3" />
            Customers
          </Link>
          <Link
            href="/admin/dashboard/analytics"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            Analytics
          </Link>
          <div className="flex items-center px-6 py-3 bg-gray-100 text-gray-900 border-r-2 border-black">
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={handleSaveSettings}
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Tabs */}
          <div className="w-64 bg-white border-r">
            <div className="p-4">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                      activeTab === tab.id
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <main className="flex-1 overflow-y-auto bg-white p-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  General Settings
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) =>
                        handleSettingChange("siteName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) =>
                        handleSettingChange("siteDescription", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>

                  {/* Favicon Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Favicon
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload a favicon for your site (.ico, .png, .jpg, or .svg, max 1MB)
                    </p>

                    <div className="flex items-start space-x-4">
                      {/* Preview */}
                      {faviconPreview && (
                        <div className="relative">
                          <div className="h-16 w-16 border-2 border-gray-300 rounded-md flex items-center justify-center bg-white">
                            <img
                              src={faviconPreview}
                              alt="Favicon preview"
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                          <button
                            onClick={handleRemoveFavicon}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Remove favicon"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Upload Button */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".ico,.png,.jpg,.jpeg,.svg"
                          onChange={handleFaviconUpload}
                          className="hidden"
                          disabled={uploadingFavicon}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFavicon}
                          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingFavicon
                            ? "Uploading..."
                            : faviconPreview
                            ? "Change Favicon"
                            : "Upload Favicon"}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 32x32px or 64x64px
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) =>
                          handleSettingChange("contactEmail", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) =>
                          handleSettingChange("supportEmail", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "store" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Store Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) =>
                        handleSettingChange("currency", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.taxRate}
                      onChange={(e) =>
                        handleSettingChange(
                          "taxRate",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Fee ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.shippingFee}
                      onChange={(e) =>
                        handleSettingChange(
                          "shippingFee",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Shipping Threshold ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.freeShippingThreshold}
                      onChange={(e) =>
                        handleSettingChange(
                          "freeShippingThreshold",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notification Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications for important events
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "emailNotifications",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Order Notifications
                      </label>
                      <p className="text-sm text-gray-500">
                        Get notified when new orders are placed
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.orderNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "orderNotifications",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Low Stock Alerts
                      </label>
                      <p className="text-sm text-gray-500">
                        Alerts when products are running low on stock
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.lowStockAlerts}
                      onChange={(e) =>
                        handleSettingChange("lowStockAlerts", e.target.checked)
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Customer Signup Alerts
                      </label>
                      <p className="text-sm text-gray-500">
                        Get notified when new customers sign up
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.customerSignupAlerts}
                      onChange={(e) =>
                        handleSettingChange(
                          "customerSignupAlerts",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Security Settings
                </h3>

                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Change Password
                    </h4>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                "currentPassword",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                current: !prev.current,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                "newPassword",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                new: !prev.new,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                "confirmPassword",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>

                  {/* Security Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Require Strong Passwords
                        </label>
                        <p className="text-sm text-gray-500">
                          Enforce strong password requirements for all users
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.requireStrongPasswords}
                        onChange={(e) =>
                          handleSettingChange(
                            "requireStrongPasswords",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Enable Two-Factor Authentication
                        </label>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to admin accounts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableTwoFactor}
                        onChange={(e) =>
                          handleSettingChange(
                            "enableTwoFactor",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.sessionTimeout}
                        onChange={(e) =>
                          handleSettingChange(
                            "sessionTimeout",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "display" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Display Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Products Per Page
                    </label>
                    <select
                      value={settings.productsPerPage}
                      onChange={(e) =>
                        handleSettingChange(
                          "productsPerPage",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    >
                      <option value={8}>8 products</option>
                      <option value={12}>12 products</option>
                      <option value={16}>16 products</option>
                      <option value={24}>24 products</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Products Count
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="16"
                      value={settings.featuredProductsCount}
                      onChange={(e) =>
                        handleSettingChange(
                          "featuredProductsCount",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Enable Product Reviews
                      </label>
                      <p className="text-sm text-gray-500">
                        Allow customers to leave reviews on products
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableReviews}
                      onChange={(e) =>
                        handleSettingChange("enableReviews", e.target.checked)
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Enable Wishlist
                      </label>
                      <p className="text-sm text-gray-500">
                        Allow customers to save products to a wishlist
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableWishlist}
                      onChange={(e) =>
                        handleSettingChange("enableWishlist", e.target.checked)
                      }
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
