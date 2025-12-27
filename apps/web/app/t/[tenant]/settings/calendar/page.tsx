"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SyncDetailsModal from "@/components/SyncDetailsModal";

/**
 * Google Calendar Settings Page
 *
 * Allows administrators to:
 * - Connect their Google Calendar
 * - View connection status
 * - Manually trigger calendar sync (with preview and selection)
 * - View sync history and statistics
 */
export default function CalendarSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenant as string;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [calendarEmail, setCalendarEmail] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalTab, setModalTab] = useState<"new" | "existing" | "skipped">(
    "new",
  );

  // Check for OAuth callback success/error
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setConnected(true);
      // Remove query params from URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (error) {
      alert(`Error connecting Google Calendar: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Fetch connection status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${tenantSlug}/calendar/sync`);
      const data = await response.json();

      if (response.ok) {
        setConnected(data.connected);
        setSyncStats({
          calendarId: data.calendarId,
          totalSyncedBookings: data.totalSyncedBookings,
        });
      }
    } catch (error) {
      console.error("Failed to fetch calendar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      alert(
        "Google Calendar integration not configured. Please contact support.",
      );
      return;
    }

    // Build state object with tenant slug and optional calendar email
    const stateData = {
      tenantSlug,
      calendarId: calendarEmail.trim() || null,
    };
    const state = encodeURIComponent(JSON.stringify(stateData));

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly")}&access_type=offline&state=${state}&prompt=consent`;

    window.location.href = authUrl;
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/calendar/disconnect`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        setConnected(false);
        setSyncStats(null);
        setSyncResult(null);
        alert("Google Calendar disconnected successfully");
      } else {
        const data = await response.json();
        alert(`Failed to disconnect: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect calendar");
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      // Perform a preview first
      const response = await fetch(
        `/api/tenants/${tenantSlug}/calendar/sync?daysBack=30&preview=true`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSyncResult(data);
        // We also store the full data for the modal
        setModalData({
          new: data.events?.new || [],
          existing: data.events?.existing || [],
          skipped: data.events?.skipped || [],
          errors: data.events?.errors || [],
        });
      } else {
        alert(`Preview failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      alert("Failed to sync calendar. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmSync = async (selectedIds: string[]) => {
    try {
      setSyncing(true);
      setModalOpen(false); // Close modal while working

      const response = await fetch(
        `/api/tenants/${tenantSlug}/calendar/sync?daysBack=30`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventIds: selectedIds }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSyncResult(data); // Update with FINAL results (preview: false)
        fetchStatus();
        alert(`Successfully synced ${data.summary.syncedBookings} bookings.`);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to confirm sync:", error);
      alert("Failed to confirm sync.");
    } finally {
      setSyncing(false);
    }
  };

  const openModal = (tab: "new" | "existing" | "skipped") => {
    if (syncResult?.preview && modalData) {
      setModalTab(tab);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Google Calendar Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Google Calendar Integration</h1>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span className="font-medium">
            {connected ? "Connected" : "Not Connected"}
          </span>
        </div>

        {connected && syncStats && (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-600">
              <strong>Calendar ID:</strong> {syncStats.calendarId || "primary"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total Synced Bookings:</strong>{" "}
              {syncStats.totalSyncedBookings || 0}
            </p>
          </div>
        )}

        {!connected ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="calendarEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Calendar Email (Optional)
              </label>
              <input
                id="calendarEmail"
                type="email"
                value={calendarEmail}
                onChange={(e) => setCalendarEmail(e.target.value)}
                placeholder="e.g., marialiciavh1984@gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use the primary calendar of the account you
                connect with
              </p>
            </div>
            <button
              onClick={handleConnectCalendar}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSyncCalendar}
              disabled={syncing}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {syncing ? "Syncing..." : "Sync Calendar Now"}
            </button>
            <button
              onClick={handleDisconnectCalendar}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Sync Results */}
      {syncResult && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {syncResult.preview ? "Sync Preview Results" : "Last Sync Results"}
          </h2>
          {syncResult.preview && (
            <p className="text-sm text-gray-500 mb-4">
              Click on the cards below to view details and select events to
              sync.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className={`bg-blue-50 p-4 rounded ${syncResult.preview ? "cursor-pointer hover:bg-blue-100 transition" : ""}`}
              onClick={() => openModal("new")}
            >
              <p className="text-2xl font-bold text-blue-600">
                {syncResult.summary.totalEvents}
              </p>
              <p className="text-sm text-gray-600">Total Events Found</p>
            </div>

            <div
              className={`bg-green-50 p-4 rounded ${syncResult.preview ? "cursor-pointer hover:bg-green-100 transition" : ""}`}
              onClick={() => openModal("new")}
            >
              <p className="text-2xl font-bold text-green-600">
                {syncResult.preview
                  ? syncResult.summary.newEvents
                  : syncResult.summary.syncedBookings}
              </p>
              <p className="text-sm text-gray-600">
                {syncResult.preview
                  ? "New Candidates (Review)"
                  : "New Bookings Created"}
              </p>
            </div>

            <div
              className={`bg-yellow-50 p-4 rounded ${syncResult.preview ? "cursor-pointer hover:bg-yellow-100 transition" : ""}`}
              onClick={() => openModal("existing")}
            >
              <p className="text-2xl font-bold text-yellow-600">
                {syncResult.preview
                  ? syncResult.summary.existingEvents
                  : syncResult.summary.skippedEvents}
              </p>
              <p className="text-sm text-gray-600">
                {syncResult.preview
                  ? "Already Synced (Found)"
                  : "Events Skipped"}
              </p>
            </div>

            <div
              className={`bg-red-50 p-4 rounded ${syncResult.preview ? "cursor-pointer hover:bg-red-100 transition" : ""}`}
              onClick={() => openModal("skipped")}
            >
              <p className="text-2xl font-bold text-red-600">
                {syncResult.preview
                  ? syncResult.summary.skippedEvents + syncResult.summary.errors
                  : syncResult.summary.errors}
              </p>
              <p className="text-sm text-gray-600">Errors / Skipped</p>
            </div>
          </div>

          {/* Detailed error list for final result */}
          {!syncResult.preview &&
            syncResult.errors &&
            syncResult.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded">
                <p className="font-semibold text-red-800 mb-2">Errors:</p>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {syncResult.errors.map((err: any, idx: number) => (
                    <li key={idx}>
                      Event {err.eventId}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>

        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Click "Connect Google Calendar" to authorize access</li>
          <li>Grant read-only permission to your calendar</li>
          <li>Click "Sync Calendar Now" to import events</li>
          <li>
            Events from the last 30 days will be converted to bookings
            automatically
          </li>
          <li>
            Go to the Bookings page to review and convert them to customer
            visits
          </li>
        </ol>

        <div className="mt-4 bg-yellow-50 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> We only request read-only access to your
            calendar. We will never modify or delete your calendar events.
          </p>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && modalData && (
        <SyncDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmSync}
          data={modalData}
          initialTab={modalTab}
        />
      )}
    </div>
  );
}
