import { Play, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ROLE_PLAY_CHARACTERS,
  previewRolePlayVoice,
  stopRolePlayVoice,
} from "@/lib/rolePlayCharacters";

export function CharacterAvatar({ character, size = 28 }) {
  if (character.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={character.image}
        alt={character.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        backgroundColor: character.color,
        fontSize: size * 0.4,
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    >
      {character.name.replace(/\D/g, "") || character.name[0]}
    </span>
  );
}

export default function CharacterPickerModal({ value, onSave, onClose }) {
  const [selected, setSelected] = useState(value);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => () => stopRolePlayVoice(), []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-[500px] flex-col rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-slate-900">
            Select audio character
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grow grid-cols-2 gap-3 overflow-y-auto pr-1">
          {ROLE_PLAY_CHARACTERS.map((character) => {
            const active = selected === character.id;
            return (
              <div
                key={character.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(character.id)}
                onKeyDown={(event) =>
                  event.key === "Enter" && setSelected(character.id)
                }
                className={`cursor-pointer rounded-xl border p-3 ${
                  active
                    ? "border-primary ring-1 ring-[#6d28d9]"
                    : "border-slate-200"
                }`}
              >
                <div
                  className="flex h-[120px] items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${character.color}33` }}
                >
                  <CharacterAvatar character={character} size={72} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[14px] text-slate-900">
                    {character.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`${playingId === character.id ? "Stop" : "Play"} ${character.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (playingId === character.id) {
                        stopRolePlayVoice();
                        setPlayingId(null);
                        return;
                      }
                      setPlayingId(character.id);
                      const started = previewRolePlayVoice(
                        character,
                        undefined,
                        {
                          onEnd: () =>
                            setPlayingId((current) =>
                              current === character.id ? null : current,
                            ),
                        },
                      );
                      if (!started) setPlayingId(null);
                    }}
                    className="text-primary"
                  >
                    {playingId === character.id ? (
                      <Square size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                  </button>
                </div>
                <span className="mt-1 inline-block rounded border border-slate-300 px-1.5 text-[11px] text-slate-600">
                  {character.accent}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-primary px-5 py-2 text-[14px] font-bold text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="rounded bg-primary px-6 py-2 text-[14px] font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
