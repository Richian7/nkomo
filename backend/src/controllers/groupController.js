import Group from "../models/groupModel.js";
import cloudinary from "../config/cloudinary.js";
import Message from "../models/Message.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members) {
      return res.status(400).json({ message: "Name and members are required" });
    }

    const parsedMembers = JSON.parse(members);
    if (!parsedMembers.length) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    let avatarUrl = null;

    if (req.file?.buffer) {
      avatarUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "groups" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const group = await Group.create({
      name,
      members: parsedMembers,
      avatar: avatarUrl,
      createdBy: req.user._id,
    });

    res.status(201).json(group);
  } catch (err) {
    console.error("Failed to create group:", err);
    res.status(500).json({ message: "Failed to create group", error: err.message });
  }
};


export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("members", "name profilePic");
    res.status(200).json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch groups" });
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



export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      senderId,
      groupId,
      text,
      image,
    });

    const populatedMessage = await message.populate("senderId", "name profilePic");
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Failed to send group message:", err);
    res.status(500).json({ message: "Failed to send group message" });
  }
};