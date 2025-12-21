import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // =====================
  // STATE
  // =====================
  allContacts: [],
  chats: [],
  messages: [],
  typingUsers: [],
  activeTab: "chats",

  selectedUser: null,
  selectedGroup: null,

  groups: [],
  showCreateGroupModal: false,

  isUsersLoading: false,
  isMessagesLoading: false,

  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  unreadCounts: {}, // { userId/groupId: count }
  lastSeen: {},     // { userId: timestamp }

  // =====================
  // SETTINGS
  // =====================
  toggleSound: () => {
    const value = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", value);
    set({ isSoundEnabled: value });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (user) =>
    set({
      selectedUser: user,
      selectedGroup: null,
      messages: [],
      unreadCounts: user
        ? { ...get().unreadCounts, [user._id]: 0 }
        : get().unreadCounts,
    }),

  setSelectedGroup: (group) => // ✅ added setter for modal
    set({
      selectedGroup: group,
      selectedUser: null,
      messages: [],
      unreadCounts: group
        ? { ...get().unreadCounts, [group._id]: 0 }
        : get().unreadCounts,
    }),

  selectGroup: (group) =>
    set({
      selectedGroup: group,
      selectedUser: null,
      messages: [],
      unreadCounts: group
        ? { ...get().unreadCounts, [group._id]: 0 }
        : get().unreadCounts,
    }),

  openCreateGroupModal: () => set({ showCreateGroupModal: true }),
  closeCreateGroupModal: () => set({ showCreateGroupModal: false }),

  // ✅ Fix: setter for groups
  setGroups: (groups) => set({ groups }),

  // =====================
  // FETCHING
  // =====================
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
      return res.data; // ✅ return for modal
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch contacts");
      return [];
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({
        messages: res.data,
        unreadCounts: { ...get().unreadCounts, [userId]: 0 },
      });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getMessagesByGroupId: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({
        messages: res.data,
        unreadCounts: { ...get().unreadCounts, [groupId]: 0 },
      });
    } catch {
      toast.error("Failed to load group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  fetchGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
      return res.data; // ✅ return for modal
    } catch {
      toast.error("Failed to fetch groups");
      return [];
    }
  },

  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups", formData);
      return res.data; // ✅ return new group
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
      throw err;
    }
  },

  // =====================
  // SEND MESSAGE
  // =====================
  sendMessage: async (data) => {
    const { selectedUser, selectedGroup, messages } = get();
    const { authUser, socket } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderId: { _id: authUser._id, name: authUser.fullName },
      receiverId: selectedUser?._id,
      groupId: selectedGroup?._id,
      text: data.text,
      image: data.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      readBy: selectedGroup ? [authUser._id] : undefined,
      isRead: false,
    };

    set({ messages: [...messages, optimistic] });

    try {
      let res;
      if (selectedUser) {
        res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
      } else if (selectedGroup) {
        res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, data);
      }

      set({
        messages: get().messages.map((m) => (m._id === tempId ? res.data : m)),
      });

      socket.emit("sendMessage", res.data);
    } catch {
      set({ messages });
      toast.error("Message failed");
    }
  },

  // =====================
  // SOCKET SUBSCRIPTIONS
  // =====================
  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    const sound = new Audio("/sounds/notification.mp3");

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messagesRead");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("lastSeenUpdate");

    socket.on("newMessage", (msg) => {
      const { selectedUser, isSoundEnabled } = get();
      const isCurrentChat = selectedUser && msg.senderId === selectedUser._id;

      if (!isCurrentChat) {
        set((s) => ({
          unreadCounts: {
            ...s.unreadCounts,
            [msg.senderId]: (s.unreadCounts[msg.senderId] || 0) + 1,
          },
        }));
        if (isSoundEnabled) sound.play().catch(() => {});
        return;
      }

      set({ messages: [...get().messages, msg] });
      socket.emit("markAsRead", { messageIds: [msg._id], senderId: msg.senderId });
    });

    socket.on("newGroupMessage", (msg) => {
      const { selectedGroup, isSoundEnabled } = get();
      const isCurrentGroup = selectedGroup && msg.groupId === selectedGroup._id;

      if (!isCurrentGroup) {
        set((s) => ({
          unreadCounts: {
            ...s.unreadCounts,
            [msg.groupId]: (s.unreadCounts[msg.groupId] || 0) + 1,
          },
        }));
        if (isSoundEnabled) sound.play().catch(() => {});
        return;
      }

      set({ messages: [...get().messages, msg] });
      socket.emit("markAsRead", { messageIds: [msg._id], groupId: msg.groupId });
    });

    socket.on("messagesRead", ({ messageIds, readerId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          messageIds.includes(m._id)
            ? {
                ...m,
                isRead: true,
                readBy: readerId
                  ? [...new Set([...(m.readBy || []), readerId])]
                  : m.readBy,
              }
            : m
        ),
      }));
    });

    socket.on("typing", ({ name }) => {
      set((s) => ({ typingUsers: [...new Set([...s.typingUsers, name])] }));
    });

    socket.on("stopTyping", ({ name }) => {
      set((s) => ({ typingUsers: s.typingUsers.filter((u) => u !== name) }));
    });

    socket.on("lastSeenUpdate", ({ userId, timestamp }) => {
      set((s) => ({ lastSeen: { ...s.lastSeen, [userId]: timestamp } }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messagesRead");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("lastSeenUpdate");
  },
}));
