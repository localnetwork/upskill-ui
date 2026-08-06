import {
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Lock,
  Search,
} from "lucide-react";
import { IconCircleButton, SectionToggle } from "@/components/chat/design-system/ChatUi";

export default function ChatRightPanel({
  chatPhotoUrl,
  activeConversationTitle,
  messageSearchActive,
  setMessageSearchActive,
  setMessageSearchQuery,
  setMessageSearchIndex,
  messageSearchQuery,
  matchingMessageIds,
  messageSearchIndex,
  rightPanelExpanded,
  setRightPanelExpanded,
  setIsPinnedPopupOpen,
  setCustomizeModal,
  setIsMediaPopupOpen,
  setIsFilesPopupOpen,
}) {
  return (
    <aside className="rounded-xl bg-white shadow-sm p-5 hidden lg:block overflow-y-auto">
      <div className="flex flex-col items-center text-center">
        {chatPhotoUrl ? (
          <img
            src={chatPhotoUrl}
            alt="Chat"
            className="h-24 w-24 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <CircleUserRound className="h-24 w-24 text-slate-400" />
        )}
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {activeConversationTitle}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          <Lock className="h-4 w-4" /> End-to-end encrypted
        </div>
        <IconCircleButton
          onClick={() => {
            setMessageSearchActive((prev) => !prev);
            if (messageSearchActive) {
              setMessageSearchQuery("");
              setMessageSearchIndex(0);
            }
          }}
          className={`mt-5 h-12 w-12 ${
            messageSearchActive
              ? "bg-blue-100 text-blue-600"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <Search className="h-6 w-6" />
        </IconCircleButton>
        <p className="mt-1 text-sm text-slate-600">Search</p>
        {messageSearchActive && (
          <div className="mt-3 w-full">
            <div className="relative">
              <input
                autoFocus
                value={messageSearchQuery}
                onChange={(e) => {
                  setMessageSearchQuery(e.target.value);
                  setMessageSearchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setMessageSearchActive(false);
                    setMessageSearchQuery("");
                    setMessageSearchIndex(0);
                  }
                }}
                placeholder="Search in conversation..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-16 text-sm outline-none"
              />
              {messageSearchQuery.trim() && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-500">
                  <span>
                    {matchingMessageIds.length > 0
                      ? `${messageSearchIndex + 1} of ${matchingMessageIds.length}`
                      : "No matches"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (matchingMessageIds.length === 0) return;
                      setMessageSearchIndex((prev) =>
                        prev > 0 ? prev - 1 : matchingMessageIds.length - 1,
                      );
                    }}
                    className="rounded p-0.5 hover:bg-slate-200"
                    disabled={matchingMessageIds.length === 0}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (matchingMessageIds.length === 0) return;
                      setMessageSearchIndex((prev) =>
                        prev < matchingMessageIds.length - 1 ? prev + 1 : 0,
                      );
                    }}
                    className="rounded p-0.5 hover:bg-slate-200"
                    disabled={matchingMessageIds.length === 0}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 text-lg font-semibold text-slate-900">
        <div className="border-b border-slate-100 pb-3">
          <SectionToggle
            label="Chat info"
            expanded={rightPanelExpanded.info}
            onToggle={() =>
              setRightPanelExpanded((prev) => ({
                ...prev,
                info: !prev.info,
              }))
            }
          />
          {rightPanelExpanded.info ? (
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={() => setIsPinnedPopupOpen(true)}
                className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View pinned messages
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-b border-slate-100 pb-3">
          <SectionToggle
            label="Customize chat"
            expanded={rightPanelExpanded.customize}
            onToggle={() =>
              setRightPanelExpanded((prev) => ({
                ...prev,
                customize: !prev.customize,
              }))
            }
          />
          {rightPanelExpanded.customize ? (
            <div className="mt-2 space-y-1">
              {[
                ["name", "Change chat name"],
                ["background", "Change background"],
                ["theme", "Change theme"],
                ["emoji", "Change default emoji"],
                ["nickname", "Edit nicknames"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCustomizeModal(key)}
                  className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-b border-slate-100 pb-3">
          <SectionToggle
            label="Media & files"
            expanded={rightPanelExpanded.mediaFiles}
            onToggle={() =>
              setRightPanelExpanded((prev) => ({
                ...prev,
                mediaFiles: !prev.mediaFiles,
              }))
            }
          />
          {rightPanelExpanded.mediaFiles ? (
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setIsMediaPopupOpen(true)}
                className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Media
              </button>
              <button
                type="button"
                onClick={() => setIsFilesPopupOpen(true)}
                className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Files
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-b border-slate-100 pb-3">
          <SectionToggle
            label="Privacy & support"
            expanded={rightPanelExpanded.privacy}
            onToggle={() =>
              setRightPanelExpanded((prev) => ({
                ...prev,
                privacy: !prev.privacy,
              }))
            }
          />
        </div>
      </div>
    </aside>
  );
}
