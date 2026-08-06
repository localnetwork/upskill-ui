import { CircleUserRound } from "lucide-react";
import EditableName from "./EditableName";

function formatName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "User"
  );
}

export default function ParticipantRow({
  participant,
  isSelf = false,
  onNicknameSave,
  disabled = false,
}) {
  const displayName = participant?.nickname || formatName(participant?.user);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative shrink-0">
        {participant?.photoPath ? (
          <img
            src={participant.photoPath}
            alt={displayName}
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <CircleUserRound className="h-10 w-10 text-slate-400" />
        )}
        {participant?.isOnline ? (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <EditableName
          value={displayName}
          placeholder={isSelf ? "You" : "No name"}
          onSave={(newName) => onNicknameSave?.(participant?.userId, newName)}
          disabled={disabled}
        />
        {isSelf ? <p className="mt-0.5 text-xs text-slate-400">You</p> : null}
      </div>
    </div>
  );
}
