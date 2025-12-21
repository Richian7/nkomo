import { useChatStore } from "../store/useChatStore";

function GroupChatHeader() {
  const { selectedGroup } = useChatStore();

  if (!selectedGroup) return null;

  return (
    <div className="h-16 px-6 flex items-center gap-4 border-b border-slate-700">
      {/* GROUP AVATAR */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
        {selectedGroup.avatar ? (
          <img
            src={selectedGroup.avatar}
            alt="group"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-semibold text-lg">
            {selectedGroup.name[0]}
          </span>
        )}
      </div>

      {/* GROUP INFO */}
      <div className="flex-1">
        <p className="font-semibold">{selectedGroup.name}</p>
        <p className="text-xs text-slate-400">
          {selectedGroup.members.length} members
        </p>
      </div>
    </div>
  );
}

export default GroupChatHeader;
