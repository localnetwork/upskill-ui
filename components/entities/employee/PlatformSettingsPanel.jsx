import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_CURRENCY = "PHP";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500";

export default function PlatformSettingsPanel({ canManage }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformFeePercent: 20,
    taxPercent: 0,
    payoutCycle: "ANYTIME",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await BaseApi.get(`${API}/admin/platform-settings`);
      const data = res?.data?.data || {};
      setSettings({
        platformFeePercent: Number(data.platformFeePercent ?? 20),
        taxPercent: Number(data.taxPercent ?? 0),
        payoutCycle: String(data.payoutCycle || "ANYTIME"),
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await BaseApi.put(`${API}/admin/platform-settings`, {
        platformFeePercent: Number(settings.platformFeePercent || 0),
        taxPercent: Number(settings.taxPercent || 0),
        payoutCycle: String(settings.payoutCycle || "ANYTIME").toUpperCase(),
        defaultCurrency: DEFAULT_CURRENCY,
      });
      toast.success("Platform settings updated.");
      await load();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  };

  const update = (key) => (event) =>
    setSettings((prev) => ({ ...prev, [key]: event.target.value }));
  const disabled = !canManage || loading;

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Platform commerce settings</h3>
          {!canManage && (
            <p className="text-sm text-slate-500">
              You have read-only access to these settings.
            </p>
          )}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Platform fee %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            disabled={disabled}
            value={settings.platformFeePercent}
            onChange={update("platformFeePercent")}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tax %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            disabled={disabled}
            value={settings.taxPercent}
            onChange={update("taxPercent")}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Payout cycle</label>
          <select
            disabled={disabled}
            value={settings.payoutCycle}
            onChange={update("payoutCycle")}
            className={inputClass}
          >
            <option value="ANYTIME">Anytime</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Default currency</label>
          <select disabled value={DEFAULT_CURRENCY} className={inputClass}>
            <option value={DEFAULT_CURRENCY}>PHP</option>
          </select>
        </div>
      </div>
    </div>
  );
}
