# Orordex_Sample Trading Engine

A implementationof a trading engine that processes buy and sell orders, matches them according to price-time priority, and generates an orderbook and trade records (json files generated at output directory).

## Features

- Processes orders from a JSON file (data/orders.json)
- Matches buy and sell orders based on price-time priority (price and order_id)
- Maintains an order book with sorted price levels
- Generates orderbook.json and trades.json output files
- Prevents self-trading (matching orders from the same account)
- Handles partial fills and order cancellations
- REST API for interacting with the trading engine (web client impl using next is provided by author too)

## Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Testing**: Jest

## Project Structure

```
trading-engine/
├── src/
│   ├── controllers/       # API controllers
│   ├── routes/            # API route definitions
│   ├── services/          # Core business logic
│   │   ├── fileService.ts       # File I/O operations
│   │   ├── orderBookService.ts  # Order book management
│   │   └── matchingEngine.ts    # Matching algorithm
│   ├── types/             # TypeScript type definitions
│   ├── tests/             # Test files
│   └── server.ts          # Express server setup
├── data/
│   └── orders.json        # Input orders file
├── output/                # Generated output files
│   ├── orderbook.json     # Final order book state
│   └── trades.json        # Executed trades
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Typescript
- Jest

### Installation

1. Clone the repository

   ```
   git clone  https://github.com/AlphaR2/sample_orodex.git
   cd sample_orodex
   ```

2. Install dependencies

   ```
   npm install
   ```

### Running the Application

1. Start the backend server

   ```
   npm run dev
   ```

### Running Tests

Run the tests with:

```
npm test
```

(test is run with jest, make sure you did npm installed and ts-jest, @types/jest is installed)

- View the order book

A new folder "output" will be created with two json files in it: trades.json and orderbook.json

## API Endpoints

- `GET /api/orderbook` - Get the current state of the order book
- `GET /api/trades` - Get all executed trades
- `POST /api/orders` - Submit a new order (custom - accepts a new trade, appends to the orderbook and executes if there is a matching trade)
- `POST /api/process-file` - Process orders from the orders.json file (custom - can process trades from a given json with orders in it)

## How It Works

1. The trading engine reads orders from a JSON file
2. Each order is processed sequentially:
   - CREATE orders are matched against existing orders in the book
   - Matching orders create trades
   - Remaining quantities are added to the order book
   - DELETE operations remove orders from the book
3. The final state of the order book and all trades are written to output files

## Order Matching Algorithm

The engine implements a price-time priority matching algorithm:

- Buy orders match with the lowest priced sell orders first
- Sell orders match with the highest priced buy orders first
- At the same price level, orders are processed in first-come-first-served order (first priority on the order-id which is used to determine which trade came in first)
- Matches occur when a buy price ≥ sell price
- Trades execute at the price of the resting order
