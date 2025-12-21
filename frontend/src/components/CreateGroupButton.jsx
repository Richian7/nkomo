import { Plus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

export default function CreateGroupButton() {
  const { openCreateGroupModal } = useChatStore();

  return (
    <button
      onClick={openCreateGroupModal} // ✅ This sets showCreateGroupModal = true
      className="
        w-12 h-12
        rounded-full
        bg-green-500 text-white
        shadow-lg shadow-black/30
        flex items-center justify-center
        hover:bg-green-600
        transition-all duration-200
        active:scale-95
      "
      title="Create Group"
    >
      <Plus size={24} />
    </button>
  );
}
