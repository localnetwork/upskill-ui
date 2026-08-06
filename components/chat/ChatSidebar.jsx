import {
  CircleEllipsis,
  CircleUserRound,
  MessageCircleMore,
  Search,
} from "lucide-react";
import { IconCircleButton } from "@/components/chat/design-system/ChatUi";
import { formatName, formatTimeAgo } from "@/components/chat/messageUtils";

export default function ChatSidebar({
  conversationSearch,
  setConversationSearch,
  conversations,
  setActiveConversationId,
  userSearch,
  setUserSearch,
  setSelectedUserForConversation,
  searchingUsers,
  userSearchRows,
  selectedUserForConversation,
  setMessages,
  setPreviewMessages,
  createConversation,
  loadingConversations,
  sidebarListRef,
  activeConversationId,
  setPreviewRoomId,
  presenceMap,
}) {
  return (
    <aside className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
          Chats
        </h1>
        <div className="flex items-center gap-2">
          <IconCircleButton className="bg-slate-100 hover:bg-slate-200">
            <CircleEllipsis className="h-5 w-5 text-slate-700" />
          </IconCircleButton>
          <IconCircleButton className="bg-slate-100 hover:bg-slate-200">
            <MessageCircleMore className="h-5 w-5 text-slate-700" />
          </IconCircleButton>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && conversations.length > 0) {
                event.preventDefault();
                setActiveConversationId(conversations[0].id);
              }
            }}
            placeholder="Search Messenger"
            className="w-full rounded-full bg-slate-100 py-2.5 pl-10 pr-3 text-base font-medium text-slate-800 outline-none"
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2 text-base font-semibold">
        <button className="rounded-full bg-blue-50 px-4 py-1.5 text-blue-700">
          All
        </button>
        <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
          Unread
        </button>
        <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
          Groups
        </button>
        <button className="rounded-full px-4 py-1.5 text-slate-700 hover:bg-slate-100">
          Communities
        </button>
      </div>

      <div className="px-4 pb-2">
        <input
          value={userSearch}
          onChange={(event) => {
            setUserSearch(event.target.value);
            setSelectedUserForConversation(null);
          }}
          placeholder="Search people to open room..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        {searchingUsers ? (
          <p className="mt-2 text-xs text-slate-500">Searching...</p>
        ) : userSearchRows.length > 0 ? (
          <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
            {userSearchRows.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setActiveConversationId("");
                  setMessages([]);
                  setSelectedUserForConversation(user);
                  setPreviewMessages([]);
                }}
                className={`w-full rounded-lg border px-2 py-2 text-left ${
                  selectedUserForConversation?.id === user.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">
                  {formatName(user)}
                </p>
                <p className="text-xs text-slate-500">@{user.username}</p>
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() =>
            selectedUserForConversation?.id
              ? createConversation(selectedUserForConversation.id)
              : null
          }
          disabled={!selectedUserForConversation?.id}
          className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Start conversation (save to DB)
        </button>
      </div>

      <div
        ref={sidebarListRef}
        className="h-[calc(100%-280px)] overflow-y-auto px-2 pb-2"
      >
        {loadingConversations ? (
          <p className="px-2 py-3 text-sm text-slate-500">
            Loading conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">
            No conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              data-conversation-id={conversation.id}
              onClick={() => {
                setSelectedUserForConversation(null);
                setPreviewRoomId("");
                setPreviewMessages([]);
                setActiveConversationId(conversation.id);
              }}
              className={`w-full rounded-xl px-2 py-2 text-left ${
                activeConversationId === conversation.id
                  ? "bg-slate-100"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {conversation.otherParticipants?.[0]?.photoPath ? (
                    <img
                      src={conversation.otherParticipants[0].photoPath}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <CircleUserRound className="h-14 w-14 text-slate-400" />
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                      conversation.otherParticipants?.some(
                        (item) => presenceMap[item.id],
                      )
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-lg font-semibold text-slate-900">
                      {conversation.title || "Conversation"}
                    </p>
                    <p className="text-[13px] text-slate-500">
                      {formatTimeAgo(conversation.lastMessageAt)}
                    </p>
                  </div>
                  <p className="line-clamp-1 text-sm text-slate-600">
                    {conversation.lastMessage?.deletedForEveryone
                      ? "Message deleted"
                      : conversation.lastMessage?.body ||
                        (conversation.lastMessage?.mediaPath
                          ? "[Attachment]"
                          : "No messages yet")}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
