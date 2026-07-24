import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DevicesPage() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingId, setIsRemovingId] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      try {
        const res = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/devices`);
        setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const removeDevice = async (deviceId) => {
    setIsRemovingId(deviceId);
    try {
      await BaseApi.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/me/devices/${deviceId}`);
      setRows((prev) => prev.filter((row) => row.id !== deviceId));
      toast.success("Device removed");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove device");
    } finally {
      setIsRemovingId("");
    }
  };

  return (
    <div className="container py-[50px] max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Trusted Devices</h1>
      <p className="text-gray-500 mb-8">
        Devices on this list can skip 2FA on your next login.
      </p>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Loading devices...</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No trusted devices found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rows.map((row) => (
              <li key={row.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{row.deviceName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Logged in from: {row.locationLabel || row.ipAddress || "Unknown location"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last used: {formatDate(row.lastUsedAt)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Trusted until: {formatDate(row.expiresAt)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{row.userAgent || "Unknown user agent"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeDevice(row.id)}
                  disabled={isRemovingId === row.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
