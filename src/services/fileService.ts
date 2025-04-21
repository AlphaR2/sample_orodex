import path from "path";
import fs from "fs/promises";
import { Order, OrderBook, TradeCollection } from "../types/type";

export async function readOrdersFromFile(filePath: string): Promise<Order[]> {
  try {
    const fullPath = path.resolve(filePath);
    const orderData = await fs.readFile(fullPath, "utf8");

    const orders: Order[] = JSON.parse(orderData);

    return orders;
  } catch (error) {
    console.error("Error Reading From File:", error);
    throw error;
  }
}

// Write orderbook to file
export async function writeOrderBookToFile(
  orderBook: OrderBook,
  filePath: string
): Promise<void> {
  try {
    const fullPath = path.resolve(filePath);
    const dirPath = path.dirname(fullPath);

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, JSON.stringify(orderBook, null, 2));

    console.log(`OrderBook successfully written to ${filePath}`);
  } catch (error) {
    console.error("Error Writing OrderBook To File:", error);
    throw error;
  }
}

// Write trades to file
export async function writeTradesToFile(
  trades: TradeCollection,
  filePath: string
): Promise<void> {
  try {
    const fullPath = path.resolve(filePath);
    const dirPath = path.dirname(fullPath);

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, JSON.stringify(trades, null, 2));

    console.log(`Trades successfully written to ${filePath}`);
  } catch (error) {
    console.error("Error Writing Trades To File:", error);
    throw error;
  }
}
