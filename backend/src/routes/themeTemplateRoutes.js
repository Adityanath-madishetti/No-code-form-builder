import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createTheme,
  listThemes,
  updateTheme,
  deleteTheme,
} from "../controllers/themeTemplateController.js";

const router = Router();

router.post("/", verifyToken, createTheme);
router.get("/", verifyToken, listThemes);
router.patch("/:themeId", verifyToken, updateTheme);
router.delete("/:themeId", verifyToken, deleteTheme);

export default router;
