import { X } from "lucide-react";
import MediaViewerModal from "@/components/chat/MediaViewerModal";
import ParticipantRow from "@/components/chat/ParticipantRow";
import {
  formatName,
  formatTime,
  getFileNameFromPath,
  renderMedia,
} from "@/components/chat/messageUtils";

export default function MessageOverlays({
  isPinnedPopupOpen,
  setIsPinnedPopupOpen,
  pinnedMessages,
  isMediaPopupOpen,
  setIsMediaPopupOpen,
  mediaByMonth,
  mediaMessages,
  setMediaViewerIndex,
  isFilesPopupOpen,
  setIsFilesPopupOpen,
  fileMessages,
  customizeModal,
  setCustomizeModal,
  chatNameOverride,
  setChatNameOverride,
  setChatTheme,
  setDefaultEmoji,
  activeConversation,
  profile,
  handleSaveNickname,
  activeConversationId,
  isPreviewMode,
  handleBackgroundUpload,
  backgroundUploading,
  handleRemoveBackground,
  removeDialogMessage,
  setRemoveDialogMessage,
  handleDeleteMessage,
  mediaViewerIndex,
}) {
  return (
    <>
      {isPinnedPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Pinned messages</h3>
              <button
                type="button"
                onClick={() => setIsPinnedPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {pinnedMessages.length ? (
                pinnedMessages.map((item) => (
                  <div key={item.id} className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      {formatName(item.sender)} · {formatTime(item.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">
                      {item.deletedForEveryone ? "Deleted message" : item.body || "Attachment"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No pinned messages yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isMediaPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Media</h3>
              <button
                type="button"
                onClick={() => setIsMediaPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto">
              {Object.keys(mediaByMonth).length ? (
                Object.entries(mediaByMonth).map(([month, items]) => (
                  <div key={month}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {month}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const mediaIndex = mediaMessages.findIndex(
                              (media) => media.id === item.id,
                            );
                            setMediaViewerIndex(mediaIndex >= 0 ? mediaIndex : 0);
                          }}
                          className="block overflow-hidden rounded-md border border-slate-200 cursor-pointer"
                        >
                          {renderMedia(item.mediaPath, item.mediaType)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No media yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isFilesPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Files</h3>
              <button
                type="button"
                onClick={() => setIsFilesPopupOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto">
              {fileMessages.length ? (
                fileMessages.map((item) => (
                  <a
                    key={item.id}
                    href={item.mediaPath}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {getFileNameFromPath(item.mediaPath)}
                    </p>
                    <p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">No files yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {customizeModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Customize chat</h3>
              <button
                type="button"
                onClick={() => setCustomizeModal(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {customizeModal === "name" ? (
              <>
                <input
                  value={chatNameOverride}
                  onChange={(event) => setChatNameOverride(event.target.value)}
                  placeholder="Chat name"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomizeModal(null)}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </>
            ) : null}
            {customizeModal === "theme" ? (
              <div className="space-y-2">
                {[
                  ["purple", "Purple"],
                  ["blue", "Blue"],
                  ["green", "Green"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setChatTheme(value);
                      setCustomizeModal(null);
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {customizeModal === "emoji" ? (
              <div className="grid grid-cols-6 gap-2">
                {["👍", "❤️", "🔥", "😂", "🎉", "👋"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setDefaultEmoji(emoji);
                      setCustomizeModal(null);
                    }}
                    className="rounded-md border border-slate-200 py-2 text-lg hover:bg-slate-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            {customizeModal === "nickname" ? (
              <div className="space-y-1">
                {activeConversation?.participants?.length ? (
                  activeConversation.participants.map((participant) => (
                    <ParticipantRow
                      key={participant.userId}
                      participant={participant}
                      isSelf={String(participant.userId) === String(profile?.id)}
                      onNicknameSave={handleSaveNickname}
                      disabled={!activeConversationId || isPreviewMode}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No participants.</p>
                )}
              </div>
            ) : null}
            {customizeModal === "background" ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (file) handleBackgroundUpload(file);
                    event.target.value = "";
                  }}
                />
                {backgroundUploading ? (
                  <p className="mt-2 text-xs text-slate-500">Uploading...</p>
                ) : null}
                {activeConversation?.myBackgroundPath ? (
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="mt-3 w-full rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove background
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {removeDialogMessage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Remove message</h3>
              <button
                type="button"
                onClick={() => setRemoveDialogMessage(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">Choose how to remove this message.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const target = removeDialogMessage;
                  setRemoveDialogMessage(null);
                  handleDeleteMessage(target, "FOR_ME");
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Remove for you
              </button>
              {removeDialogMessage?.senderId === profile?.id &&
              !removeDialogMessage?.deletedForEveryone &&
              Number(removeDialogMessage?.seenByCount || 0) === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = removeDialogMessage;
                    setRemoveDialogMessage(null);
                    handleDeleteMessage(target, "FOR_EVERYONE");
                  }}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Remove for everyone
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mediaViewerIndex !== null && mediaMessages.length > 0 ? (
        <MediaViewerModal
          items={mediaMessages}
          index={mediaViewerIndex}
          profile={profile}
          onClose={() => setMediaViewerIndex(null)}
        />
      ) : null}
    </>
  );
}
