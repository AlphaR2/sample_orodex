import path from "path";
import fs from "fs/promises";
import { processOrders } from "../services/matchingEngine";
import {
  readOrdersFromFile,
  writeOrderBookToFile,
  writeTradesToFile,
} from "../services/fileService";
import {
  Order,
  OrderBook,
  Trade,
  OperationType,
  OrderSide,
} from "../types/type";

describe("Trading Engine End-to-End Test", () => {
  const dataDir = path.join(__dirname, "../../data");
  const outputDir = path.join(__dirname, "../../output");

  // Test the full process with orders.json
  it("should process orders.json and generate correct output files", async () => {
    // 1. Read orders from the actual orders.json file
    const orders = await readOrdersFromFile(path.join(dataDir, "orders.json"));

    // 2. Process all orders
    const { orderBook, trades } = processOrders(orders);

    // 3. Write output files
    await fs.mkdir(outputDir, { recursive: true });
    await writeOrderBookToFile(
      orderBook,
      path.join(outputDir, "orderbook.json")
    );
    await writeTradesToFile({ trades }, path.join(outputDir, "trades.json"));

    // 4. Verify trades were created
    expect(trades.length).toBeGreaterThan(0);

    // 5. Verify output files exist
    const orderBookExists = await fileExists(
      path.join(outputDir, "orderbook.json")
    );
    const tradesExists = await fileExists(path.join(outputDir, "trades.json"));

    expect(orderBookExists).toBe(true);
    expect(tradesExists).toBe(true);

    // 6. Verify file contents are valid JSON
    const orderBookContent = await fs.readFile(
      path.join(outputDir, "orderbook.json"),
      "utf8"
    );
    const tradesContent = await fs.readFile(
      path.join(outputDir, "trades.json"),
      "utf8"
    );

    const parsedOrderBook = JSON.parse(orderBookContent);
    const parsedTrades = JSON.parse(tradesContent);

    expect(parsedOrderBook).toHaveProperty("bids");
    expect(parsedOrderBook).toHaveProperty("asks");
    expect(parsedTrades).toHaveProperty("trades");
  });

  // Test a simple specific scenario
  it("should correctly match a simple buy and sell order fully", () => {
    const testOrders: Order[] = [
      {
        type_op: OperationType.CREATE,
        account_id: "1",
        amount: "0.5",
        order_id: "1",
        pair: "BTC/USDC",
        limit_price: "50000.00",
        side: OrderSide.SELL,
      },
      {
        type_op: OperationType.CREATE,
        account_id: "2",
        amount: "0.5",
        order_id: "2",
        pair: "BTC/USDC",
        limit_price: "50000.00",
        side: OrderSide.BUY,
      },
    ];

    const { orderBook, trades } = processOrders(testOrders);

    // Should create one trade
    expect(trades.length).toBe(1);

    // Should match the full amount
    expect(trades[0].amount).toBe(0.5);

    // Order book should be empty since orders fully matched
    expect(orderBook.bids.length).toBe(0);
    expect(orderBook.asks.length).toBe(0);
  });
});

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
