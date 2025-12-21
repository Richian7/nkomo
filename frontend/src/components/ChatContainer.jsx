import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import GroupChatHeader from "./GroupChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    selectedGroup,
    getMessagesByUserId,
    getMessagesByGroupId,
    messages,
    isMessagesLoading,
    typingUsers,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // Load messages + subscribe
  useEffect(() => {
    if (selectedUser) getMessagesByUserId(selectedUser._id);
    if (selectedGroup) getMessagesByGroupId(selectedGroup._id);

    subscribeToMessages();

    if (selectedGroup) socket?.emit("joinGroup", selectedGroup._id);

    return () => {
      unsubscribeFromMessages();
      if (selectedGroup) socket?.emit("leaveGroup", selectedGroup._id);
    };
  }, [selectedUser?._id, selectedGroup?._id]);

  // Auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedUser && !selectedGroup) return null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex-shrink-0">
        {selectedGroup ? <GroupChatHeader /> : <ChatHeader />}
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 sm:px-6 overflow-y-auto py-4">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => {
              const senderId =
                typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
              const isMe = senderId?.toString() === authUser._id.toString();
              const readByCount = msg.readBy?.length || 0;

              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`chat-bubble max-w-[80%] break-words p-3 rounded-lg shadow-md
                      ${isMe ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-200"}`}
                  >
                    {/* Sender name for group */}
                    {selectedGroup && !isMe && (
                      <p className="text-xs text-slate-400 mb-1 font-semibold">
                        {msg.senderId?.name || "Unknown"}
                      </p>
                    )}

                    {/* Text */}
                    {msg.text && <p>{msg.text}</p>}

                    {/* Image */}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="sent"
                        className="mt-2 max-w-xs sm:max-w-sm rounded-lg"
                      />
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* ✅ Read receipts */}
                      {isMe && selectedGroup && readByCount > 1 && (
                        <span className="text-xs text-slate-400 ml-2">
                          Seen by {readByCount - 1}
                        </span>
                      )}
                      {isMe && !selectedGroup && msg.isRead && (
                        <span className="text-xs text-cyan-300 ml-2">✔✔</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : (
          <NoChatHistoryPlaceholder
            name={selectedUser?.fullName || selectedGroup?.name}
          />
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 sm:px-6 pb-2">
          <p className="text-xs text-slate-400 italic">
            {typingUsers.join(", ")} typing...
          </p>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-2 bg-slate-900/80 border-t border-slate-700">
        <MessageInput />
      </div>
    </div>
  );
}

export default ChatContainer;
