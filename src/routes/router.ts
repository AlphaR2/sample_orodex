import { Router } from "express";

import {
  getOrderBook,
  getTradeBook,
  createOrder,
  processOrderFile,
} from "../controllers/orderController";

const router = Router();

// Route to get the current order book
router.get("/orderbook", getOrderBook);

// Route to get all trades
router.get("/trades", getTradeBook);

// Route to create a new order
router.post("/orders", createOrder);

// Route to process orders from a file
router.post("/process-orders", processOrderFile);

export default router;
