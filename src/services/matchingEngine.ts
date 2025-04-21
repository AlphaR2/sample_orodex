import {
  Order,
  ProcessedOrder,
  OrderBook,
  Trade,
  OrderSide,
} from "../types/type";
import {
  processRawOrders,
  addOrder,
  removeOrder,
  findOrderById,
} from "./orderBookService";

// we want each completed trade to have an id so we use this to generate one.
import { v4 as uuidv4 } from "uuid";

export function matchOrder(
  order: ProcessedOrder,
  orderBook: OrderBook
): {
  remainingOrder: ProcessedOrder | null;
  trades: Trade[];
  updatedOrderBook: OrderBook;
} {
  // get a current order and the orderbook
  let currentOrder = { ...order };
  let currentOrderBook = {
    ...orderBook,
    bids: [...orderBook.bids],
    asks: [...orderBook.asks],
  };

  const trades: Trade[] = [];
  // Determine which side of the book to check against
  const oppositeSide = currentOrder.side === OrderSide.BUY ? "asks" : "bids";

  if (currentOrderBook[oppositeSide].length === 0) {
    // if the oppositeSide are empty, add the one we have to the orderbook
    currentOrderBook = addOrder(currentOrder, currentOrderBook);

    return { remainingOrder: null, trades, updatedOrderBook: currentOrderBook };
  }

  // get the priceLevels of the opposite sides of the book

  const priceLevels = [...currentOrderBook[oppositeSide]];

  for (const priceLevel of priceLevels) {
    if (currentOrder.amount <= 0) break;

    // matching based on sides
    const canMatch =
      (currentOrder.side === OrderSide.BUY &&
        currentOrder.limitPrice >= priceLevel.price) ||
      (currentOrder.side === OrderSide.SELL &&
        currentOrder.limitPrice <= priceLevel.price);

    if (!canMatch) continue;
    // get the order of the opposite side to here to help us access the amounts etc to match sides
    const orders = [...priceLevel.orders];

    // do some more matching logic
    for (const matchingOrder of orders) {
      //check if it is from the same account.is (same user)
      if (matchingOrder.accountId === currentOrder.accountId) continue;
      // get the matched amount and return the minimum amount that can be executed / traded betwwen both parties. we pass the current order and its opposite matching order
      const matchedAmount = Math.min(currentOrder.amount, matchingOrder.amount);
      // if the min tradable amount is more than zero i.e a trade can occur.
      if (matchedAmount > 0) {
        const trade: Trade = {
          tradeId: uuidv4(),
          buyOrderId:
            currentOrder.side === OrderSide.BUY
              ? currentOrder.orderId
              : matchingOrder.orderId,
          sellOrderId:
            currentOrder.side === OrderSide.SELL
              ? currentOrder.orderId
              : matchingOrder.orderId,
          buyerAccountId:
            currentOrder.side === OrderSide.BUY
              ? currentOrder.accountId
              : matchingOrder.accountId,
          sellerAccountId:
            currentOrder.side === OrderSide.SELL
              ? currentOrder.accountId
              : matchingOrder.accountId,
          price: priceLevel.price,
          amount: matchedAmount,
        };

        trades.push(trade);

        // update matched orders with the actually matched amount in orderbook
        const updatedMatchingOrder = {
          ...matchingOrder,
          amount: matchingOrder.amount - matchedAmount,
        };

        // if we do not  have a remainder of amount to be matched from a trade, then we assume that trade to be completed and remove from other book

        if (updatedMatchingOrder.amount <= 0) {
          currentOrderBook = removeOrder(
            matchingOrder.orderId,
            currentOrderBook
          );
        } else {
          // if there is some remainder of money that needs to be matched from an order, fimmd the order position ans update the  final value to be matched
          const orderIndex = priceLevel.orders.findIndex(
            (order) => order.orderId === matchingOrder.orderId
          );

          if (orderIndex !== -1) {
            priceLevel.orders[orderIndex] = updatedMatchingOrder;
          }
        }

        currentOrder.amount -= matchedAmount;

        // If the current order is fully matched, we're done
        if (currentOrder.amount <= 0) break;
      }
    }
  }

  // If the current order is not fully matched, add the remainder to the order book

  if (currentOrder.amount > 0) {
    currentOrderBook = addOrder(currentOrder, currentOrderBook);

    return {
      remainingOrder: currentOrder,
      trades,
      updatedOrderBook: currentOrderBook,
    };
  }

  // if order was fully matched
  return {
    remainingOrder: null,
    trades,
    updatedOrderBook: currentOrderBook,
  };
}

// this is the function where everything is happening. 

export function processOrders(orders: Order[]): {
  orderBook: OrderBook;
  trades: Trade[];
} {
  // init a empty order book
  let orderBook: OrderBook = {
    bids: [],
    asks: [],
  };

  const allTrades: Trade[] = [];

  for (const order of orders) {
    // first, we process the raw order from json to proper types
    const processedOrder = processRawOrders(order);

    if (processedOrder.type === "DELETE") {
      // Handle delete operation
      orderBook = removeOrder(processedOrder.orderId, orderBook);
      continue;
    }

    // Match or add the order
    const { trades, updatedOrderBook } = matchOrder(processedOrder, orderBook);

    // Update the order book
    orderBook = updatedOrderBook;

    // Add new trades to the collection
    allTrades.push(...trades);
  }

  return {
    orderBook,
    trades: allTrades,
  };
}
