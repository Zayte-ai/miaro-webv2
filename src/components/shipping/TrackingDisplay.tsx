"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Clock, CheckCircle, TruckIcon } from "lucide-react";

interface TrackingEvent {
  timestamp: string;
  eventType: string;
  eventDescription: string;
  location: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  currentLocation?: string;
}

interface TrackingDisplayProps {
  trackingNumber?: string;
  orderId?: string;
  className?: string;
}

export default function TrackingDisplay({
  trackingNumber: initialTrackingNumber,
  orderId,
  className = "",
}: TrackingDisplayProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTrackingNumber || orderId) {
      fetchTrackingInfo();
    }
  }, [initialTrackingNumber, orderId]);

  const fetchTrackingInfo = async () => {
    setLoading(true);
    setError("");

    try {
      let url;
      if (orderId) {
        // Track by order ID
        const response = await fetch("/api/shipping/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        setTrackingInfo(data.data);
      } else if (initialTrackingNumber) {
        // Track by tracking number
        const response = await fetch(
          `/api/shipping/track?trackingNumber=${initialTrackingNumber}`
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        setTrackingInfo(data.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch tracking information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes("DELIVERED")) return <CheckCircle className="text-green-600" />;
    if (statusUpper.includes("TRANSIT")) return <TruckIcon className="text-blue-600" />;
    if (statusUpper.includes("PICKUP")) return <Package className="text-orange-600" />;
    return <Clock className="text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes("DELIVERED")) return "bg-green-100 text-green-800";
    if (statusUpper.includes("TRANSIT")) return "bg-blue-100 text-blue-800";
    if (statusUpper.includes("PICKUP")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <p className="text-red-800 font-medium">Error loading tracking information</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchTrackingInfo}
          className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!trackingInfo) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">No tracking information available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(trackingInfo.status)}
              <h3 className="text-lg font-semibold">
                Tracking #{trackingInfo.trackingNumber}
              </h3>
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingInfo.status)}`}>
              {trackingInfo.statusDescription}
            </div>
          </div>
          <button
            onClick={fetchTrackingInfo}
            className="text-sm text-gray-600 hover:text-gray-900"
            title="Refresh tracking"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery Information */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackingInfo.currentLocation && (
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Current Location</p>
                <p className="text-sm text-gray-600">{trackingInfo.currentLocation}</p>
              </div>
            </div>
          )}
          {trackingInfo.estimatedDelivery && (
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {trackingInfo.actualDelivery ? "Delivered On" : "Estimated Delivery"}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(
                    trackingInfo.actualDelivery || trackingInfo.estimatedDelivery
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Tracking History</h4>
        <div className="space-y-4">
          {trackingInfo.events && trackingInfo.events.length > 0 ? (
            trackingInfo.events.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index === 0 ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  {index !== trackingInfo.events.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {event.eventDescription}
                  </p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tracking events available yet</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Tracking information updates every few hours. Last updated:{" "}
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
