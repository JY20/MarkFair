# AtomicX Backend Server

This is the backend server for the AtomicX application. It handles saving deposit data from users who interact with the Ethereum HTLC contract.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   Or for development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### POST /api/deposit
Saves a new deposit record.

Request body:
```json
{
  "userAddress": "0x123...",
  "amount": "0.1",
  "txHash": "0xabc...",
  "timestamp": "2023-08-01T12:00:00Z" // Optional, will use current time if not provided
}
```

### GET /api/deposits
Returns all deposit records.

Response:
```json
{
  "deposits": [
    {
      "userAddress": "0x123...",
      "amount": "0.1",
      "txHash": "0xabc...",
      "timestamp": "2023-08-01T12:00:00Z"
    }
  ]
}
```

## Data Storage
All deposit data is stored in a local JSON file (`deposits.json`). 