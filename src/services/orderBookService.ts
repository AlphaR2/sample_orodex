import {
  OrderBook,
  Order,
  OperationType,
  ProcessedOrder,
  OrderSide,
} from "../types/type";

//init an empty order book
export function initOrderBook(): OrderBook {
  return {
    bids: [],
    asks: [],
  };
}

//init processed order i.e convert strings to numbers
export function processRawOrders(order: Order): ProcessedOrder {
  return {
    type: order.type_op,
    accountId: order.account_id,
    amount: parseFloat(order.amount),
    orderId: order.order_id,
    pair: order.pair,
    limitPrice: parseFloat(order.limit_price),
    side: order.side,
  };
}
// pass in the processed Orders and the empty initialzed orderbook
export function addOrder(order: ProcessedOrder, orderBook: OrderBook) {
  ///remove orders with type of DELETE
  if (order.type === OperationType.DELETE) {
    return removeOrder(order.orderId, orderBook);
  }

  // let us sort by bids or asks. first decide on what side an order should be on
  const side = order.side === OrderSide.BUY ? "bids" : "asks";

  // Check if there's already a price level for this price
  const priceLevel = orderBook[side].find(
    (level) => level.price === order.limitPrice
  );

  if (priceLevel) {
    //if the price level exists, group the orders of same level
    priceLevel.orders.push({
      orderId: order.orderId,
      accountId: order.accountId,
      amount: order.amount,
    });
  } else {
    //if not create a new one
    orderBook[side].push({
      price: order.limitPrice,
      orders: [
        {
          orderId: order.orderId,
          accountId: order.accountId,
          amount: order.amount,
        },
      ],
    });
  }
  // here let us arrange the prices : bid (buys) from highest(in price) to lowest(in price) ===> This is because buyers with higher bids get priority in matching, asks(sells) from lowest (in price) to highest (in price) =====> This is because sellers with lower asks get priority in matching
  orderBook[side].sort((a, b) =>
    side === "bids" ? b.price - a.price : a.price - b.price
  );

  return orderBook;
}

// Remove an order from the order book
export function removeOrder(orderId: string, orderBook: OrderBook): OrderBook {
  // Create a copy of the order book
  const updatedOrderBook: OrderBook = {
    bids: [...orderBook.bids],
    asks: [...orderBook.asks],
  };

  // Check both sides of the book
  const sides: Array<keyof OrderBook> = ["bids", "asks"];

  for (const side of sides) {
    // For each price level
    for (let i = 0; i < updatedOrderBook[side].length; i++) {
      const priceLevel = updatedOrderBook[side][i];

      // Find the order
      const orderIndex = priceLevel.orders.findIndex(
        (o) => o.orderId === orderId
      );

      if (orderIndex !== -1) {
        // Remove the order
        priceLevel.orders.splice(orderIndex, 1);

        // If price level is now empty, remove it
        if (priceLevel.orders.length === 0) {
          updatedOrderBook[side].splice(i, 1);
        }

        // Order found and removed, return immediately
        return updatedOrderBook;
      }
    }
  }

  return updatedOrderBook;
}

export function findOrderById(
  orderId: string,
  orderBook: OrderBook
): {
  //replicate a copy of the orderbook
  order: { orderId: string; accountId: string; amount: number } | null;
  side: "bids" | "asks" | null;
  priceLevel: number | null;
} {
  for (const side of ["bids", "asks"] as const) {
    for (const priceLevel of orderBook[side]) {
      const order = priceLevel.orders.find((o) => o.orderId === orderId);
      if (order) {
        return { order, side, priceLevel: priceLevel.price };
      }
    }
  }

  return { order: null, side: null, priceLevel: null };
}

// Get a formatted version of the order book for output
export function getFormattedOrderBook(orderBook: OrderBook): OrderBook {
  return {
    bids: [...orderBook.bids],
    asks: [...orderBook.asks],
  };
}
