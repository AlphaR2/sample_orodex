export enum OperationType {
  CREATE = "CREATE",
  DELETE = "DELETE",
}

export enum OrderSide {
  SELL = "SELL",
  BUY = "BUY",
}

export interface Order {
  type_op: OperationType;
  account_id: string;
  amount: string;
  order_id: string;
  pair: string;
  limit_price: string;
  side: OrderSide;
}

// Processed order
export interface ProcessedOrder {
  type: OperationType;
  accountId: string;
  amount: number;
  orderId: string;
  pair: string;
  limitPrice: number;
  side: OrderSide;
}

//trade record
export interface Trade {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  price: number;
  amount: number;
}

// Collection of trades
export interface TradeCollection {
  trades: Trade[];
}

// Order book structure and can use to group trades into price levels
export interface OrderBook {
  bids: {
    price: number;
    orders: Array<{
      orderId: string;
      accountId: string;
      amount: number;
    }>;
  }[];
  asks: {
    price: number;
    orders: Array<{
      orderId: string;
      accountId: string;
      amount: number;
    }>;
  }[];
}
