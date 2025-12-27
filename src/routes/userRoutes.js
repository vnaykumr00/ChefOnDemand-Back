import express from "express";

import {verifySupabaseToken} from "../middleware/auth.middleware.js";
import {
  login,
  register,
  me,
  status,
  nearbyChefs,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("User route is working!");
});
router.post("/login", verifySupabaseToken, login);
router.post("/register", verifySupabaseToken, register);
router.get("/me", verifySupabaseToken, me);
router.get("/status", verifySupabaseToken, status);
router.get("/nearbyChefs", verifySupabaseToken, nearbyChefs);

export default router;
