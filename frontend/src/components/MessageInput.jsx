import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled, selectedUser, selectedGroup } = useChatStore();
  const { socket, authUser } = useAuthStore();

  const typingTimeoutRef = useRef(null);

  // 🔹 Emit typing and stopTyping events
  useEffect(() => {
    if (!socket) return;

    if (text.trim()) {
      if (selectedUser) {
        socket.emit("typing", { receiverId: selectedUser._id, name: authUser.name });
      } else if (selectedGroup) {
        socket.emit("typing", { groupId: selectedGroup._id, name: authUser.name });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedUser) socket.emit("stopTyping", { receiverId: selectedUser._id });
        else if (selectedGroup) socket.emit("stopTyping", { groupId: selectedGroup._id });
      }, 2000);
    } else {
      if (selectedUser) socket.emit("stopTyping", { receiverId: selectedUser._id });
      else if (selectedGroup) socket.emit("stopTyping", { groupId: selectedGroup._id });
    }
  }, [text, selectedUser, selectedGroup, socket, authUser.name]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({ text: text.trim(), image: imagePreview });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (selectedUser) socket?.emit("stopTyping", { receiverId: selectedUser._id });
    else if (selectedGroup) socket?.emit("stopTyping", { groupId: selectedGroup._id });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full p-2 sm:p-4 border-t border-slate-700/50 bg-slate-900/90 flex flex-col">
      {imagePreview && (
        <div className="w-full flex items-center justify-center mb-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center space-x-2 sm:space-x-4 w-full max-w-full mx-auto"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (isSoundEnabled) playRandomKeyStrokeSound();
          }}
          className="flex-1 min-h-[40px] sm:min-h-[48px] bg-slate-800/50 border border-slate-700/50 rounded-full py-2 px-4 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="Type a message..."
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 sm:p-3 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 transition-colors ${
            imagePreview ? "text-cyan-500" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
