# Stream + Auction Refactor Spec

## 1) Goal
- Separate Auction lifecycle from Live Stream lifecycle.
- Subject stream can host multiple auctions in a single broadcast session.
- Host can create/select auctions during live session.
- Bid logic should apply to current active auction.

## 2) Model
### Stream
- `id`
- `status`: `LIVE`, `PAUSED`, `ENDED`
- `activeAuctionId` (nullable)
- `auctionIds` (array)

### Auction
- `id`
- `streamId`
- `title`
- `description`
- `productId` or `productIds`
- `startingBid`
- `bidIncrement`
- `startTime`, `endTime`
- `status`: `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- `currentBid`, `highestBidder`
- `history` (optional)

## 3) API
- `GET /stream/:streamId`
- `POST /stream/:streamId/start`
- `POST /stream/:streamId/end`
- `PATCH /stream/:streamId/active-auction` { auctionId }
- `GET /stream/:streamId/auctions`
- `POST /stream/:streamId/auctions`
- `POST /auction/:auctionId/start`
- `POST /auction/:auctionId/end`
- `POST /auction/:auctionId/bid`

## 4) Frontend: CreatorStreamScreen.jsx
### State
- `auctions`
- `activeAuction`
- `auctionForm` (title, productId, startingBid, increment, duration)
- `showAuctionModal`

### Functions
- `fetchAuctions(streamId)`
- `createAuction(form)`
- `selectActiveAuction(auctionId)`
- `startAuction(auctionId)`
- `endAuction(auctionId)`

### UI
- Host panel: "Auction Hub" button
- List of auctions (pending/active/completed)
- Modal form for creating a new auction
  - includes product selection (from `streamInfo.productId` list)
  - fallback to manual `productId` input when no product list is available
- Active auction display + bid controls

## 5) Flow
1. Fetch stream + auctions on mount
2. Host creates auction via modal
3. Host activates auction, sets active:
   - set api `/active-auction`
   - broadcast via socket event
4. Bid button uses `activeAuction.currentBid`
5. End auction updates deployment with winner
6. Keep final stream `end` separate from auction ending

## 6) Socket events
- `auctionCreated`
- `auctionUpdated`
- `activeAuctionChanged`
- `auctionBid`
- `auctionEnded`
- `streamEnded`

## 7) Optional rollbacks
- Single-auction-mode fallback if no auction model available
- `streamInfo.currentBid` as legacy
- keep compatibility with old API

## 8) Timeline and Cost Estimate
### Timeline (for 1 sprint, 2 weeks)
- Day 1-2: Requirements validation + data model + endpoint design
- Day 3-4: Backend implementation (auction model + stream active auction fields)
- Day 5-6: Frontend state + API hooks + auction list + selection UI
- Day 7-8: Create auction modal + validation + API calls
- Day 9: Bid path update (active auction) + socket events update
- Day 10: Stream/auction end flows + host permissions
- Day 11-12: QA + edge cases + fallback behavior
- Day 13-14: polish UX and deploy environment tests

### Cost (approximation)
- Design/analysis: 4 hours
- Backend: 16 hours
- Frontend: 20 hours
- QA & regression test: 8 hours
- Buffer/contingency: 6 hours
- Total: 54 hours

### Effort categories
- Low complexity: data structure + boolean state updates
- Medium complexity: multi-auction socket sync + active-auction transitions
- High complexity: cross-stream consistency + legacy compatibility

