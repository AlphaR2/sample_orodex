import { Request, Response } from "express";
import { matchOrder, processOrders } from "../services/matchingEngine";
import {
  readOrdersFromFile,
  writeOrderBookToFile,
  writeTradesToFile,
} from "../services/fileService";
import { Order, OrderBook, ProcessedOrder, Trade } from "../types/type";
import { processRawOrders } from "../services/orderBookService";
import path from "path";

let currentOrderBook: OrderBook = { bids: [], asks: [] };
let allTrades: Trade[] = [];
let isInitialized = false;


const initFromFile = async () => {
  try {
    const filePath = path.join(__dirname, "../../data/orders.json");
    const orders = await readOrdersFromFile(filePath);
    const results = processOrders(orders);
    currentOrderBook = results.orderBook;
    allTrades = results.trades;
    isInitialized = true;

    const outputDir = path.join(__dirname, "../../output");
    await writeOrderBookToFile(
      currentOrderBook,
      path.join(outputDir, "orderbook.json")
    );
    await writeTradesToFile(
      { trades: allTrades },
      path.join(outputDir, "trades.json")
    );
    return { success: true };
  } catch (error) {
    console.error("Initialization error:", error);
    return { success: false, error };
  }
};

export const getOrderBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isInitialized) {
      const initResult = await initFromFile();
      if (!initResult.success) {
        res.status(500).json({ error: "Failed to initialize order book" });
        return;
      }
    }
    res.status(200).json(currentOrderBook);
  } catch (error) {
    console.error("Error fetching order book:", error);
    res.status(500).json({ error: "Failed to fetch order book" });
  }
};

export const getTradeBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isInitialized) {
      const initResult = await initFromFile();
      if (!initResult.success) {
        res.status(500).json({ error: "Failed to initialize" });
        return;
      }
    }
    res.status(200).json({ trades: allTrades });
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isInitialized) {
      const initResult = await initFromFile();
      if (!initResult.success) {
        res.status(500).json({ error: "Failed to initialize" });
        return;
      }
    }
    const orderData: Order = req.body;
    if (
      !orderData.type_op ||
      !orderData.account_id ||
      !orderData.amount ||
      !orderData.pair ||
      !orderData.limit_price ||
      !orderData.side
    ) {
      res.status(400).json({ error: "Invalid order data" });
      return;
    }
    const processedOrder = processRawOrders(orderData);
    const { trades, updatedOrderBook } = matchOrder(
      processedOrder,
      currentOrderBook
    );
    currentOrderBook = updatedOrderBook;
    allTrades = [...allTrades, ...trades];
    res
      .status(201)
      .json({ success: true, trades, orderBook: currentOrderBook });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ error: "Failed to process order" });
  }
};

export const processOrderFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await initFromFile();
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Orders processed successfully",
        orderBookPath: "output/orderbook.json",
        tradesPath: "output/trades.json",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to process orders file",
      });
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Failed to process orders file" });
  }
};
