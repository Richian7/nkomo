import express from "express";
import { createGroup, getGroups } from "../controllers/groupController.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupMessageController.js";
import upload from "../middleware/upload.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",protectRoute, upload.single("avatar"), createGroup);
router.get("/", getGroups);

// ✅ New routes for messages
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);

export default router;
