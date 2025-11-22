"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import AccountLayout from "@/components/account/AccountLayout";
import { CreditCard, Plus, Trash2 } from "lucide-react";

// Mock payment methods
const mockPaymentMethods = [
  {
    id: "pm_1",
    cardBrand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: "pm_2",
    cardBrand: "mastercard",
    last4: "8888",
    expiryMonth: 10,
    expiryYear: 2026,
    isDefault: false,
  },
];

interface PaymentMethod {
  id: string;
  cardBrand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // In a real app, this would be an API call
    const fetchPaymentMethods = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setPaymentMethods(mockPaymentMethods);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [isAuthenticated, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, this would be an API call to save the payment method
    // For now, we'll just simulate adding a new card
    const newPaymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      cardBrand: "visa", // This would normally be determined by the card number
      last4: formData.cardNumber.slice(-4),
      expiryMonth: parseInt(formData.expiryMonth),
      expiryYear: parseInt(formData.expiryYear),
      isDefault: paymentMethods.length === 0, // Make it default if it's the first card
    };

    setPaymentMethods((prev) => [...prev, newPaymentMethod]);
    setShowAddPaymentForm(false);
    setFormData({
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    });
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "V";
      case "mastercard":
        return "M";
      case "amex":
        return "A";
      case "discover":
        return "D";
      default:
        return "C";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payment Methods
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your saved payment methods
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="p-6">
            {paymentMethods.length === 0 && !showAddPaymentForm ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto" />
                </div>
                <p className="text-gray-500 mb-4">
                  You don't have any saved payment methods.
                </p>
                <button
                  onClick={() => setShowAddPaymentForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </button>
              </div>
            ) : (
              <>
                {/* List of payment methods */}
                <div className="mb-8 space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-md p-4 relative ${
                        method.isDefault ? "border-black" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-700 font-bold">
                            {getCardIcon(method.cardBrand)}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {method.cardBrand.charAt(0).toUpperCase() +
                                method.cardBrand.slice(1)}{" "}
                              ••••{method.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expires{" "}
                              {method.expiryMonth.toString().padStart(2, "0")}/
                              {method.expiryYear}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {!method.isDefault && (
                            <button
                              onClick={() => setDefaultPaymentMethod(method.id)}
                              className="text-sm text-black hover:underline"
                            >
                              Set as default
                            </button>
                          )}
                          <button
                            onClick={() => removePaymentMethod(method.id)}
                            className="text-gray-500 hover:text-red-500"
                            disabled={
                              paymentMethods.length === 1 && method.isDefault
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {method.isDefault && (
                        <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-black text-white rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add payment method button */}
                {!showAddPaymentForm && (
                  <button
                    onClick={() => setShowAddPaymentForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </button>
                )}
              </>
            )}

            {/* Add payment method form */}
            {showAddPaymentForm && (
              <div className="mt-8 border border-gray-200 rounded-md p-4">
                <h4 className="text-lg font-medium mb-4">Add Payment Method</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="cardholderName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cardNumber"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="expiryMonth"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Expiry Date
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          id="expiryMonth"
                          name="expiryMonth"
                          value={formData.expiryMonth}
                          onChange={handleChange}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                          required
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (month) => (
                              <option key={month} value={month}>
                                {month.toString().padStart(2, "0")}
                              </option>
                            )
                          )}
                        </select>
                        <select
                          id="expiryYear"
                          name="expiryYear"
                          value={formData.expiryYear}
                          onChange={handleChange}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                          required
                        >
                          <option value="">YYYY</option>
                          {Array.from(
                            { length: 10 },
                            (_, i) => new Date().getFullYear() + i
                          ).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cvv"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
