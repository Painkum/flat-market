# FLAT MARKET

Utility-driven digital collectibles marketplace on **Robinhood Chain**.

People buy collectibles for what they unlock: access, a one-time redemption, a time-limited benefit, or a capped edition. Ownership, listings, supply, transfer locks, and redemption state are enforced on-chain.

## Network

Official docs: [Connecting to Robinhood Chain](https://docs.robinhood.com/chain/connecting)

| | Testnet (development) | Mainnet |
|---|---|---|
| Chain ID | `46630` | `4663` |
| Gas token | ETH | ETH |
| Public RPC | `https://rpc.testnet.chain.robinhood.com` | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | [explorer.testnet.chain.robinhood.com](https://explorer.testnet.chain.robinhood.com) | [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com) |
| Faucet | [faucet.testnet.chain.robinhood.com](https://faucet.testnet.chain.robinhood.com) | — |

The public RPC is rate-limited. For production, use Alchemy, QuickNode, Chainstack, or another listed provider.

This repo targets **testnet** unless `NEXT_PUBLIC_CHAIN_ID=4663`.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- wagmi + viem (injected wallets, Robinhood Chain)
- Solidity, OpenZeppelin, Foundry
- Pinata for IPFS pinning when `PINATA_JWT` is set

## Contracts

- `CollectibleCollection.sol` — ERC-1155 editions, supply cap, soulbound flag, utility config
- `Marketplace.sol` — fixed-price ETH listings, 2.5% fee by default, reentrancy-safe settlement
- `RedemptionManager.sol` — one-time redemption, expiry, operator fulfillment, `verifyCollectibleAccess`

Payment is native ETH on Robinhood Chain. Offers are omitted.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Until contract addresses are set, the app shows a **labeled demo catalog**. Demo items cannot be purchased.

### Foundry

Install Foundry, then:

```bash
forge install foundry-rs/forge-std --no-git
forge build
forge test -vv
```

### Deploy to Robinhood Chain testnet

1. Fund a deployer with test ETH from the faucet.
2. Put the deployer key in `.env` as `PRIVATE_KEY` (do not commit it).
3. Run:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RH_RPC_URL --broadcast
```

4. Copy the printed addresses into `.env.local`:

```
NEXT_PUBLIC_COLLECTION_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_REDEMPTION_ADDRESS=0x...
```

5. Restart the Next.js app.

Verify on [the testnet explorer](https://explorer.testnet.chain.robinhood.com).

```bash
forge verify-contract <address> contracts/CollectibleCollection.sol:CollectibleCollection \
  --chain-id 46630 \
  --rpc-url $RH_RPC_URL \
  --verifier blockscout \
  --verifier-url https://explorer.testnet.chain.robinhood.com/api/
```

## IPFS

Creator uploads go through `POST /api/upload`. Without `PINATA_JWT`, minting still works but metadata URIs may be local preview values and will not persist. Set a Pinata JWT for production-quality pinning.

## Access verification

External apps can query:

```
GET /api/verify-access?wallet=0x...&tokenId=1
```

or call `RedemptionManager.verifyCollectibleAccess(wallet, tokenId)` on-chain.

The result includes eligibility, ownership, expiry, redemption counts, and utility type. It does not prove that an off-chain benefit was delivered.

## Demo script

1. Deploy contracts and set env addresses.
2. Connect wallet A on Robinhood Chain testnet.
3. `/create` — make a collection, then a REDEEMABLE edition with supply 2, mint 2, list 1.
4. Connect wallet B. Buy the listing on the collectible page. Wait for the receipt. Open the explorer link.
5. Wallet B opens `/collection` and sees the edition.
6. Wallet B redeems. Status updates after confirmation.
7. Wallet B redeems again — the contract reverts (`InsufficientUnredeemed`).

## Completed

- Robinhood Chain testnet/mainnet config from official docs
- Collection, marketplace, and redemption contracts
- Foundry tests for supply, listings, fees, and redemption edge cases
- Deploy script
- Discover, marketplace, collectible, collection, creator, my collection, my listings
- Wallet connect, wrong-network banner, buy / list / cancel / transfer / redeem flows
- Access verification API
- Pinata upload adapter
- Labeled demo catalog for local browsing
- Dynamic front end: animated hero with rotating spotlight and live stats, listing ticker, scroll reveals
- Ctrl/⌘K search palette across collectibles, categories, and pages
- Marketplace filters synced to the URL (shareable), category counts, price range, grid/list view
- Watchlist (saved per browser) with header counter and `/watchlist` page
- Collectible pages with supply bars, live expiry countdowns, image zoom, share, and related items
- Creator studio with step tabs, drag-and-drop uploads, and a live preview card

## Incomplete / external

- Testnet deployment itself (needs your funded `PRIVATE_KEY`)
- IPFS pinning (needs `PINATA_JWT`)
- Offers
- Production RPC (public endpoint is rate-limited)
- Subgraph/indexer (frontend reads contracts directly, capped for MVP)

## Scripts

```bash
npm run dev
npm run build
npm run lint
forge test
```
