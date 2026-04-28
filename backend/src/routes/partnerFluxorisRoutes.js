import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  exchangeFluxorisToken,
  listFluxorisEvents,
  receiveFluxorisEvent,
} from "../controllers/partnerFluxorisController.js";

const router = Router();

router.post("/events", receiveFluxorisEvent);
router.get("/events", verifyToken, listFluxorisEvents);
router.post("/exchange-token", verifyToken, exchangeFluxorisToken);

export default router;
