import {
  ChevronDown,
  CircleUserRound,
  EllipsisVertical,
  Flag,
  Pin,
  Trash2,
} from "lucide-react";
import SystemNote from "@/components/chat/SystemNote";
import {
  formatName,
  formatTime,
  renderMedia,
} from "@/components/chat/messageUtils";

export default function MessageThread({
  activeConversation,
  messageContainerRef,
  topSentinelRef,
  endRef,
  handleMessageContainerScroll,
  loadingMessages,
  isPreviewMode,
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
}) {
  return (
    <div
      ref={messageContainerRef}
      onScroll={handleMessageContainerScroll}
      className={`relative flex-1 overflow-y-auto p-4 ${
        activeConversation?.myBackgroundPath ? "" : "bg-white"
      }`}
      style={
        activeConversation?.myBackgroundPath
          ? {
              backgroundImage: `url("${activeConversation.myBackgroundPath}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div
        className="relative flex flex-col justify-end m-[-15px] px-5"
        style={{ minHeight: "100%" }}
      >
        {activeConversation?.myBackgroundPath ? (
          <div className="pointer-events-none absolute h-full inset-0 bg-white/70" />
        ) : null}
        <div ref={topSentinelRef} className="h-px w-full shrink-0" />
        {loadingMessages && !isPreviewMode ? (
          <p className="text-sm text-slate-500">Loading messages...</p>
        ) : chatMessages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          chatMessages.map((message) => {
            if (message.type === "SYSTEM" || message.messageType === "SYSTEM") {
              return <SystemNote key={message.id} message={message} />;
            }
            const mine = message.senderId === profile?.id;

            const senderParticipant = activeConversation?.participants?.find(
              (participant) =>
                String(participant.userId) === String(message.senderId),
            );
            const senderPhotoPath = senderParticipant?.photoPath || null;
            const deletedByMe =
              message.deletedForEveryoneById === profile?.id ||
              (message.deletedForEveryone && message.senderId === profile?.id);
            const canDeleteForEveryone =
              mine &&
              !message.deletedForEveryone &&
              Number(message.seenByCount || 0) === 0;

            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`group mb-3 flex relative ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className="relative flex items-start gap-2 max-w-[75%]">
                  {!mine ? (
                    senderPhotoPath ? (
                      <img
                        src={senderPhotoPath}
                        alt=""
                        className="mt-1 h-8 w-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <CircleUserRound className="mt-1 h-8 w-8 text-slate-400" />
                    )
                  ) : null}

                  <div
                    className={`rounded-3xl px-4 py-2 ${
                      message.id === matchingMessageIds[messageSearchIndex] &&
                      messageSearchActive
                        ? "ring-2 ring-blue-400 ring-offset-1"
                        : ""
                    } ${
                      message.deletedForEveryone
                        ? "bg-slate-100 text-slate-700"
                        : mine
                          ? themeClass
                          : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {message.deletedForEveryone ? (
                      <p className="text-sm font-medium text-slate-700">
                        {deletedByMe
                          ? "You deleted a message"
                          : `${formatName(message.sender)} deleted a message`}
                      </p>
                    ) : (
                      <>
                        {message.body ? (
                          <p className="whitespace-pre-wrap text-sm">
                            {message.body}
                          </p>
                        ) : null}
                        {message.mediaPath &&
                        ["IMAGE", "VIDEO"].includes(message.mediaType) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const mediaIndex = mediaMessages.findIndex(
                                (item) => item.id === message.id,
                              );
                              setMediaViewerIndex(
                                mediaIndex >= 0 ? mediaIndex : 0,
                              );
                            }}
                            className="block w-full cursor-pointer text-left"
                          >
                            {renderMedia(message.mediaPath, message.mediaType)}
                          </button>
                        ) : null}
                      </>
                    )}

                    <div
                      className={`mt-1 flex items-center gap-2 text-[11px] ${
                        message.deletedForEveryone
                          ? "text-slate-500"
                          : mine
                            ? "text-fuchsia-100"
                            : "text-slate-500"
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {mine && !message.deletedForEveryone ? (
                        <span>
                          {Number(message.seenByCount || 0) > 0
                            ? "Seen"
                            : "Sent"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {!isPreviewMode && !String(message.id).startsWith("tmp-") ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActionMenuMessageId((previous) =>
                            previous === message.id ? "" : message.id,
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-500 hover:bg-slate-100 transition"
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </button>
                      {actionMenuMessageId === message.id ? (
                        <div className="absolute right-0 top-7 z-20 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setActionMenuMessageId("");
                              setRemoveDialogMessage(message);
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleTogglePin(message.id);
                              setActionMenuMessageId("");
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pin className="h-3.5 w-3.5" />
                            {pinnedMessageIds.includes(message.id)
                              ? "Unpin"
                              : "Pin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionMenuMessageId("")}
                            className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Flag className="h-3.5 w-3.5" />
                            Report
                          </button>
                        </div>
                      ) : null}
                      {canDeleteForEveryone ? null : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        {loadingMoreMessages && (
          <div className="flex justify-center py-3">
            <p className="text-xs text-slate-400">
              Loading earlier messages...
            </p>
          </div>
        )}
        <div ref={endRef} />
        {showScrollToBottom && (
          <button
            type="button"
            onClick={() => {
              const container = messageContainerRef.current;
              if (container) {
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: "smooth",
                });
              }
              setShowScrollToBottom(false);
            }}
            className="sticky bottom-2 mx-auto flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
          >
            <ChevronDown className="h-4 w-4" />
            New messages
          </button>
        )}
      </div>
    </div>
  );
}
