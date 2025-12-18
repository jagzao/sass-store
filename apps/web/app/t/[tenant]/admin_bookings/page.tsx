"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * Bookings Management Page
 *
 * Allows administrators to:
 * - View all bookings (synced from calendar and manual)
 * - Filter bookings by status and date
 * - Convert bookings to customer visits
 * - View booking details
 */

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  googleEventId: string | null;
  service: {
    name: string;
  };
  notes: string | null;
}

export default function AdminBookingsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const url =
        filter === "all"
          ? `/api/tenants/${tenantSlug}/bookings`
          : `/api/tenants/${tenantSlug}/bookings?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToVisit = async (bookingId: string) => {
    if (
      !confirm(
        "Are you sure you want to convert this booking to a customer visit?",
      )
    ) {
      return;
    }

    try {
      setConverting(bookingId);

      const response = await fetch(
        `/api/tenants/${tenantSlug}/bookings/${bookingId}/convert-to-visit`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Successfully converted to customer visit!");
        fetchBookings(); // Refresh list
      } else {
        alert(`Failed to convert: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to convert booking:", error);
      alert("Failed to convert booking. Please try again.");
    } finally {
      setConverting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Bookings Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Bookings Management</h1>
        <p className="text-gray-600">
          View and manage all bookings, including those synced from Google
          Calendar
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${filter === "pending" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-4 py-2 rounded ${filter === "confirmed" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded ${filter === "completed" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded ${filter === "cancelled" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            No bookings found. Connect your Google Calendar to sync events.
          </p>
          <a
            href={`/t/${tenantSlug}/settings/calendar`}
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go to Calendar Settings
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      {booking.customerEmail && (
                        <p className="text-sm text-gray-500">
                          {booking.customerEmail}
                        </p>
                      )}
                      {booking.customerPhone && (
                        <p className="text-sm text-gray-500">
                          {booking.customerPhone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{booking.service.name}</p>
                    {booking.notes && (
                      <p className="text-sm text-gray-500">{booking.notes}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(booking.startTime)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4">
                    {booking.googleEventId ? (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Google Calendar
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">${booking.totalPrice}</td>
                  <td className="px-6 py-4">
                    {booking.status === "completed" && (
                      <button
                        onClick={() => handleConvertToVisit(booking.id)}
                        disabled={converting === booking.id}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {converting === booking.id
                          ? "Converting..."
                          : "Convert to Visit"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
