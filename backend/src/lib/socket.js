import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});


// Store online users { userId: socketId }
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Apply authentication middleware
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log("A user connected", socket.user.fullName);

  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // =======================
  // READ RECEIPTS
  // =======================
  socket.on("markAsRead", async ({ messageIds, groupId, senderId }) => {
    if (!messageIds?.length) return;

    await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        $addToSet: { readBy: socket.userId },
        $set: { isRead: true },
      }
    );

    // PRIVATE CHAT ✅ FIXED
    if (senderId) {
      const senderSocket = userSocketMap[senderId];
      if (senderSocket) {
        io.to(senderSocket).emit("messagesRead", {
          messageIds,
          readerId: socket.userId, // ✅ REQUIRED
        });
      }
    }

    // GROUP CHAT
    if (groupId) {
      io.to(groupId).emit("messagesRead", {
        messageIds,
        readerId: socket.userId,
      });
    }
  });

  // =======================
  // TYPING INDICATOR
  // =======================
  socket.on("typing", ({ receiverId, groupId }) => {
    if (receiverId) {
      const receiverSocket = userSocketMap[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", {
          userId: socket.userId,
          name: socket.user.fullName,
        });
      }
    }

    if (groupId) {
      socket.to(groupId).emit("typing", {
        userId: socket.userId,
        name: socket.user.fullName,
      });
    }
  });

  socket.on("stopTyping", ({ receiverId, groupId }) => {
    if (receiverId) {
      const receiverSocket = userSocketMap[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", {
          userId: socket.userId,
        });
      }
    }

    if (groupId) {
      socket.to(groupId).emit("stopTyping", {
        userId: socket.userId,
      });
    }
  });

  // =======================
  // GROUP ROOMS
  // =======================
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`${socket.user.fullName} joined group ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`${socket.user.fullName} left group ${groupId}`);
  });

  // =======================
  // DISCONNECT
  // =======================
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
