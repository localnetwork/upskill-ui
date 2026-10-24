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
    trialEnabled: true,
    trialDays: 7,
    trialMaxCoursesPerLearner: 3,
    trialPoolMaxPercent: 20,
    trialConversionBonus: 50,
    trialConversionWindowDays: 30,
    subscriptionPoolPercent: 45,
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
        trialEnabled: data.trialEnabled !== false,
        trialDays: Number(data.trialDays ?? 7),
        trialMaxCoursesPerLearner: Number(data.trialMaxCoursesPerLearner ?? 3),
        trialPoolMaxPercent: Number(data.trialPoolMaxPercent ?? 20),
        trialConversionBonus: Number(data.trialConversionBonus ?? 50),
        trialConversionWindowDays: Number(data.trialConversionWindowDays ?? 30),
        subscriptionPoolPercent: Number(data.subscriptionPoolPercent ?? 45),
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
        trialEnabled: Boolean(settings.trialEnabled),
        trialDays: Number(settings.trialDays || 7),
        trialMaxCoursesPerLearner: Number(settings.trialMaxCoursesPerLearner || 3),
        trialPoolMaxPercent: Number(settings.trialPoolMaxPercent || 0),
        trialConversionBonus: Number(settings.trialConversionBonus || 0),
        trialConversionWindowDays: Number(settings.trialConversionWindowDays || 30),
        subscriptionPoolPercent: Number(settings.subscriptionPoolPercent || 0),
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
  const numberField = (key, label, { min = 0, max, step = 1 } = {}) => (
    <div key={key}>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={settings[key]}
        onChange={update(key)}
        className={inputClass}
      />
    </div>
  );

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

      <div className="mt-8 border-t border-slate-200 pt-5">
        <h4 className="text-base font-semibold text-slate-900">Free trial and subscription earnings</h4>
        <p className="mb-4 text-sm text-slate-500">
          Controls the learner free trial, the educator Trial Pool and the subscription revenue share.
        </p>
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(settings.trialEnabled)}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, trialEnabled: event.target.checked }))
            }
          />
          Give newly verified learners a free trial
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {numberField("trialDays", "Trial length (days)", { min: 1, max: 60 })}
          {numberField("trialMaxCoursesPerLearner", "Trial courses per learner", { min: 1, max: 50 })}
          {numberField("trialPoolMaxPercent", "Trial Pool cap (% of catalog)", { max: 100, step: 0.01 })}
          {numberField("trialConversionBonus", "Conversion bonus (PHP)", { max: 100000, step: 0.01 })}
          {numberField("trialConversionWindowDays", "Conversion window (days)", { min: 1, max: 365 })}
          {numberField("subscriptionPoolPercent", "Educator pool (% of net revenue)", { max: 100, step: 0.01 })}
        </div>
      </div>
    </div>
  );
}
