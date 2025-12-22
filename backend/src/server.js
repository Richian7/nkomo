import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/groupRoutes.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nkomo-chat.onrender.com",
    ],
    credentials: true,
  })
);


app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

/* ===================== PRODUCTION ===================== */
if (ENV.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../frontend/build");

  app.use(express.static(frontendPath));

  app.get("*", (_, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}
/* ====================================================== */

server.listen(PORT, () => {
  console.log("Server running on port:", PORT);
  connectDB();
});
