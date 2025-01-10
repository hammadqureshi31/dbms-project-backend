import express from "express";
import { handleGetAllLogs } from "../controllers/logControllers.js";

const router = express.Router();


router.get('/all', handleGetAllLogs);

export default router;