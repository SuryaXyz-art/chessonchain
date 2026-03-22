# Chess on Somnia

A real-time on-chain chess game built on Somnia Testnet (chainId 50312) that uses the Somnia Reactivity SDK to push opponent moves instantly to both players via WebSocket — no polling required.

## Live Demo
[link placeholder]

## Contract Address
ChessGame: 0xF6458BAC7fBe8bad14B2752E05c109B6D3800DEd
Network: Somnia Testnet (chainId 50312)
Explorer: https://shannon-explorer.somnia.network/address/0xF6458BAC7fBe8bad14B2752E05c109B6D3800DEd

## How Somnia Reactivity Was Used

Traditional dApps rely on polling `eth_getLogs` on a set interval to detect on-chain events. For a multiplayer game like chess, this creates a frustrating UX, introducing 2–30 second delays between an opponent making a move and the other player's board updating to reflect it.

To solve this, we integrated `@somnia-chain/reactivity` and its `sdk.subscribe()` method, which opens a direct WebSocket connection to Somnia's reactivity layer. When our `ChessGame` smart contract emits a `MoveMade` event, the Somnia SDK pushes the event data down to all active subscribers in under one second.

```typescript
const sub = await sdk.subscribe({
  origin: CHESS_GAME_ADDRESS,
  eventTopics: [keccak256(toBytes('MoveMade(uint256,address,string,string)'))],
  onData: (data) => {
    const decoded = decodeEventLog({
      abi: CHESS_GAME_ABI,
      ...data.events[0]
    });
    if (decoded.args.gameId.toString() === gameId) {
      updateBoard(decoded.args.newFEN);
    }
  }
});
```

To ensure optimal performance and avoid memory leaks, cleanup is handled automatically when the component unmounts or the game ends. Calling `sub.unsubscribe()` safely closes the WebSocket listening channel and removes the event listeners.

## Setup & Run Locally

1. `git clone [repo]`
2. `cd chess-on-somnia && npm install`
3. `cp .env.local.example .env.local` — fill `PRIVATE_KEY`
4. `npx hardhat run scripts/deploy.ts --network somniaTestnet`
5. Fill `NEXT_PUBLIC_CHESS_CONTRACT` with printed address
6. `cd frontend && npm run dev`
7. Open `http://localhost:3000`

## Judging Criteria Met

| Criterion | How we meet it |
|---|---|
| Technical Excellence | ChessGame.sol deployed on Somnia, full game loop (create/join/move/end), Reactivity SDK integrated with proper cleanup |
| Real-Time UX | Opponent moves appear in <1s via WebSocket push — zero polling |
| Somnia Integration | Deployed to chainId 50312, verified on shannon-explorer |
| Potential Impact | Can extend to tournaments, wagers, spectator mode, ELO tracking |

## Tech Stack
- Smart contracts: Solidity 0.8.24, Hardhat
- Reactivity: @somnia-chain/reactivity (sdk.subscribe)
- Frontend: Next.js 14, wagmi v2, viem, chess.js, react-chessboard
- Network: Somnia Testnet RPC https://dream-rpc.somnia.network
