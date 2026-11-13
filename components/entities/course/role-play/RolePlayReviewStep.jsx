import { GripVertical, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import CharacterPickerModal, { CharacterAvatar } from "./CharacterPickerModal";
import RichTextField from "./RichTextField";
import {
  getRolePlayCharacter,
  previewRolePlayVoice,
} from "@/lib/rolePlayCharacters";

const DURATIONS = [
  { value: 3, hint: "Quick, focused exchange" },
  { value: 5, hint: "Most common scenarios" },
  { value: 10, hint: "Complex or high-stakes" },
];
const MAX_GOALS = 5;

function Field({ label, hint, extraHint, children }) {
  return (
    <div className="grid gap-4 py-5 md:grid-cols-[240px_1fr]">
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-[12px] leading-snug text-slate-500">{hint}</p>
        {extraHint && (
          <p className="mt-3 text-[12px] leading-snug text-slate-500">
            {extraHint}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="mx-auto mb-6 w-full max-w-[800px] divide-y divide-slate-100 rounded-[28px] bg-white p-8 shadow-sm md:p-10">
      <h1 className="pb-4 text-[26px] font-bold text-slate-900">{title}</h1>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-3 text-[14px] outline-none focus:border-[#5022c3]";

function GoalsEditor({ goals, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const update = (index, text) =>
    onChange(goals.map((goal, i) => (i === index ? text : goal)));

  const drop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...goals];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div className="space-y-2">
      {goals.map((goal, index) => (
        <div
          key={index}
          draggable={editingIndex !== index}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => drop(index)}
          onDragEnd={() => setDragIndex(null)}
          className={`flex items-start gap-2 rounded border border-slate-300 bg-white p-3 ${
            dragIndex === index ? "opacity-50" : ""
          }`}
        >
          <GripVertical
            size={16}
            className="mt-1 shrink-0 cursor-grab text-slate-400"
          />
          {editingIndex === index ? (
            <textarea
              autoFocus
              value={goal}
              rows={3}
              maxLength={300}
              onChange={(event) => update(index, event.target.value)}
              onBlur={() => setEditingIndex(null)}
              className="grow resize-none text-[14px] outline-none"
            />
          ) : (
            <p className="grow text-[14px] leading-relaxed text-slate-800">
              {goal || "Untitled goal"}
            </p>
          )}
          <button
            type="button"
            aria-label="Edit goal"
            onClick={() => setEditingIndex(index)}
            className="text-slate-500 hover:text-primary"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            aria-label="Delete goal"
            onClick={() => onChange(goals.filter((_, i) => i !== index))}
            className="text-slate-500 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      {goals.length < MAX_GOALS && (
        <button
          type="button"
          onClick={() => {
            onChange([...goals, ""]);
            setEditingIndex(goals.length);
          }}
          className="inline-flex items-center gap-1 rounded border border-primary px-4 py-2 text-[13px] font-bold text-primary"
        >
          <Plus size={14} /> Add goal
        </button>
      )}
    </div>
  );
}

export default function RolePlayReviewStep({
  details,
  onChange,
  onRegenerate,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const character = getRolePlayCharacter(details.ai_character.voice);
  const setCharacter = (patch) =>
    onChange({ ai_character: { ...details.ai_character, ...patch } });

  return (
    <>
      <Card title="Meeting Details">
        <Field
          label="Meeting title"
          hint="A short, descriptive title learners will see at the start of the Role Play."
        >
          <input
            value={details.meeting_title}
            maxLength={120}
            onChange={(event) =>
              onChange({ meeting_title: event.target.value })
            }
            className={inputClass}
          />
        </Field>

        <Field
          label="Scenario"
          hint="Set who's involved, what's at stake, and the challenge the learner walks into. Don't reveal how it should play out. Use direct and active language."
        >
          <textarea
            value={details.scenario}
            rows={9}
            maxLength={4000}
            onChange={(event) => onChange({ scenario: event.target.value })}
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <p className="mt-1 text-right text-[12px] text-slate-500">
            {details.scenario.length}
          </p>
        </Field>

        <Field
          label="Meeting duration"
          hint="Choose the time limit that matches the complexity of your scenario."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {DURATIONS.map((option) => {
              const active = details.duration_minutes === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ duration_minutes: option.value })}
                  className={`flex items-start gap-3 rounded border p-4 text-left ${
                    active ? "border-2 border-[#3b1a8a]" : "border-slate-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-[#3b1a8a]" : "border-slate-400"
                    }`}
                  >
                    {active && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3b1a8a]" />
                    )}
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900">
                      {option.value} minutes
                    </span>
                    <span className="text-[13px] text-slate-500">
                      {option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Learner role"
          hint="Describe who the learner is, their job title and context within the scenario."
        >
          <input
            value={details.learner_role}
            maxLength={200}
            onChange={(event) => onChange({ learner_role: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Learner goals"
          hint={`Your learners will be evaluated based on these goals. You can include a maximum of ${MAX_GOALS} objectives for each Role Play.`}
          extraHint="Write goals that are specific, observable, and tied to the skills this Role Play is meant to build."
        >
          <GoalsEditor
            goals={details.learner_goals}
            onChange={(learner_goals) => onChange({ learner_goals })}
          />
        </Field>

        <div className="pt-5">
          <button
            type="button"
            onClick={onRegenerate}
            className="text-[14px] font-bold text-primary hover:underline"
          >
            Edit setup &amp; regenerate
          </button>
        </div>
      </Card>

      <Card title="Character setup">
        <Field
          label="Name"
          hint="The name your AI character will use during the Role Play."
        >
          <input
            value={details.ai_character.name}
            maxLength={80}
            onChange={(event) => setCharacter({ name: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Audio character"
          hint="Choose how this character looks and sounds in audio mode."
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPickerOpen(true)}
            onKeyDown={(event) => event.key === "Enter" && setPickerOpen(true)}
            className="flex cursor-pointer items-center gap-3 rounded border border-slate-300 bg-white px-3 py-2"
          >
            <CharacterAvatar character={character} size={30} />
            <span className="grow text-[14px] text-slate-800">
              {character.name}
            </span>
            <button
              type="button"
              aria-label="Play voice sample"
              onClick={(event) => {
                event.stopPropagation();
                previewRolePlayVoice(character);
              }}
              className="text-primary"
            >
              <Play size={14} fill="currentColor" />
            </button>
          </div>
        </Field>

        <Field
          label="Character role"
          hint="Describe who this character is within the scenario — their job title and relationship to the learner."
        >
          <input
            value={details.ai_character.role}
            maxLength={160}
            onChange={(event) => setCharacter({ role: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Personality and background"
          hint="Describe how this character thinks, feels, and behaves. The more specific you are, the more realistic the conversation will feel."
        >
          <RichTextField
            value={details.ai_character.personality}
            onChange={(personality) => setCharacter({ personality })}
          />
        </Field>

        <Field
          label="AI character's first line"
          hint="The opening line the AI character says to kick off the conversation. Set the tone and give the learner a clear starting point."
        >
          <textarea
            value={details.opening_message}
            rows={3}
            maxLength={1000}
            onChange={(event) =>
              onChange({ opening_message: event.target.value })
            }
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field
          label="Private AI guidance"
          hint="Background the AI knows but the learner doesn't. Never shown to learners."
        >
          <textarea
            value={details.ai_instructions}
            rows={4}
            maxLength={4000}
            onChange={(event) =>
              onChange({ ai_instructions: event.target.value })
            }
            className={`${inputClass} resize-y`}
          />
        </Field>
      </Card>

      {pickerOpen && (
        <CharacterPickerModal
          value={character.id}
          onClose={() => setPickerOpen(false)}
          onSave={(voice) => {
            setCharacter({ voice });
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
