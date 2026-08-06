import {
  CircleUserRound,
  Image as ImageIcon,
  Info,
  MessageCircleMore,
  Mic,
  SendHorizontal,
  Smile,
  Video,
} from "lucide-react";
import EditableName from "@/components/chat/EditableName";
import MessageThread from "@/components/chat/MessageThread";
import { IconCircleButton } from "@/components/chat/design-system/ChatUi";
import { formatName } from "@/components/chat/messageUtils";

export default function ChatMainPanel({
  activeConversationId,
  isPreviewMode,
  activePeer,
  activeConversation,
  activePeerLabel,
  handleSaveNickname,
  activeConversationTitle,
  activePeerOnline,
  messageContainerRef,
  topSentinelRef,
  endRef,
  handleMessageContainerScroll,
  loadingMessages,
  chatMessages,
  profile,
  matchingMessageIds,
  messageSearchIndex,
  messageSearchActive,
  themeClass,
  mediaMessages,
  setMediaViewerIndex,
  actionMenuMessageId,
  setActionMenuMessageId,
  setRemoveDialogMessage,
  handleTogglePin,
  pinnedMessageIds,
  loadingMoreMessages,
  showScrollToBottom,
  setShowScrollToBottom,
  attachment,
  setAttachment,
  fileInputRef,
  uploadAttachment,
  uploading,
  composerText,
  setComposerText,
  handleSend,
  defaultEmoji,
  sending,
}) {
  return (
    <main className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
      {!activeConversationId && !isPreviewMode ? (
        <div className="m-auto text-center px-5">
          <p className="text-lg font-semibold text-slate-700">
            Select or start a conversation
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activePeer?.photoPath ? (
                <img
                  src={activePeer.photoPath}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <CircleUserRound className="h-11 w-11 text-slate-400" />
              )}
              <div>
                <p className="text-xl font-semibold leading-tight text-slate-900">
                  {activeConversationId &&
                  !activeConversation?.isGroup &&
                  activePeer?.id ? (
                    <EditableName
                      value={activePeerLabel}
                      placeholder={formatName(activePeer)}
                      onSave={(newName) => handleSaveNickname(activePeer.id, newName)}
                    />
                  ) : (
                    activeConversationTitle
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {activePeerOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <IconCircleButton className="h-9 w-9 text-[#a21caf] hover:bg-fuchsia-50">
              <Info className="h-5 w-5" />
            </IconCircleButton>
          </div>

          <MessageThread
            activeConversation={activeConversation}
            messageContainerRef={messageContainerRef}
            topSentinelRef={topSentinelRef}
            endRef={endRef}
            handleMessageContainerScroll={handleMessageContainerScroll}
            loadingMessages={loadingMessages}
            isPreviewMode={isPreviewMode}
            chatMessages={chatMessages}
            profile={profile}
            matchingMessageIds={matchingMessageIds}
            messageSearchIndex={messageSearchIndex}
            messageSearchActive={messageSearchActive}
            themeClass={themeClass}
            mediaMessages={mediaMessages}
            setMediaViewerIndex={setMediaViewerIndex}
            actionMenuMessageId={actionMenuMessageId}
            setActionMenuMessageId={setActionMenuMessageId}
            setRemoveDialogMessage={setRemoveDialogMessage}
            handleTogglePin={handleTogglePin}
            pinnedMessageIds={pinnedMessageIds}
            loadingMoreMessages={loadingMoreMessages}
            showScrollToBottom={showScrollToBottom}
            setShowScrollToBottom={setShowScrollToBottom}
          />

          <div className="border-t border-slate-200 bg-white px-3 py-2">
            {attachment?.path ? (
              <div className="mb-2 rounded-xl border border-slate-200 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">
                    Attachment ready
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-xs font-bold text-red-600"
                  >
                    Remove
                  </button>
                </div>
                {attachment.mediaType === "VIDEO" ? (
                  <video
                    src={attachment.path}
                    controls
                    className="max-h-44 w-full rounded border border-slate-200 bg-black"
                  />
                ) : (
                  <img
                    src={attachment.path}
                    alt="attachment"
                    className="max-h-44 w-full rounded border border-slate-200 object-cover"
                  />
                )}
              </div>
            ) : null}

            <div className="flex items-end gap-2 rounded-full bg-slate-100 px-2 py-2">
              <IconCircleButton className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50">
                <Mic className="h-5 w-5" />
              </IconCircleButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => uploadAttachment(event.target.files?.[0] || null)}
              />
              <IconCircleButton
                className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  "..."
                ) : (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-5 w-5" />
                    <Video className="h-5 w-5" />
                  </span>
                )}
              </IconCircleButton>
              <IconCircleButton className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50">
                <MessageCircleMore className="h-5 w-5" />
              </IconCircleButton>
              <div className="px-2">
                <input
                  value={composerText}
                  onChange={(event) => setComposerText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Aa ${defaultEmoji}`}
                  className="w-full min-w-[180px] bg-transparent px-1 py-1 text-base text-slate-800 outline-none"
                />
              </div>
              <IconCircleButton className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50">
                <Smile className="h-5 w-5" />
              </IconCircleButton>
              <IconCircleButton
                onClick={handleSend}
                className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                disabled={
                  sending ||
                  (!composerText.trim() && !attachment?.path) ||
                  (!activeConversationId && !isPreviewMode)
                }
              >
                <SendHorizontal className="h-5 w-5" />
              </IconCircleButton>
              <IconCircleButton className="h-auto w-auto p-1 text-blue-600 hover:bg-blue-50">
                <span className="text-base">{defaultEmoji}</span>
              </IconCircleButton>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
