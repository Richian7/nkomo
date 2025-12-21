import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl = null;

    // ✅ Upload image if present
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      imageUrl = uploadRes.secure_url;
    }

    const message = await Message.create({
      senderId,
      groupId,
      text,
      image: imageUrl,
    });

    const populatedMessage = await message.populate(
      "senderId",
      "name profilePic"
    );

    // ✅ REAL-TIME GROUP MESSAGE
    io.to(groupId).emit("newGroupMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Failed to send group message:", err);
    res.status(500).json({ message: "Failed to send group message" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId })
      .populate("senderId", "name profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Failed to load group messages:", err);
    res.status(500).json({ message: "Failed to load group messages" });
  }
};

export const markGroupMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.sendStatus(404);

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    io.to(message.groupId.toString()).emit("groupMessageRead", {
      messageId,
      userId,
    });

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Failed to mark read" });
  }
};
