import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet, TouchableOpacity, Text, Animated, Modal, FlatList, Image, Keyboard, ToastAndroid, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Dimensions } from "react-native";
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, AudienceLatencyLevelType, RtcSurfaceView, } from "react-native-agora";
import config from "../config";
import Entypo from 'react-native-vector-icons/Entypo';
import getPermission from "../components/Permission";
import { useNavigation } from "@react-navigation/core";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Octicons from 'react-native-vector-icons/Octicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import useLiveStreamSocket from "../hooks/socketRef";
import giftImg from '../assets/gift.png'
import dollarImg from '../assets/dollar.png'
import TimerModal from "../components/TimerModal";
import io from "socket.io-client";
import UserInvitationModal from "../components/UserInviteModal";
import { getAllGifts, getAllUsers, getProfileInfo } from "../hooks/getProfile";

const appId = config.appId;
const localUid = 0;
const { width, height } = Dimensions.get("window");

const CreatorStreamScreen = ({ route }) => {
    const { streamId, isHost, coHost = false } = route.params;
    const socketRef = useRef(null);
    const agoraEngineRef = useRef(null);
    const eventHandler = useRef(null);
    const navigation = useNavigation();
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUids, setRemoteUids] = useState([]);
    const [agoraUid, setagoraUid] = useState(null)
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [data, setData] = useState({});
    const [streamInfo, setStreamInfo] = useState(null)
    const [isStreamLive, setIsStreamLive] = useState(false);
    const [biddings, setBiddings] = useState([])
    const [fadeAnim] = useState(new Animated.Value(0));
    const [gift, setGift] = useState(null);
    const [bidInfo] = useState(false);
    const [showUserInvitation, setShowUserInvitation] = useState(false)
    const [allUsers, setAllUsers] = useState({});
    const [giftsData, setGiftsData] = useState([]);
    const [viewerCount, setViewerCount] = useState(0);
    const [token, setToken] = useState("")
    const [channelName] = useState(streamId)

    const [showProductCards, setShowProductCards] = useState(true);

    const [suddenDeathEnabled, setSuddenDeathEnabled] = useState(false);
    const [suddenDeathThreshold, setSuddenDeathThreshold] = useState(10); // seconds
    const [suddenDeathExtension, setSuddenDeathExtension] = useState(10);
    const dispatch = useDispatch();
    const [amount, setAmount] = useState(0);
    const [bidAmount, setBidAmount] = useState('');
    const [uId, setuId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [showShirts, setshowShirts] = useState(false)
    const [showGifts, setshowGifts] = useState(false)
    const [wallet, setwallet] = useState(false)
    const [showBid, setshowBid] = useState(false);
    const [Host, setHost] = useState(isHost || false);

    const [showMessages, setshowMessages] = useState(true);

    // CHAT 
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [heart, setHeart] = useState(false);
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState("");
    const [currentBid, setCurrentBid] = useState(0);
    const [timerSelectionModal, setTimerSelectionModal] = useState(false)
    const [timeLeft, setTimeLeft] = useState("");
    const [endTime, setEndTime] = useState('100');
    const [showBidNotifcation, setShowBidNotifcation] = useState(false);
    const [bidNotifcationData, setBidNotifcationData] = useState(null);
    const [biddingWinner, setBiddingWinner] = useState(false);
    const [winnerDetails, setWinnerDetails] = useState(null);
    const [endingStream, setEndingStream] = useState(false);
    const [auctionDetails, setAuctionDetails] = useState(null);
    const [showInitiateAuctionModal, setShowInitiateAuctionModal] = useState(false);
    const [showAuctionEndPrompt, setShowAuctionEndPrompt] = useState(false);
    const [showAuctionStartNotice, setShowAuctionStartNotice] = useState(false);
    const [selectedProductForAuction, setSelectedProductForAuction] = useState(null);
    const [auctionFormData, setAuctionFormData] = useState({
        startingBid: '',
        duration: '10',
        suddenDeathEnabled: false
    });
    useLiveStreamSocket(streamId, setComments);
    const setupVideoSDKEngine = async () => {
        if (Platform.OS === "android") {
            await getPermission();
        }

        const engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;
        engine.initialize({ appId });
        console.log(Host, 'host status')
        if (Host || isHost) {
            engine.enableVideo();
            engine.startPreview();
        }
    };

    const setupEventHandler = () => {
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                setIsJoined(true);
                if (Host) {
                    setViewerCount(1);
                }
            },
            onUserJoined: (_connection, uid) => {
                setagoraUid(uid);
                setViewerCount(prev => prev + 1);
                setTimeout(() => {
                    setRemoteUids(prev => [...new Set([...prev, uid])]);
                }, 1000);
            },
            onUserOffline: (_connection, uid) => {
                setagoraUid(null)
                setRemoteUids(prev => prev.filter(id => id !== uid));
                setViewerCount(prev => Math.max(prev - 1, 0));
            },
        };
        agoraEngineRef.current?.registerEventHandler(eventHandler.current);
    };
    const join = async (tk) => {
        if (!agoraEngineRef.current) return;

        await agoraEngineRef.current.joinChannel(tk, channelName, localUid, {
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            clientRoleType: Host
                ? ClientRoleType.ClientRoleBroadcaster
                : ClientRoleType.ClientRoleAudience,
            publishMicrophoneTrack: Host,
            publishCameraTrack: Host,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
            audienceLatencyLevel: Host
                ? undefined
                : AudienceLatencyLevelType.AudienceLatencyLevelUltraLowLatency,
        });
    };

    const leave = async () => {
        await agoraEngineRef.current?.leaveChannel();
        setIsJoined(false);
        setRemoteUids(prev => prev.filter(id => id !== agoraUid));
    };

    const toggleMic = async () => {
        const newMuteState = !isMicMuted;
        await agoraEngineRef.current?.muteLocalAudioStream(newMuteState);
        setIsMicMuted(newMuteState);
    };

    const switchCamera = async () => {
        await agoraEngineRef.current?.switchCamera();
        setIsFrontCamera(prev => !prev);
    };

    const cleanupAgoraEngine = () => {
        return () => {
            agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
            agoraEngineRef.current?.release();
        };
    };

    const fetchProfileInfo = async () => {
        try {
            const res = await getProfileInfo();

            setuId(res.userId);

            if (res.data) {
                setData({ ...res.data });
            }

        } catch (error) {
            // handle error UI if needed
            console.error("❌ Error fetching profile:", error.message);
        }
    };

    const fetchAllGifts = async () => {
        try {
            const gifts = await getAllGifts();
            setGiftsData(gifts);
        } catch (error) { console.log(error); }
    };

    const fetchAllUser = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users);
        } catch (error) { console.log(error); }
    };
    const fetchStreamInfo = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/stream/stream/${streamId}`);
            const info = res.data.data;
            console.log('stream info', info)
            setStreamInfo(info);
            setIsStreamLive(info?.status === 'LIVE');
            setCurrentBid(info.currentBid || info.startingBid);
            let userId = await AsyncStorage.getItem('userId');
            // console.log('ID', info?.creatorId?._id, 'Uid', userId)
            if (info?.creatorId?._id === userId) {
                console.log('You are the host of this stream');
                setHost(true)
                // agoraEngineRef.current?.enableVideo()
                agoraEngineRef.current?.startPreview()
            }
            // console.log(info)
            if (info.mode === "AUCTION" && info.endTime) {
                setEndTime(new Date(info.endTime).getTime());

            } else {
                setEndTime(null);
            }
            if (info.mode === "AUCTION") {
                setSuddenDeathEnabled(info.suddenDeath === true);
                setSuddenDeathThreshold(info.suddenDeathThresholdSeconds || 10);
                setSuddenDeathExtension(info.suddenDeathExtensionSeconds || 10);

                if (info.endTime) {
                    setEndTime(new Date(info.endTime).getTime());
                }
            }
            // fetchBiddings()
            fetchAuctionInfo()
        } catch (err) {
            console.log("Error fetching stream:", err);
        }
    };
    const fetchAuctionInfo = async () => {

        const stream = streamInfo._id
        console.log("Fetching auction info for streamId:", stream);
        try {
            let res = await axios.get(`${config.baseUrl}/auction/stream/${stream}`);
            const info = res.data.data;
            console.log('auction info', info)
            setAuctionDetails(info);
            setCurrentBid(info?.[0]?.currentBid || info?.[0]?.startingBid);
            // console.log('EndTime:', new Date(info?.[0]?.endTime).getTime());
            // setEndTime(new Date(info?.[0]?.endTime).getTime());
            // fetchBiddings()

        } catch (err) {
            console.log("Error fetching stream:", err);
        }
    };

    const fetchBiddings = async () => {
        console.log("Fetching biddings for streamId:", streamId, "with auctionId:", streamInfo?.auctionIds?.[0]);
        try {
            // console.log("📥 Fetching biddings for streamId:", streamId);
            const res = await axios.get(`${config.baseUrl}/bidding/by-auction-stream`,
                {
                    params: {
                        auctionId: auctionDetails?.[0]?._id,
                        streamId: streamInfo?._id,
                    },
                }
            );
            console.log("📊 Biddings API Response:", res?.data?.data);
            console.log(res)
            if (res?.data?.data) {
                console.log("✅ Biddings updated. Count:", res.data.data.length);
                setBiddings(res.data.data);
                // keep highest bid synced
                if (res.data.data.length > 0) {
                    const highestBid = res?.data?.data?.[0]?.bidAmount;
                    setCurrentBid(highestBid);
                    // console.log("💰 Highest bid set to:", highestBid);
                    // console.log("🏆 Current leader:", res.data.data[0].bidderId?.username);
                } else {
                    // console.log("⚠️ No bids yet");
                }
            } else {
                // console.warn("⚠️ No biddings data in response:", res?.data);
            }
        } catch (err) {
            console.log(err)
            console.error("❌ Error fetching bids:", err.message);
        }
    };
    const fetchToken = async () => {
        try {
            let res = await axios.get(`${config.baseUrl3}/stream/token/${streamId}/${Host ? "host" : "subscriber"}`);
            if (res?.data) {
                setToken(res?.data?.data);
                await setupVideoSDKEngine();
                setupEventHandler();
                await join(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // ✅ Verify if current user is the actual stream creator
    const isActualCreator = () => {
        const isCreator = uId && streamInfo?.creatorId?._id && uId === streamInfo.creatorId._id;
        return isCreator;
    };

    const handleEndStream = async () => {
        // Verify user is the actual stream creator (not just isHost flag)
        if (!isActualCreator()) {
            Alert.alert("Permission Denied", "Only the stream creator can end this stream.");
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            "End Stream",
            "Are you sure you want to end this stream? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Stream end cancelled"),
                    style: "cancel"
                },
                {
                    text: "End Stream",
                    onPress: async () => {
                        await performEndStream();
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const performEndStream = async () => {
        try {
            setEndingStream(true);

            if (!isActualCreator()) {
                Alert.alert("Permission Denied", "Only the creator can end this stream.");
                setEndingStream(false);
                return;
            }

            const streamStatus = biddings.length > 0 ? "COMPLETED" : "UNSOLD";

            const endPayload = {
                status: streamStatus,
                reason:
                    streamStatus === "COMPLETED"
                        ? "Stream ended manually by host"
                        : "Stream ended with no bids"
            };

            if (biddings.length > 0) {
                endPayload.winnerId = biddings[0]?.bidderId?._id;
                endPayload.winningBidAmount = biddings[0]?.bidAmount;
            }

            const res = await axios.put(
                `${config.baseUrl}/stream/end/${streamId}`,
                endPayload
            );

            const updatedStream = res?.data?.data;
            const winnerFromApi = res?.data?.winner;

            if (!updatedStream) {
                ToastAndroid.show("Error ending stream", ToastAndroid.SHORT);
                setEndingStream(false);
                return;
            }

            const winnerId =
                updatedStream.winnerId ??
                updatedStream.highestBidder ??
                null;

            if (winnerId) {
                const winningBidAmount =
                    updatedStream.currentBid ??
                    updatedStream.winningBidAmount ??
                    0;

                const winnerName =
                    winnerFromApi?.name ??
                    updatedStream.username ??
                    "Winner";

                const winnerImage =
                    winnerFromApi?.winnerImage ??
                    biddings[0]?.bidderId?.profile ??
                    null;

                setWinnerDetails({
                    winnerId,
                    bidAmount: winningBidAmount,
                    winnerImage,
                    productId: updatedStream.productId,
                    winnerName
                });
                try {
                    const getProd = await axios.get(`${config.baseUrl}/product/single/${updatedStream.productId}`);
                    let proddata = getProd?.data?.data;
                    const updatedProducts = [
                        {
                            ...proddata,
                            quantity: 1,
                            price: winningBidAmount,
                        }
                    ];
                    const orderPayload = {
                        userId: winnerId,
                        pickup_station: "Warehouse A - Los Angeles",

                        customer_address: "1234 Sunset Blvd",
                        city: "Los Angeles",
                        state: "CA",
                        zip: "90001",
                        country: "USA",

                        product: updatedProducts || [],

                        // auctionMode: true,
                        // streamId: streamId,
                        totalAmount: winningBidAmount
                    };

                    console.log("Sending order payload:", JSON.stringify(orderPayload, null, 2));

                    const orderRes = await axios.post(
                        `${config.baseUrl}/order/checkout`,
                        orderPayload
                    );

                    if (orderRes?.data) {
                        console.log("Order Success:", orderRes.data);
                        ToastAndroid.show("Order Created Successfully!", ToastAndroid.SHORT);
                    }

                } catch (orderError) {
                    console.log("Order Error Details:", {
                        message: orderError?.message,
                        status: orderError?.response?.status,
                        statusText: orderError?.response?.statusText,
                        data: orderError?.response?.data,
                        config: orderError?.config?.data
                    });

                    Alert.alert(
                        "Order Error",
                        `Order creation failed: ${orderError?.response?.data?.message ||
                        orderError?.message ||
                        "Please try again."
                        }`
                    );
                }
                ToastAndroid.show(
                    "Stream ended - Winner announced!",
                    ToastAndroid.SHORT
                );

                setBiddingWinner(true);

                setTimeout(async () => {
                    setBiddingWinner(false);
                    setWinnerDetails(null);
                    setEndingStream(false);
                    await leave();
                    navigation.navigate("Home");
                }, 3000);
            } else {
                ToastAndroid.show(
                    "Stream ended - No bids received",
                    ToastAndroid.SHORT
                );

                setTimeout(async () => {
                    setEndingStream(false);
                    await leave();
                    navigation.navigate("Home");
                }, 1500);
            }
        } catch (error) {
            ToastAndroid.show(
                "Error ending stream: " + error.message,
                ToastAndroid.LONG
            );
            setEndingStream(false);
        }
    };
    const fetchGifts = async () => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            if (true) {
                let res = await axios.get(`${config.baseUrl2}/gift/${userId}/${streamInfo?._id}`);
                if (res?.data?.data) {
                    setGift({
                        streamId: res?.data?.data?.streamId,
                        userId: res?.data?.data?.userId?._id,
                        username: res?.data?.data?.userId?.username,
                        name: res?.data?.data?.image
                    });
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                    setTimeout(() => {
                        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setGift(null));
                    }, 4000);
                }

            }
        }
        catch (error) {
            console.log(error, 'error in fetch gifts')
        }
    }
    const handleSend = async () => {
        if (!message.trim()) return;
        console.log('auction id', auctionDetails?.[0]?._id,)
        try {
            await axios.post(`${config.baseUrl}/stream/message`, { auctionId: auctionDetails?.[0]?._id, streamId: streamId, userId: uId, message });
            setMessage("");
            fetchMessages();
        } catch (error) {
            console.log(error, 'error in handle message send');
        }
    };
    const fetchMessages = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/stream/message/${streamId}`);
            if (res?.data?.data) {
                console.log("📨 Messages fetched:", res.data.data);
                const latestMessages = res.data.data.slice(-5);

                setComments(latestMessages);
            }
        } catch (error) {
            console.log(error, 'ERROR IN FETCH MESSAGES');
        }
    };

    const sendInvite = async (userId) => {
        try {
            await axios.post(`${config.baseUrl}/notification/invite`, { userId, streamId, invitedBy: data?._id });
            ToastAndroid.show("Invite sent successfully!", ToastAndroid.SHORT);
            setShowUserInvitation(false)
        }
        catch (error) {
            console.log("Error sending invite:", error);
            ToastAndroid.show("Failed to send invite.", ToastAndroid.SHORT);
        }
    };

    const handleAddToCard = (product) => {
        ToastAndroid.show('Item Added In Cart', ToastAndroid.SHORT);
        dispatch(addToCart({ ...product, quantity }));
    };
    const proceed = async () => {
        Keyboard.dismiss();
        setwallet(false)
        let userId = await AsyncStorage.getItem('userId');
        try {
            let paymentIntentRes = await axios.post(`${config.baseUrl2}/payment/create-intent`, { amount: amount * 100, currency: "usd" });
            if (!paymentIntentRes?.data?.clientSecret) {
                throw new Error("Failed to fetch payment intent");
            }
            let clientSecret = paymentIntentRes?.data?.clientSecret
            if (clientSecret) {
                const initResponse = await initPaymentSheet({ merchantDisplayName: "User", paymentIntentClientSecret: clientSecret })
                if (initResponse.error) {
                    Alert.alert(initResponse?.error?.message)
                    return
                }
                else {
                    const paymentResponse = await presentPaymentSheet()
                    if (paymentResponse.error) {
                        Alert.alert(paymentResponse?.error?.message)
                        return
                    }
                    else {
                        let res = await axios.put(`${config.baseUrl2}/account/buy/${userId}`, { dollars: amount });
                        if (res?.data) {
                            ToastAndroid.show('Coin Purchased Successfully!', ToastAndroid.SHORT);
                            setAmount(0)
                            fetchProfileInfo();
                        }
                    }
                }

            }
        }
        catch (error) {
            console.log(error);
        }
    };

    const handleSendGifts = async (coins, name) => {
        if (data?.coins < coins) {
            ToastAndroid.show('Not Enough Coins', ToastAndroid.SHORT);
            setshowGifts(false)
            return
        }
        let userId = await AsyncStorage.getItem('userId');

        let res = await axios.post(`${config.baseUrl}/gift/create`, { userId, streamId: streamInfo?._id, image: name });

        if (res?.data?.data) {
            ToastAndroid.show('Gift Sent!', ToastAndroid.SHORT);
            setshowGifts(false)
            fetchGifts()
            setTimeout(() => {
                fetchProfileInfo();
            }, 500);
        }
    }

    const handleBid = async (quickBid = null) => {
        Keyboard.dismiss();
        if (!isStreamLive) {
            Alert.alert("Auction Closed", "This stream is not live.");
            return;
        }
        if (endTime && Date.now() >= endTime) {
            Alert.alert("Bidding Closed", "The auction has ended.");
            return;
        }
        // Check if timer has ended
        // if (timeLeft === "00:00") {
        //     Alert.alert("Bidding Closed", "The bidding time has ended. No more bids are accepted.");
        //     return;
        // }

        // Parse bid amount safely
        let parsedBid = 0;
        if (quickBid) {
            parsedBid = quickBid;
        } else if (bidAmount && bidAmount?.trim() !== '') {
            parsedBid = parseInt(bidAmount, 10);
            if (isNaN(parsedBid)) {
                Alert.alert("Invalid Bid", "Please enter a valid bid amount");
                return;
            }
        }

        const finalBidAmount = parsedBid;
        if (finalBidAmount <= currentBid) {
            Alert.alert("Insufficient Amount", `Your bid must be higher than the current bid of $${currentBid}`);
            return;
        }
        try {
            let paymentIntentRes = await axios.post(`${config.baseUrl2}/payment/create-intent`, { amount: finalBidAmount * 100, currency: "usd" });
            if (!paymentIntentRes?.data?.clientSecret) {
                throw new Error("Failed to fetch payment intent");
            }
            let clientSecret = paymentIntentRes?.data?.clientSecret
            if (clientSecret) {
                const initResponse = await initPaymentSheet({ merchantDisplayName: "User", paymentIntentClientSecret: clientSecret })
                if (initResponse.error) {
                    Alert.alert(initResponse?.error?.message)
                    return
                }
                else {
                    const paymentResponse = await presentPaymentSheet()
                    if (paymentResponse.error) {
                        Alert.alert(paymentResponse?.error?.message)
                        return
                    }
                    else {
                        let userId = await AsyncStorage.getItem('userId');
                        console.log("User ID:", userId);
                        console.log("bidAmount:", bidAmount);
                        console.log("auctionId", auctionDetails?.[0]?._id);
                        console.log("streamId", streamInfo?._id);
                        const bidResponse = await axios.post(`${config.baseUrl}/stream/bidding`, {
                            streamId: streamInfo?._id,
                            bidderId: userId,
                            bidAmount: finalBidAmount,
                            auctionId: auctionDetails?.[0]?._id
                        });
                        console.log("Bid Response:", bidResponse);
                        // Show notification for quickbid
                        if (quickBid) {
                            setShowBidNotifcation(true);
                            setBidNotifcationData({
                                bidderId: { username: data?.username },
                                bidAmount: finalBidAmount
                            });
                            setCurrentBid(finalBidAmount);
                            setTimeout(() => {
                                setShowBidNotifcation(false);
                                setBidNotifcationData(null);
                            }, 3000);
                        }

                        // 🔥 SUDDEN DEATH: Auto-extend timer if bid placed in sudden death zone
                        const remainingSecsForBid = endTime ? Math.floor((endTime - Date.now()) / 1000) : 0;
                        const isInSuddenDeathZone =
                            suddenDeathEnabled &&
                            remainingSecsForBid > 0 &&
                            remainingSecsForBid <= suddenDeathThreshold;

                        if (isInSuddenDeathZone && endTime) {
                            const newEndTime = endTime + (suddenDeathExtension * 1000);
                            setEndTime(newEndTime);
                            socketRef.current?.emit("extendBiddingTime", {
                                streamId: streamInfo?._id,
                                newEndTime,
                                extensionReason: "Sudden Death - New bid received"
                            });
                            ToastAndroid.show(`⏱️ Time Extended +${suddenDeathExtension}s! Keep bidding!`, ToastAndroid.SHORT);
                        }

                        ToastAndroid.show('Bid Added!', ToastAndroid.SHORT);
                        setBidAmount('');
                        setBidAmount(currentBid)
                        await fetchProfileInfo();
                        await fetchStreamInfo();
                        await fetchAuctionInfo();

                        setshowBid(false);
                    }
                }

            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const followCreator = async (cid, followedBy) => {
        try {
            if (!followedBy?.includes(cid)) {
                let res = await axios.put(`${config.baseUrl2}/account/follow/${uId}/${cid}`);
                if (res?.data?.data) {
                    ToastAndroid.show('Now Following Creator!', ToastAndroid.SHORT);
                    fetchStreamInfo();
                    fetchAuctionInfo()
                    fetchProfileInfo()
                }
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const handleAddTimer = async (minutes, seconds) => {
        try {
            if (!isActualCreator()) {
                Alert.alert("Permission Denied", "Only the stream creator can modify the timer.");
                return;
            }

            let biddingEndTime = minutes * 60 + seconds;
            if (!isLiveAuction) {
                Alert.alert("Not Allowed", "Timer can only be updated during a live auction.");
                return;
            }

            // if (endTime && Date.now() >= endTime) {
            //     Alert.alert("Auction Ended", "Auction has already ended.");
            //     return;
            // }
            let res = await axios.post(`${config.baseUrl2}/stream/bidding/timer`, { streamId: streamInfo?._id, biddingEndTime: biddingEndTime });
            if (res?.data?.data) {
                ToastAndroid.show('Timer Added!', ToastAndroid.SHORT);
                fetchStreamInfo();
                fetchAuctionInfo()
            }
        } catch (error) {
            console.log(error);
            console.log("Axios Error:", error.response?.data);
            console.log("Status:", error.response?.status);
        }
    }

    const handleInitiateAuction = (product) => {
        setSelectedProductForAuction(product || streamInfo?.productId?.[0] || null);
        setAuctionFormData({
            startingBid: product.price.toString(),
            duration: '10',
            suddenDeathEnabled: false
        });
        setShowInitiateAuctionModal(true);
    };

    const handleSubmitAuction = async () => {
        if (!auctionFormData.startingBid || isNaN(auctionFormData.startingBid) || Number(auctionFormData.startingBid) <= 0) {
            Alert.alert('Invalid Bid', 'Please enter a valid starting bid amount');
            return;
        }

        if (!selectedProductForAuction) {
            // Alert.alert('Error', 'No product selected');
            // return;
            setSelectedProductForAuction(streamInfo?.productId?.[0] || null);
        }

        try {
            const biddingDuration = parseInt(auctionFormData.duration);
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + biddingDuration * 1000);

            const auctionData = {
                streamId: streamInfo._id,
                productId: !selectedProductForAuction._id ? streamInfo?.productId?.[0]?._id : selectedProductForAuction._id,
                startingBid: Number(auctionFormData.startingBid),
                duration: biddingDuration,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                suddenDeath: auctionFormData.suddenDeathEnabled,
                mode: 'AUCTION'
            };

            const res = await axios.post(`${config.baseUrl}/auction/create`, auctionData);

            if (res?.data?.success) {
                ToastAndroid.show('Auction Started Successfully!', ToastAndroid.LONG);
                setShowInitiateAuctionModal(false);
                setSelectedProductForAuction(null);
                setAuctionFormData({
                    startingBid: '',
                    duration: '10',
                    suddenDeathEnabled: false
                });
                // Refresh stream info to show updated auction status
                fetchStreamInfo();
                fetchAuctionInfo()
            } else {
                Alert.alert('Error', res?.data?.message || 'Failed to start auction');
                console.error('Auction creation failed:', res?.data);
            }
        } catch (error) {
            console.error('Error starting auction:', error);
            Alert.alert('Error', 'Failed to start auction. Please try again.');
        }
    };

    // ✨ AUTO SHIPMENT CREATION FOR AUCTION WINNERS
    const createShipmentForWinner = async (stream, winningBid) => {
        try {
            // Get bidder's information
            let bidderInfo = winningBid.bidderId;

            const shipmentData = {
                streamId: stream._id,
                bidderId: bidderInfo._id,
                sellerId: stream.creatorId._id,
                productId: stream.productId[0]?._id,
                bidAmount: winningBid.bidAmount,
                quantity: 1,
                customer_address: bidderInfo.address || "Address to be confirmed",
                city: bidderInfo.city || "City",
                state: bidderInfo.state || "State",
                country: bidderInfo.country || "Country",
                zip: bidderInfo.zip || "00000",
                total: winningBid.bidAmount,
                status: "pending",
            };

            const res = await axios.post(`${config.baseUrl}/shipment/create`, shipmentData);

            if (res?.data?.data) {
                ToastAndroid.show('Shipment Created for Winner!', ToastAndroid.SHORT);

                // Send notification to winner
                // await notifyWinner(bidderInfo._id, stream._id, winningBid.bidAmount);

                // return res.data.data;
            }
        } catch (error) {
            console.error('Shipment creation error:', error);
            ToastAndroid.show('Shipment creation failed', ToastAndroid.SHORT);
        }
    };

    const notifyWinner = async (winnerId, streamId, bidAmount) => {
        try {
            await axios.post(`${config.baseUrl}/notification/invite`, {
                userId: winnerId,
                type: 'auction_win',
                title: 'You Won an Auction! 🎉',
                message: `Congratulations! You won the auction with a bid of $${bidAmount}. Your shipment is being prepared.`,
                streamId: streamId,
                read: false,
            });
            // console.log("✅ Winner notification sent");
        } catch (error) {
            console.error('Notification error:', error);
        }
    };
    const remainingSeconds = endTime ? Math.floor((endTime - Date.now()) / 1000) : 0;

    const isSuddenDeathZone =
        suddenDeathEnabled &&
        remainingSeconds > 0 &&
        remainingSeconds <= suddenDeathThreshold;
    useEffect(() => {
        const init = async () => {
            await fetchToken()
            agoraEngineRef.current?.enableVideo()
            if (Host || isHost) {
                agoraEngineRef.current?.startPreview()
            }
        };
        init();

        return cleanupAgoraEngine();
    }, []);

    useEffect(() => {
        fetchMessages();
        fetchProfileInfo();
        fetchStreamInfo();
        fetchAllUser();
        fetchAllGifts()
        fetchAuctionInfo()
    }, [])

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardOpen(true);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardOpen(false);
        });
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        // 🛑 Don't start timer if stream already ended
        if (!endTime || isAuctionEnded) return;

        const interval = setInterval(() => {
            const diff = endTime - Date.now();
            const remainingSecsForCheck = Math.floor(diff / 1000);

            // ✅ Calculate if we're in sudden death zone
            const inSuddenDeathZone =
                suddenDeathEnabled &&
                remainingSecsForCheck > 0 &&
                remainingSecsForCheck <= suddenDeathThreshold;

            if (diff <= 0) {
                setTimeLeft("00:00");
                clearInterval(interval);

                // 🏆 AUCTION END LOGIC - Only auto-end if NOT in sudden death or if sudden death is disabled
                const finalizeAuction = async () => {
                    try {
                        // 🛑 Prevent multiple executions of this function
                        if (endingStream) {
                            console.log("⏹️ Stream already ending, skipping duplicate finalization");
                            return;
                        }

                        // Host ending stream is now manual only. Auto-close should not call performEndStream().
                        if (biddings.length > 0 && streamInfo) {
                            // ✅ Winner exists: Create shipment and mark auction completed
                            const winningBid = biddings[0];
                            await createShipmentForWinner(streamInfo, winningBid);
                            // console.log('winner', winnerDetails)
                            // Store winner details for display
                            setWinnerDetails({
                                winnerId: winningBid.bidderId._id,
                                username: winningBid.bidderId.username,
                                bidAmount: winningBid.bidAmount,
                                profile: winningBid.bidderId.profile
                            });
                            setBiddingWinner(true);

                            // Show single toast notification
                            ToastAndroid.show("🏆 Auction ended - Winner announced!", ToastAndroid.LONG);

                            // 📡 Update backend: Mark auction as COMPLETED
                            try {
                                await axios.put(`${config.baseUrl}/auction/end/${auctionDetails?.[0]?._id}`, {
                                    status: "COMPLETED",
                                    winnerId: winningBid.bidderId._id,
                                    winningBidAmount: winningBid.bidAmount
                                });
                                // console.log("✅ Auction marked as COMPLETED");
                            } catch (updateError) {
                                console.log("Note: Backend update may not be supported. Auction will be marked completed on next fetch.");
                            }

                            // Auto close modal and leave stream
                            setTimeout(async () => {
                                setBiddingWinner(false);
                                setWinnerDetails(null);
                                setEndTime(null); // 🛑 Clear endTime to prevent re-triggering
                                // await leave();
                                // navigation.navigate('Home');
                            }, 3000);
                        } else if (streamInfo && streamInfo.status === "LIVE") {
                            // ❌ No bids: Mark auction as UNSOLD
                            ToastAndroid.show("⏱️ Auction ended - No bids received", ToastAndroid.LONG);

                            try {
                                await axios.put(`${config.baseUrl}/auction/end/${auctionDetails?.[0]?._id}`, {
                                    status: "COMPLETED",
                                    winnerId: winningBid.bidderId._id,
                                    winningBidAmount: winningBid.bidAmount
                                });
                                console.log("❌ Auction marked as UNSOLD - No bids");
                            } catch (updateError) {
                                console.log("Note: Backend update may not be supported for unsold auctions.");
                            }

                            // Auto leave stream
                            setTimeout(async () => {
                                setEndTime(null); // 🛑 Clear endTime to prevent re-triggering
                                // await leave();
                                // navigation.navigate('Home');
                            }, 1500);
                        }

                        // Refresh stream info
                        // fetchStreamInfo(); // Commented out to prevent stream from ending when auction completes
                        fetchAuctionInfo()

                        const isHostEnding = isActualCreator();
                        if (isHostEnding) {
                            setShowAuctionEndPrompt(true);
                        } else {
                            setShowAuctionStartNotice(true);
                        }
                    } catch (error) {
                        console.log("Error finalizing auction:", error);
                        // fetchStreamInfo(); // Commented out to prevent stream from ending on error
                        fetchAuctionInfo()
                    }
                };

                finalizeAuction();
                return;
            }

            // Show warning when entering sudden death zone
            if (inSuddenDeathZone && remainingSecsForCheck === suddenDeathThreshold) {
                // console.log("🔥 SUDDEN DEATH ZONE ACTIVATED - Timer is in final", suddenDeathThreshold, "seconds");
                ToastAndroid.show(`🔥 SUDDEN DEATH! Last ${suddenDeathThreshold}s - Keep bidding to extend!`, ToastAndroid.LONG);
            }

            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(
                `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
            );
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [endTime, biddings, streamInfo, Host, suddenDeathEnabled, suddenDeathThreshold, isAuctionEnded]);

    useEffect(() => {
        socketRef.current = io("YOUR_BACKEND_URL");

        socketRef.current.emit("joinStream", streamId);
        // console.log("📡 Socket: Joined stream", streamId);

        socketRef.current.on("newBid", (data) => {
            // console.log("🎯 Socket: newBid event received", data);
            setCurrentBid(data.currentBid);
            // console.log("💰 Updated currentBid to:", data.currentBid);

            // Refresh biddings list with stream ID
            // console.log("🔄 Fetching updated biddings list...");
            // fetchBiddings();
        });

        socketRef.current.on("biddingTimeUpdated", (data) => {
            // console.log("⏱️ Socket: biddingTimeUpdated event received", data);
            if (data?.endTime) {
                const newTime = new Date(data.endTime).getTime();
                setEndTime(newTime);
                // console.log("⏰ Updated endTime to:", new Date(newTime).toLocaleTimeString());
            }

            if (data?.currentBid) {
                setCurrentBid(data.currentBid);
                // console.log("💰 Updated currentBid to:", data.currentBid);
            }
        });

        // 🔥 Listen for sudden death extensions from other bidders
        socketRef.current.on("auctionTimeExtended", (data) => {
            // console.log("🔥 Socket: auctionTimeExtended event received", data);
            if (data?.newEndTime) {
                const newTime = new Date(data.newEndTime).getTime();
                setEndTime(newTime);
                // console.log("⏰ Sudden Death: Extended endTime to:", new Date(newTime).toLocaleTimeString());
                ToastAndroid.show("⏱️ Auction time extended! Keep bidding!", ToastAndroid.SHORT);
            }
        });

        socketRef.current.on("streamEnded", () => {
            // console.log("🏁 Socket: streamEnded event received");
            fetchStreamInfo();
            fetchAuctionInfo()
        });

        // console.log("📊 Initial fetch: streamInfo and biddings for streamId:", streamId);
        fetchStreamInfo();
        fetchAuctionInfo()
        fetchBiddings();

        return () => {
            // console.log("🔌 Disconnecting socket");
            socketRef.current.disconnect();
        };
    }, []);
    // const currentBid = biddings.length > 0 ? biddings[0].bidAmount : 0

    const isAuction = streamInfo?.mode === "AUCTION";
    const isLiveAuction = isAuction && isStreamLive;
    const isAuctionEnded = isAuction && (streamInfo?.status === "COMPLETED" || timeLeft === "00:00");
    const StreamHeader = ({ streamInfo, isStreamLive, viewerCount, uId, isActualCreator, followCreator, handleEndStream, endingStream, navigation }) => {
        return (
            <View style={{ position: "absolute", top: 50, left: "1%", justifyContent: "space-between", alignItems: "center", flexDirection: "row", width: "93%", zIndex: 2 }}>
                <View style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: "row" }}>
                    <View style={{ display: "flex", alignItems: "center", gap: 15, flexDirection: "row" }}>
                        <View style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, backgroundColor: "#9a9a94", paddingHorizontal: 2, paddingVertical: 2, borderRadius: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Pressable
                                onPress={() => { navigation.navigate("profile_details", { userId: streamInfo?.creatorId?._id }) }}
                                style={{ flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 5, paddingVertical: 3 }}>
                                <View style={{ marginLeft: 2, }}>
                                    <Image source={{ uri: streamInfo?.creatorId?.profile }} style={{ width: 35, height: 35, borderRadius: 20, borderWidth: 1, borderColor: "#FF3729" }} />
                                    <View style={{ backgroundColor: (isStreamLive ? "#FF3729" : "#999"), borderRadius: 100, display: "flex", justifyContent: "center", alignItems: "center", paddingHorizontal: 6 }}>
                                        <Text style={{ color: "#fff", fontSize: 8 }}>{isStreamLive ? "LIVE" : streamInfo?.status || "OFFLINE"}</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{streamInfo?.creatorId?.username}</Text>
                                    <Text style={{ color: "#fff", fontSize: 10 }}>{streamInfo?.creatorId?.followers ?? 0} Followers</Text>
                                </View>
                                <TouchableOpacity onPress={() => { followCreator(streamInfo?.creatorId?._id, streamInfo?.creatorId?.followedBy) }} style={{ backgroundColor: "#FF3729", justifyContent: "center", alignItems: "center", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 10, marginLeft: 5 }}>
                                    <Text style={{ color: "#fff", fontSize: 13 }}>{streamInfo?.creatorId?.followedBy?.includes(uId) ? "Following" : "Follow"}</Text>
                                </TouchableOpacity>
                            </Pressable>
                        </View>
                    </View>
                    <TouchableOpacity style={{ shadowColor: "white", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, backgroundColor: "#9a9a94", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 40, display: "flex", alignItems: "center", flexDirection: "row", gap: 5 }}>
                        <AntDesign name="eye" size={24} color="white" />
                        <Text style={{ color: "#fff" }}>{viewerCount == 0 ? 1 : viewerCount}</Text>
                    </TouchableOpacity>
                </View>
                {isActualCreator() && (
                    <TouchableOpacity
                        onPress={handleEndStream}
                        disabled={endingStream}
                        style={{
                            backgroundColor: endingStream ? "#666" : "gray",
                            padding: 5,
                            marginLeft: 5,
                            borderRadius: 100,
                            flexDirection: "row",
                            alignItems: "center",
                            zIndex: 100,
                            opacity: endingStream ? 0.6 : 1
                        }}
                    >
                        {endingStream ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
                                <Text style={{ color: "#fff", fontSize: 12 }}>Ending...</Text>
                            </>
                        ) : (
                            <Entypo name='cross' size={22} color={"#fff"} />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    return (
        <View style={{ flex: 1 }}>
            <KeyboardAwareScrollView contentContainerStyle={styles.container} enableOnAndroid={true}>


                {isJoined && Host && (
                    <RtcSurfaceView
                        canvas={{
                            uid: localUid,
                            renderMode: 1,
                            mirrorMode: isFrontCamera ? 1 : 0,
                        }}
                        connection={{ channelId: channelName, localUid }}
                        style={styles.localVideo}
                    />
                )}

                {Host && isJoined && remoteUids?.map(uid => (
                    <RtcSurfaceView
                        key={uid}
                        canvas={{ uid, renderMode: 1 }}
                        connection={{ channelId: channelName, localUid }}
                        style={styles.remoteVideo}
                    />
                ))}

                {!Host && isJoined && remoteUids.length > 0 && remoteUids.map((uid, index) => (
                    <RtcSurfaceView key={uid} canvas={{ uid, renderMode: 1 }} connection={{ channelId: channelName, localUid }} style={index == 0 ? styles.remoteVideo2 : styles?.remoteVideo} />
                ))}

                <StreamHeader streamInfo={streamInfo} isStreamLive={isStreamLive} viewerCount={viewerCount} uId={uId} isActualCreator={isActualCreator} followCreator={followCreator} handleEndStream={handleEndStream} endingStream={endingStream} navigation={navigation} />
                {/* BIDDING TIMER - Only for stream creator */}
                {isActualCreator() && (
                    <TouchableOpacity onPress={() => { setTimerSelectionModal(true) }} style={{ position: "absolute", top: 120, left: "5%", width: 80, height: 30, borderWidth: 1, borderColor: "#999893", borderRadius: 26, flexDirection: "row", justifyContent: "center", alignItems: "center", zIndex: 2, backgroundColor: "rgba(0,0,0,0.6)" }}>
                        <Text style={{ color: timeLeft && Number(timeLeft.split(":")[0]) * 60 + Number(timeLeft.split(":")[1]) <= 10 ? "red" : "white", fontSize: 14, marginRight: 5 }}>{timeLeft}</Text>
                        <AntDesign name="plus" size={14} color="white" />
                    </TouchableOpacity>
                )}

                <UserInvitationModal
                    visible={showUserInvitation}
                    onClose={() => setShowUserInvitation(false)}
                    allUsers={allUsers}
                    sendInvite={sendInvite}
                />

                {
                    gift && (
                        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim }]}>
                            {
                                (() => {
                                    const matchedGift = giftsData.find(g => g.title === gift.name);

                                    return (
                                        <>
                                            <Image
                                                source={{
                                                    uri: matchedGift
                                                        ? matchedGift.image
                                                        : "https://via.placeholder.com/100"
                                                }}
                                                style={styles.giftImage}
                                            />
                                            <Text style={styles.giftText}>
                                                {gift.username} sent {matchedGift?.title || "a gift"}!
                                            </Text>
                                        </>
                                    );
                                })()
                            }
                        </Animated.View>
                    )
                }


                {
                    bidInfo && (
                        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim, zIndex: 2, }]}>
                            <Text style={styles.giftText}>{bidInfo?._doc?.username} added a bid! of $ {bidInfo?.amount}</Text>
                        </Animated.View>
                    )
                }

                {/* DISABLE THAT  */}
                <View style={{ position: 'absolute', bottom: Host ? 130 : 150, right: 10, gap: 15, alignItems: "center", zIndex: 2, }}>

                    {
                        Host && (
                            <TouchableOpacity onPress={toggleMic} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                                {
                                    isMicMuted ?
                                        <Octicons name={"mute"} size={20} color="#fff" /> :
                                        <Feather name={"volume"} style={{ marginLeft: 3 }} size={25} color="#fff" />
                                }
                            </TouchableOpacity>

                        )
                    }

                    {
                        Host && (

                            <TouchableOpacity onPress={() => setShowUserInvitation(true)} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                                <AntDesign name="plus" size={20} color="white" />
                            </TouchableOpacity>
                        )
                    }

                    <TouchableOpacity onPress={() => setHeart(!heart)} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                        <AntDesign name="heart" size={20} color={heart ? "#FF3729" : "#fff"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setshowMessages(!showMessages)} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                        <Feather name="message-circle" size={20} color="white" />
                    </TouchableOpacity>
                    {
                        Host &&
                        <TouchableOpacity onPress={switchCamera} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                            <Entypo name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    }
                    <TouchableOpacity onPress={() => { setShowProductCards(!showProductCards) }} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                        <Entypo name="chevron-small-down" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setshowShirts(!showShirts) }} style={{ ...styles.commanStyle, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="storefront" size={20} color="#F78E1B" />
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontSize: 20, marginLeft: 5 }}>${currentBid}</Text>
                    <View>
                        <Text style={{ color: timeLeft && Number(timeLeft.split(":")[0]) * 60 + Number(timeLeft.split(":")[1]) <= 10 ? "red" : "white", fontSize: 14, marginRight: 5 }}>{timeLeft}</Text>
                    </View>

                    <TouchableOpacity
                        disabled={!isLiveAuction || (endTime && Date.now() >= endTime) || isSuddenDeathZone}
                        onPress={() => handleBid(currentBid + (streamInfo?.bidIncrement || 2))}
                        style={{
                            backgroundColor: (!isLiveAuction || (endTime && Date.now() >= endTime) || isSuddenDeathZone) ? "gray" : "orange",
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 100,
                            zIndex: 10,
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 14 }}>Quick Bid</Text>
                    </TouchableOpacity>
                </View>

                {
                    showBidNotifcation && (
                        <View style={{ padding: 10, backgroundColor: "#D9D9D961", borderRadius: 20, marginVertical: 10, position: "absolute", top: "30%", left: "15%", zIndex: 2 }}>
                            <Text style={{ color: "#fff", fontWeight: "800" }}> {bidNotifcationData?.bidderId?.username} added a ${bidNotifcationData?.bidAmount} Bid</Text>
                        </View>
                    )
                }
                {/* {isSuddenDeathZone && (
                    <Text style={{
                        color: "orange", fontSize: 12, marginBottom: 20,
                        position: "absolute",
                        bottom: 90,
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10,
                        textAlign: "center",
                    }}>
                        Sudden Death Active 🔥
                    </Text>
                )} */}
                {
                    showShirts &&
                    <View
                        style={{
                            marginBottom: 20,
                            position: "absolute",
                            bottom: 5,
                            width: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 10,
                            backgroundColor: "rgba(0,0,0,0.1)"
                        }}
                    >
                        {/* Show first product as main large image */}
                        <View
                            style={{
                                paddingHorizontal: 25,
                                paddingVertical: 10,
                                backgroundColor: "#1A1A1A",
                                borderRadius: 10,
                                width: "95%",
                            }}
                        >
                            <View
                                style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: 10,
                                    borderRadius: 10,
                                }}
                            >
                                <Image
                                    source={{
                                        uri:
                                            streamInfo?.productId?.[0]?.images?.[0] ||
                                            "https://via.placeholder.com/150",
                                    }}
                                    style={{ width: "100%", height: 250, borderRadius: 10 }}
                                />
                            </View>

                            {/* Product thumbnails */}
                            <ScrollView
                                showsHorizontalScrollIndicator={false}
                                horizontal
                                contentContainerStyle={{
                                    marginTop: 10,
                                    gap: 10,
                                    flexDirection: "row",
                                    flex: 1,
                                    gap: 2
                                }}
                            >
                            </ScrollView>
                        </View>

                        {/* List of products with quantity and add-to-cart */}
                        <ScrollView
                            style={{
                                maxHeight: 300,
                                width: "95%",
                                marginTop: 15,
                                borderRadius: 10,
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            {streamInfo?.productId?.map((item) => (
                                <View
                                    key={item._id}
                                    style={{
                                        paddingHorizontal: 25,
                                        paddingVertical: 10,
                                        backgroundColor: "#1A1A1A",
                                        borderRadius: 10,
                                        marginBottom: 15,
                                    }}
                                >
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <View
                                            style={{
                                                justifyContent: "center",
                                                alignItems: "center",
                                                padding: 10,
                                                borderRadius: 5,
                                                backgroundColor: "#1A1A1A",
                                            }}
                                        >
                                            <Image
                                                source={{
                                                    uri: item?.images?.[0] || "https://via.placeholder.com/150",
                                                }}
                                                style={{ width: 30, height: 30 }}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: "#fff", fontSize: 15 }}>{item.title}</Text>

                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    flex: 1,
                                                }}
                                            >
                                                <Text style={{ color: "#fff", fontSize: 15 }}>${item.price}</Text>

                                            </View>
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flex: 1,
                                            marginTop: 10,
                                        }}
                                    >
                                        <View>
                                            <Text style={{ color: "#fff" }}>Total</Text>
                                            <Text style={{ color: "#fff", fontSize: 20 }}>
                                                ${(item.price * quantity).toFixed(2)}
                                            </Text>
                                        </View>

                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setshowShirts(false)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#1a1a1a",
                                padding: 10,
                                borderRadius: 10,
                                marginBottom: 20,
                                width: "95%"
                            }}
                        >
                            <Text style={{ color: "#fff", fontSize: 17 }}>Close</Text>
                        </TouchableOpacity>
                    </View>

                }
                {
                    showGifts &&
                    <View style={{ position: "absolute", left: 10, right: 10, bottom: 5, padding: 20, backgroundColor: "#000", zIndex: 2, width: "95%", borderRadius: 10 }}>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ color: "#fff", fontSize: 17 }}>Gifts</Text>
                            <TouchableOpacity onPress={() => setshowShirts(false)} style={{ backgroundColor: "orange", borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                                <AntDesign name="bank" size={13} color="#fff" />
                                <Text style={{ color: "#fff", marginLeft: 5 }}>{data?.coins}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", columnGap: 23, flexWrap: "wrap" }}>
                            {
                                giftsData?.map((i) => (
                                    <Pressable key={i?._id} onPress={() => { handleSendGifts(i?.coin, i?.title) }} style={{ backgroundColor: "#343434", padding: 10, marginTop: 15, borderRadius: 10 }}>
                                        <Image source={{ uri: i?.image }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                                        <Text style={{ color: "#fff", textAlign: "center", marginTop: 4 }}>{i?.title}</Text>
                                        <TouchableOpacity onPress={() => setshowShirts(false)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 5 }}>
                                            <AntDesign name="bank" size={13} color="orange" />
                                            <Text style={{ color: "#fff", marginLeft: 5 }}>{i?.coin}</Text>
                                        </TouchableOpacity>
                                    </Pressable>
                                ))
                            }
                        </View>

                        <TouchableOpacity onPress={() => setshowGifts(false)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#343434", padding: 10, marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ color: "#fff", fontSize: 17 }}>Close </Text>
                        </TouchableOpacity>

                    </View>
                }

                {
                    wallet &&
                    <View style={{ position: "absolute", left: 10, right: 10, bottom: 5, padding: 20, backgroundColor: "#000", zIndex: 2, width: "95%", borderRadius: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 17 }}>Coins</Text>
                            <Text style={{ color: "#fff", fontSize: 17 }}>🪙 {data?.coins}</Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#343434", padding: 10, marginTop: 15, borderRadius: 10 }}>
                            <View style={{ backgroundColor: "#5856d6", padding: 10, borderRadius: 10 }}><AntDesign name="creditcard" size={24} color="#fff" /></View>
                            <TextInput keyboardType="numeric" value={amount.toString()} onChangeText={(text) => setAmount(text ? parseInt(text) : '')} placeholderTextColor={"#747474"} style={{ flex: 1, height: 50, paddingHorizontal: 20, borderWidth: 1, borderColor: "#747474", marginLeft: 10, borderRadius: 10, }} placeholder='Amount To Buy Coins' />
                        </View>
                        <TouchableOpacity onPress={proceed} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "orange", padding: 10, marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ color: "#fff", fontSize: 17 }}>Pay Now </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setwallet(false)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#343434", padding: 10, marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ color: "#fff", fontSize: 17 }}>Close </Text>
                        </TouchableOpacity>
                    </View>
                }

                {
                    showBid &&
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", zIndex: 11, width: "90%", borderRadius: 30 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff" }}>$ Add Bid</Text>
                        </View>
                        <Text style={{ textAlign: "center", marginVertical: 10, color: "#c4c4c4" }}>Current Bid : ${currentBid}</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={bidAmount}
                            onChangeText={(text) => setBidAmount(text)}
                            editable={true}
                            selectTextOnFocus={true}
                            returnKeyType="done"
                            maxLength={10}
                            contextMenuHidden={false}
                            placeholderTextColor={"#999"}
                            style={{
                                backgroundColor: "#D9D9D91F",
                                height: 50,
                                paddingHorizontal: 15,
                                borderWidth: 1,
                                borderColor: "#747474",
                                borderRadius: 10,
                                color: "white",
                                fontSize: 16,
                                marginTop: 10
                            }}
                            placeholder='Enter your bid amount'
                        />
                        {bidAmount ? (
                            <View style={{ marginTop: 10, padding: 10, backgroundColor: "#343434", borderRadius: 8 }}>
                                <Text style={{ color: "#90EE90", fontSize: 14 }}>Your Bid: ${bidAmount}</Text>
                                {parseInt(bidAmount, 10) > currentBid && (
                                    <Text style={{ color: "#90EE90", fontSize: 12, marginTop: 5 }}>✓ Valid bid amount</Text>
                                )}
                                {parseInt(bidAmount, 10) <= currentBid
                                    // && bidAmount?.trim() !== '' 
                                    && (
                                        <Text style={{ color: "#FF6B6B", fontSize: 12, marginTop: 5 }}>✗ Must be higher than ${currentBid}</Text>
                                    )}
                            </View>
                        ) : null}
                        <View style={{ flexDirection: "row", marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setshowBid(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleBid()} style={styles.startAuctionButton}>
                                <Text style={styles.startAuctionText}>Bid</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                {
                    biddingWinner &&
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", width: "90%", borderRadius: 30, zIndex: 2 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 30 }}>Winner</Text>
                        </View>
                        <Text style={{ textAlign: "center", marginVertical: 10, color: "#c4c4c4" }}>Bid Amount : ${currentBid}</Text>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5, gap: 10 }}>
                            {
                                winnerDetails?.winnerImage && (
                                    <Image source={{ uri: winnerDetails?.winnerImage }} style={{ width: 40, height: 40, borderRadius: 40, marginBottom: 10 }} />
                                )
                            }
                            <Text style={{ color: "#fff", fontSize: 15 }}>{winnerDetails?.winnerName} has won the bidding</Text>
                        </View>
                        <View style={{ flexDirection: "row", marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setBiddingWinner(false)} style={[styles.cancelButton, { flex: 1 }]}>
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                {
                    showAuctionEndPrompt &&
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", width: "90%", borderRadius: 30, zIndex: 200 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 24, fontWeight: 'bold' }}>Auction Ended</Text>
                        </View>
                        <Text style={{ color: "#c4c4c4", fontSize: 14, textAlign: 'center', marginVertical: 15 }}>
                            The auction has ended. Would you like to start a new auction now?
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: 'space-between', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setShowAuctionEndPrompt(false)} style={[styles.cancelButton, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.cancelText}>Later</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                setShowAuctionEndPrompt(false);
                                setShowInitiateAuctionModal(true);
                            }} style={[styles.startAuctionButton, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.startAuctionText}>Start New Auction</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                {
                    showAuctionStartNotice &&
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", width: "90%", borderRadius: 30, zIndex: 200 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 24, fontWeight: 'bold' }}>New Auction Incoming</Text>
                        </View>
                        <Text style={{ color: "#c4c4c4", fontSize: 14, textAlign: 'center', marginVertical: 15 }}>
                            The current auction has ended. The host is preparing another auction now, please stay tuned.
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: 'center', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setShowAuctionStartNotice(false)} style={[styles.startAuctionButton, { flex: 1 }]}>
                                <Text style={styles.startAuctionText}>Okay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                {
                    showInitiateAuctionModal &&
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", width: "90%", borderRadius: 30, zIndex: 200 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 24, fontWeight: 'bold' }}>Start Auction</Text>
                        </View>
                        {selectedProductForAuction && (
                            <View style={{ alignItems: "center", marginVertical: 15 }}>
                                <Image source={{ uri: selectedProductForAuction?.images?.[0] || "https://via.placeholder.com/150" }} style={{ width: 60, height: 60, borderRadius: 10, marginBottom: 10 }} />
                                <Text style={{ color: "#fff", fontSize: 16, textAlign: 'center' }}>{selectedProductForAuction?.title}</Text>
                                <Text style={{ color: "#C4C4C4", fontSize: 14 }}>Price: ${selectedProductForAuction?.price}</Text>
                            </View>
                        )}
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Starting Bid ($)</Text>
                            <TextInput
                                keyboardType="numeric"
                                value={auctionFormData.startingBid}
                                onChangeText={(text) => setAuctionFormData({ ...auctionFormData, startingBid: text })}
                                placeholder="Enter starting bid"
                                placeholderTextColor="#999"
                                style={{
                                    backgroundColor: "#D9D9D91F",
                                    height: 50,
                                    paddingHorizontal: 15,
                                    borderWidth: 1,
                                    borderColor: "#747474",
                                    borderRadius: 10,
                                    color: "white",
                                    fontSize: 16,
                                    marginBottom: 15
                                }}
                            />
                            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Duration (seconds)</Text>
                            <TextInput
                                keyboardType="numeric"
                                value={auctionFormData.duration}
                                onChangeText={(text) => setAuctionFormData({ ...auctionFormData, duration: text })}
                                placeholder="Enter duration in seconds"
                                placeholderTextColor="#999"
                                style={{
                                    backgroundColor: "#D9D9D91F",
                                    height: 50,
                                    paddingHorizontal: 15,
                                    borderWidth: 1,
                                    borderColor: "#747474",
                                    borderRadius: 10,
                                    color: "white",
                                    fontSize: 16,
                                    marginBottom: 15
                                }}
                            />
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                                <TouchableOpacity
                                    onPress={() => setAuctionFormData({ ...auctionFormData, suddenDeathEnabled: !auctionFormData.suddenDeathEnabled })}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: "#F78E1B",
                                        backgroundColor: auctionFormData.suddenDeathEnabled ? "#F78E1B" : "transparent",
                                        marginRight: 10,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    {auctionFormData.suddenDeathEnabled && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
                                </TouchableOpacity>
                                <Text style={{ color: "#fff", fontSize: 14 }}>Enable Sudden Death</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", marginTop: 20 }}>
                            <TouchableOpacity onPress={() => {
                                setShowInitiateAuctionModal(false);
                                setSelectedProductForAuction(null);
                            }} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmitAuction} style={styles.startAuctionButton}>
                                <Text style={styles.startAuctionText}>Start Auction</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                <View style={{ position: "absolute", bottom: keyboardOpen ? 300 : 40, left: 10, paddingVertical: 10, maxHeight: "80%", zIndex: 10, width: "80%" }}>
                    {/* COMMENTS  */}
                    {
                        showMessages && (
                            <View>
                                {comments.map((item, index) => (
                                    <View key={index} style={styles.commentItem}>
                                        <Image
                                            source={{
                                                uri: item.userId?.profile || `https://randomuser.me/api/portraits/men/${index + 1}.jpg`,
                                            }}
                                            style={styles.commentAvatar}
                                        />
                                        <View>
                                            <Text style={styles.commentUser}>{item.userId?.username || "User"}</Text>
                                            <Text style={styles.commentText}>{item.message}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )
                    }

                    {/* PRODUCT CARDS  */}
                    {
                        showProductCards && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {
                                    streamInfo?.productId?.map((i) => (
                                        <View key={i?._id} style={{ ...styles.cardStyle, width: 250, padding: 20, borderRadius: 20, marginBottom: 20, marginRight: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                                                <Image source={{ uri: i?.images?.[0] || "https://via.placeholder.com/150", }} style={{ width: 50, height: 50, borderRadius: 10 }} />
                                                <View>
                                                    <Text style={{ color: "white" }}>{i?.title}</Text>
                                                    <Text style={{ color: "#C4C4C4" }}>In stock - {i?.stock}</Text>
                                                    <Text style={{ color: "white" }}>$ {i?.price}</Text>
                                                </View>
                                            </View>
                                            {Host && (
                                                <Pressable
                                                    onPress={() => handleInitiateAuction(i)}
                                                    style={{
                                                        backgroundColor: '#0A0A0A33',
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 3,
                                                        borderRadius: 30,
                                                        borderWidth: 1,
                                                        borderColor: "white",
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Text style={{ color: "#fff", fontSize: 20, }}>+</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    ))
                                }
                            </ScrollView>
                        )
                    }

                    {/* BOTTOM ICONS  */}
                    <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", gap: 10, width: "75%", }}>
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                placeholder='Add comment'
                                style={styles.commentPlaceholder}
                                value={message}
                                onChangeText={setMessage}
                                placeholderTextColor={"#fff"}
                            />
                            <TouchableOpacity style={{ marginLeft: 15 }} onPress={handleSend}>
                                <FontAwesome name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Pressable
                            onPress={() => {
                                if (isLiveAuction) {
                                    Alert.alert("Auction Mode", "Add to Cart is disabled during live auction.");
                                    return;
                                }
                                setshowShirts(true);
                            }}
                            style={styles.commanStyle}
                        >
                            <Ionicons name="cart-outline" size={20} color="#fff" />
                        </Pressable>
                        <Pressable onPress={() => { setshowGifts(true) }} style={styles.commanStyle}>
                            <Image source={giftImg} style={{ width: 20, height: 20 }} />
                        </Pressable>
                        <Pressable disabled={isSuddenDeathZone} onPress={() => { setshowBid(true) }} style={{ ...styles.commanStyle, backgroundColor: isSuddenDeathZone ? "#555" : '#F78E1B', }}>
                            <Image source={dollarImg} style={{ width: 20, height: 20 }} />
                        </Pressable>
                    </View>
                </View>

            </KeyboardAwareScrollView >
            <TimerModal
                visible={timerSelectionModal}
                hide={() => setTimerSelectionModal(false)}
                addTime={handleAddTimer}
            />

        </View>

    );
};

const styles = StyleSheet.create({
    iconButton: {
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
        flexGrow: 1
    },
    localVideo: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    remoteVideo: {
        position: "absolute",
        top: 40,
        right: 10,
        width: 100,
        height: 150,
        backgroundColor: "#1c1c1c",
        borderRadius: 8,
        overflow: "hidden",
        zIndex: 1,
    },
    remoteVideo2: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    controls: {
        position: "absolute",
        bottom: 30,
        width: "100%",
        right: 30,
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        zIndex: 2,
    },
    button: {
        backgroundColor: "#222",
        padding: 12,
        borderRadius: 300,
    },
    buttonText: {
        color: "#fff",
    },
    giftContainer: {
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.5)",
        top: 80,
        left: "30%",
        transform: [{ translateX: -50 }],
        backgroundColor: "rgba(52, 52, 52, 0.8)",
        padding: 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 30,
        zIndex: 2,
    },
    giftImage: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    giftText: {
        color: "#fff",
        fontWeight: "bold",
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: "#1A1A1A",
        borderRadius: 25,
        padding: 10,
        width: "48%",
        alignItems: "center"
    },
    cancelText: {
        color: "white"
    },
    startAuctionButton: {
        backgroundColor: "orange",
        borderRadius: 25,
        padding: 10,
        width: "48%",
        alignItems: "center"
    },
    startAuctionText: {
        color: "white"
    },
    bidButton: {
        backgroundColor: 'orange',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bidButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    commentInputBar: {
        marginBottom: 50,
    },
    giftButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    commentInputContainer: {
        borderRadius: 200,
        paddingHorizontal: 15,
        paddingVertical: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#2c2c2eff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
            },
            android: {
                elevation: 5,
                // marginBottom: 980,
            },
        }),
        maxWidth: 200,
        marginBottom: 5
    },

    commentPlaceholder: {
        color: '#fff',
        flex: 1,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    commentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 40,
        marginRight: 8,
    },
    commentUser: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    commentText: {
        color: '#ccc',
        fontSize: 13,
    },
    commanStyle: {
        padding: 10,
        borderRadius: 1000,
        backgroundColor: '#2c2c2eff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    cardStyle: {
        backgroundColor: '#0A0A0A33',
        opacity: 0.9,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    }
});

export default CreatorStreamScreen;