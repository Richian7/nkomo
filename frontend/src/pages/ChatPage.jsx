import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import GroupsList from "../components/GroupsList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

import CreateGroupButton from "../components/CreateGroupButton";
import CreateGroupModal from "../components/CreateGroupModal";
import { X } from "lucide-react";

function ChatPage() {
  const { activeTab, selectedUser, selectedGroup, selectGroup } = useChatStore();

  const isChatOpen = selectedUser || selectedGroup;

  return (
    <div className="relative w-full max-w-6xl h-screen mx-auto bg-slate-900 rounded-xl overflow-hidden">
      <BorderAnimatedContainer className="flex h-full">

        {/* LEFT SIDE - Sidebar */}
        <div
          className={`
            w-full md:w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col relative
            ${isChatOpen ? "hidden sm:flex md:flex" : "flex"}
          `}
        >
          <ProfileHeader />
          <ActiveTabSwitch />

          {/* Scrollable lists */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" && <ChatsList />}
            {activeTab === "contacts" && <ContactList />}
            {activeTab === "groups" && <GroupsList />}
          </div>

          {/* Sticky Create Group Button */}
          {activeTab === "groups" && (
            <div className="absolute bottom-6 right-4 z-10">
              <CreateGroupButton />
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Chat */}
        <div
          className={`
            flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm relative
            ${!isChatOpen ? "hidden md:flex" : "flex"}
          `}
        >
          {/* Close button only for group chat */}
          {selectedGroup && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => selectGroup(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/40 hover:bg-slate-700/50 transition"
              >
                <X size={22} />
              </button>
            </div>
          )}

          {isChatOpen ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>

      </BorderAnimatedContainer>

      {/* Create Group Modal */}
      <CreateGroupModal />
    </div>
  );
}

export default ChatPage;
