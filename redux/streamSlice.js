import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentStream: null,
  activeStreams: [],
  streamToken: null,
  comments: [],
  currentBid: 0,
  timerSelectionModal: false,
  timeLeft: '',
  endTime: 100,
  showBidNotification: false,
  bidNotificationData: null,
  biddingWinner: false,
  winnerDetails: null,
  endingStream: false,
  auctionDetails: null,
  highestBidder: null,
  showInitiateAuctionModal: false,
  showAuctionEndPrompt: false,
  showAuctionStartNotice: false,
  selectedProductForAuction: null,
  auctionFormData: {
    startingBid: '',
    duration: '10',
    suddenDeathEnabled: false,
  },
  status: 'idle',
  error: null,
};

const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    setCurrentStream: (state, action) => {
      state.currentStream = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    updateCurrentStream: (state, action) => {
      if (state.currentStream) {
        state.currentStream = { ...state.currentStream, ...action.payload };
      }
    },
    clearCurrentStream: (state) => {
      state.currentStream = null;
      state.streamToken = null;
      state.status = 'idle';
      state.error = null;
    },
    setComments: (state, action) => {
      state.comments = action.payload;
    },
    setCurrentBid: (state, action) => {
      state.currentBid = action.payload;
    },
    setTimerSelectionModal: (state, action) => {
      state.timerSelectionModal = action.payload;
    },
    setTimeLeft: (state, action) => {
      state.timeLeft = action.payload;
    },
    setEndTime: (state, action) => {
      state.endTime = action.payload;
    },
    setShowBidNotification: (state, action) => {
      state.showBidNotification = action.payload;
    },
    setBidNotificationData: (state, action) => {
      state.bidNotificationData = action.payload;
    },
    setBiddingWinner: (state, action) => {
      state.biddingWinner = action.payload;
    },
    setWinnerDetails: (state, action) => {
      state.winnerDetails = action.payload;
    },
    setEndingStream: (state, action) => {
      state.endingStream = action.payload;
    },
    setAuctionDetails: (state, action) => {
      state.auctionDetails = action.payload;
    },
    setHighestBidder: (state, action) => {
      state.highestBidder = action.payload;
    },
    setShowInitiateAuctionModal: (state, action) => {
      state.showInitiateAuctionModal = action.payload;
    },
    setShowAuctionEndPrompt: (state, action) => {
      state.showAuctionEndPrompt = action.payload;
    },
    setShowAuctionStartNotice: (state, action) => {
      state.showAuctionStartNotice = action.payload;
    },
    setSelectedProductForAuction: (state, action) => {
      state.selectedProductForAuction = action.payload;
    },
    setAuctionFormData: (state, action) => {
      state.auctionFormData = action.payload;
    },
    setActiveStreams: (state, action) => {
      state.activeStreams = action.payload;
    },
    addActiveStream: (state, action) => {
      state.activeStreams.push(action.payload);
    },
    removeActiveStream: (state, action) => {
      state.activeStreams = state.activeStreams.filter(stream => stream._id !== action.payload);
    },
    setStreamToken: (state, action) => {
      state.streamToken = action.payload;
      state.error = null;
    },
    setStreamStatus: (state, action) => {
      state.status = action.payload;
    },
    setStreamError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
});

export const {
  setCurrentStream,
  updateCurrentStream,
  clearCurrentStream,
  setActiveStreams,
  addActiveStream,
  removeActiveStream,
  setStreamToken,
  setStreamStatus,
  setStreamError,
} = streamSlice.actions;
export default streamSlice.reducer;
