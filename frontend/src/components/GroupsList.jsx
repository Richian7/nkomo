/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import CreateGroupButton from "./CreateGroupButton";

function GroupsList() {
  const { groups, fetchGroups, selectGroup, selectedGroup } = useChatStore();

  useEffect(() => {
    fetchGroups(); // Load all groups
  }, []);

  return (
    <div className="space-y-3 relative">

      {/* GROUPS LIST */}
      {groups.length === 0 && (
        <p className="text-slate-400 text-center mt-10">No groups yet</p>
      )}

      {groups.map((group) => (
        <button
          key={group._id}
          onClick={() => selectGroup(group)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition 
            ${
              selectedGroup?._id === group._id
                ? "bg-cyan-600/20 text-cyan-300"
                : "bg-slate-800/40 hover:bg-slate-700/40 text-slate-300"
            }
          `}
        >
          {/* AVATAR */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt="group"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold">{group.name[0]}</span>
            )}
          </div>

          {/* GROUP NAME */}
          <div className="flex-1 text-left">
            <p className="font-semibold">{group.name}</p>
            <p className="text-sm text-slate-400">
              {group.members.length} members
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default GroupsList;
