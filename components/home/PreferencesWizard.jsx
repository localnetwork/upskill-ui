import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus, Search, UserPen, X } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;
const TOTAL_STEPS = 3;
const MAX_INTERESTS = 50;
const PREVIEW_PER_GROUP = 12;

const COPY = {
  learner: {
    field: "What field are you learning for?",
    occupation: "Which occupation are you learning for?",
    skills: "Which skills are you interested in?",
  },
  instructor: {
    field: "What field do you teach in?",
    occupation: "Which occupation best describes you?",
    skills: "Which topics do you want to teach?",
  },
};

function RadioOption({ checked, label, onSelect }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2.5 text-[15px] text-slate-800">
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="h-5 w-5 shrink-0 accent-primary"
      />
      {label}
    </label>
  );
}

function SkillChip({ topic, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(topic.id)}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-transparent bg-primary/10 text-primary"
          : "border-slate-300 text-slate-800 hover:border-slate-500"
      }`}
    >
      {selected ? <Check size={14} /> : <Plus size={14} />}
      {topic.name}
    </button>
  );
}

function groupTopics(topics) {
  const groups = new Map();
  for (const topic of topics) {
    if (!groups.has(topic.group_id)) {
      groups.set(topic.group_id, { id: topic.group_id, name: topic.group_name, topics: [] });
    }
    groups.get(topic.group_id).topics.push(topic);
  }
  return Array.from(groups.values());
}

export default function PreferencesWizard({
  open,
  role = "learner",
  anonymous = false,
  required = false,
  onClose,
  onSaved,
}) {
  const copy = COPY[role] || COPY.learner;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({ fields: [], topics: [] });
  const [step, setStep] = useState(1);
  const [fieldId, setFieldId] = useState(null);
  const [occupationId, setOccupationId] = useState(null);
  const [customOccupation, setCustomOccupation] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [topicIds, setTopicIds] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setStep(1);
    setSearch("");
    setLoading(true);

    Promise.all([
      BaseApi.get(`${API}/users/preferences/options`),
      anonymous ? Promise.resolve(null) : BaseApi.get(`${API}/users/me/preferences`),
    ])
      .then(([optionsRes, prefsRes]) => {
        if (!active) return;
        const prefs = prefsRes?.data?.data || {};
        setOptions(optionsRes?.data?.data || { fields: [], topics: [] });
        setFieldId(prefs.occupation?.field_id || null);
        setOccupationId(prefs.occupation?.id || null);
        setCustomOccupation(prefs.occupation_custom || "");
        setShowCustom(Boolean(prefs.occupation_custom));
        setTopicIds(prefs.topic_ids || []);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Could not load your preferences.");
        onClose?.();
      })
      .finally(() => active && setLoading(false));

    document.body.style.overflow = "hidden";
    return () => {
      active = false;
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const selectedField = options.fields.find((field) => field.id === fieldId);
  const topicsById = useMemo(
    () => new Map(options.topics.map((topic) => [topic.id, topic])),
    [options.topics],
  );
  const selectedTopics = topicIds.map((id) => topicsById.get(id)).filter(Boolean);
  const skipOccupation = !selectedField;

  const toggleTopic = (id) => {
    setTopicIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_INTERESTS) {
        toast.error(`You can select up to ${MAX_INTERESTS} skills.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const chooseField = (id) => {
    if (id !== fieldId) {
      setOccupationId(null);
      setCustomOccupation("");
      setShowCustom(false);
    }
    setFieldId(id);
  };

  const sections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) {
      const matches = options.topics.filter((topic) =>
        topic.name.toLowerCase().includes(term),
      );
      return [{ key: "search", title: `Results for "${search.trim()}"`, groups: groupTopics(matches), full: true }];
    }

    const own = options.topics.filter((topic) => topic.field_id === fieldId);
    const result = [];
    if (own.length) {
      result.push({
        key: "own",
        title: `${selectedField?.name || "Popular"} skills`,
        groups: groupTopics(own),
        full: true,
      });
    }
    for (const field of options.fields) {
      if (field.id === fieldId) continue;
      const others = options.topics.filter((topic) => topic.field_id === field.id);
      if (others.length) {
        result.push({
          key: field.id,
          title: `${field.name} skills`,
          groups: [{ id: field.id, name: field.name, topics: others.slice(0, PREVIEW_PER_GROUP) }],
          full: false,
        });
      }
    }
    return result;
  }, [search, options, fieldId, selectedField]);

  const goNext = async () => {
    if (step === 1) {
      setStep(skipOccupation ? 3 : 2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    const payload = {
      occupationId: occupationId || null,
      occupationCustom: occupationId ? null : customOccupation.trim() || null,
      topicIds,
    };

    if ((required || anonymous) && !payload.occupationId && !payload.occupationCustom && !topicIds.length) {
      toast.error("Please choose an occupation or at least one skill.");
      return;
    }

    if (anonymous) {
      onSaved?.(payload);
      onClose?.();
      return;
    }

    setSaving(true);
    try {
      const response = await BaseApi.put(`${API}/users/me/preferences`, payload);
      toast.success("Preferences saved");
      window.dispatchEvent(new Event("preferences-saved"));
      onSaved?.(response?.data?.data);
      onClose?.();
    } catch (error) {
      toast.error(error?.data?.message || "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => setStep(step === 3 && skipOccupation ? 1 : step - 1);

  if (!open || !mounted) return null;

  const progress = (step / TOTAL_STEPS) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-white">
      <div className="h-1 w-full bg-slate-200">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!required && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={22} />
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[750px] px-5 py-12">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-64 animate-pulse rounded bg-slate-100" />
            </div>
          ) : step === 1 ? (
            <>
              <div className="mb-10 flex items-center gap-4 rounded-2xl bg-amber-50 px-6 py-5 text-sm text-slate-800">
                <UserPen className="shrink-0 text-amber-600" size={26} />
                Answer a few questions to improve your content recommendations
              </div>
              <h2 className="mb-6 text-3xl font-bold text-slate-900">{copy.field}</h2>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {options.fields.map((field) => (
                  <RadioOption
                    key={field.id}
                    checked={fieldId === field.id}
                    label={field.name}
                    onSelect={() => chooseField(field.id)}
                  />
                ))}
                <RadioOption
                  checked={fieldId === null}
                  label="None of the above"
                  onSelect={() => chooseField(null)}
                />
              </div>
            </>
          ) : step === 2 ? (
            <>
              <h2 className="mb-8 text-3xl font-bold text-slate-900">{copy.occupation}</h2>
              <h3 className="mb-4 font-bold text-slate-900">
                {selectedField?.name} occupations
              </h3>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {(selectedField?.occupations || []).map((occupation) => (
                  <RadioOption
                    key={occupation.id}
                    checked={occupationId === occupation.id}
                    label={occupation.name}
                    onSelect={() => {
                      setOccupationId(occupation.id);
                      setShowCustom(false);
                      setCustomOccupation("");
                    }}
                  />
                ))}
              </div>
              {showCustom ? (
                <input
                  autoFocus
                  value={customOccupation}
                  maxLength={100}
                  onChange={(event) => setCustomOccupation(event.target.value)}
                  placeholder="Enter your occupation"
                  className="mt-6 w-full max-w-md rounded-lg border border-slate-300 px-4 py-3 text-[15px] outline-none focus:border-primary"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom(true);
                    setOccupationId(null);
                  }}
                  className="mt-6 font-bold text-primary underline underline-offset-4"
                >
                  I can&apos;t find my occupation
                </button>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-6 text-3xl font-bold text-slate-900">{copy.skills}</h2>
              <div className="rounded-lg border border-slate-300 p-4">
                {selectedTopics.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedTopics.map((topic) => (
                      <span
                        key={topic.id}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium"
                      >
                        {topic.name}
                        <button
                          type="button"
                          aria-label={`Remove ${topic.name}`}
                          onClick={() => toggleTopic(topic.id)}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search for a skill"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </div>

              {!search.trim() && (
                <h3 className="mb-1 mt-8 text-lg font-bold text-slate-900">
                  Popular with learners like you
                </h3>
              )}
              {sections.map((section) => (
                <div key={section.key} className="mt-6">
                  <h4 className="mb-3 font-bold text-slate-900">{section.title}</h4>
                  {section.groups.length === 0 && (
                    <p className="text-sm text-slate-500">No skills found.</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {section.groups
                      .flatMap((group) => group.topics)
                      .map((topic) => (
                        <SkillChip
                          key={topic.id}
                          topic={topic}
                          selected={topicIds.includes(topic.id)}
                          onToggle={toggleTopic}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={saving}
            className="px-3 py-2 font-bold text-slate-900"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={loading || saving}
          className="rounded-lg bg-primary px-8 py-3 font-bold text-white hover:brightness-110 disabled:opacity-60"
        >
          {step === TOTAL_STEPS
            ? saving
              ? "Saving..."
              : anonymous
                ? "Continue"
                : "Save"
            : "Next"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
