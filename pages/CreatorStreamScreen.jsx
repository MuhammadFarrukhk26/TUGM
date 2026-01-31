import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet, TouchableOpacity, Text, Animated, Modal, FlatList, Image, Keyboard, ToastAndroid, TextInput, Pressable, ScrollView, Alert } from "react-native";
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

const appId = config.appId;
const localUid = 0;

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


    const dispatch = useDispatch();
    const [amount, setAmount] = useState(0);
    const [bidAmount, setBidAmount] = useState('');
    const [uId, setuId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [showShirts, setshowShirts] = useState(false)
    const [showGifts, setshowGifts] = useState(false)
    const [wallet, setwallet] = useState(false)
    const [showBid, setshowBid] = useState(false);

    const [showMessages, setshowMessages] = useState(true);

    // CHAT 
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [heart, setHeart] = useState(false);
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState("");

    const [timerSelectionModal, setTimerSelectionModal] = useState(false)
    const [timeLeft, setTimeLeft] = useState("");
    const [endTime, setEndTime] = useState(null);
    const [showBidNotifcation, setShowBidNotifcation] = useState(false);
    const [bidNotifcationData, setBidNotifcationData] = useState(null);
    const [biddingWinner, setBiddingWinner] = useState(false);


    useLiveStreamSocket(streamId, setComments);





    const setupVideoSDKEngine = async () => {
        if (Platform.OS === "android") {
            await getPermission();
        }

        const engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;
        engine.initialize({ appId });
        if (isHost) {
            engine.enableVideo();
            engine.startPreview();
        }
    };

    const setupEventHandler = () => {
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                setIsJoined(true);
                if (isHost) {
                    setViewerCount(1);
                }
            },
            onUserJoined: (_connection, uid) => {
                console.log("👤 Remote user joined:", uid);
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
            clientRoleType: isHost
                ? ClientRoleType.ClientRoleBroadcaster
                : ClientRoleType.ClientRoleAudience,
            publishMicrophoneTrack: isHost,
            publishCameraTrack: isHost,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
            audienceLatencyLevel: isHost
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
            let userId = await AsyncStorage.getItem('userId');
            setuId(userId)
            let res = await axios.get(`${config.baseUrl2}/account/single/${userId}`);
            if (res?.data) {
                setData(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };
    const fetchAllGifts = async () => {
        try {
            let res = await axios.get(`${config.baseUrl2}/gifts/all`);
            if (res?.data) {
                setGiftsData(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchAllUser = async () => {
        try {
            let res = await axios.get(`${config.baseUrl2}/account/all`);
            if (res?.data) {
                setAllUsers(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchStreamInfo = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/stream/stream/${streamId}`);
            if (res?.data) {
                const info = res.data.data;
                console.log(info?._id, 'stream info')
                setStreamInfo(info);
                const created = new Date(info.createdAt).getTime();
                const end = created + info.biddingEndTime * 1000;
                setEndTime(end);
                fetchBiddings(info?._id);
            }
        } catch (error) {
            console.log(error);
        }
    };



    const fetchBiddings = async (streamId) => {
        try {
            let res = await axios.get(`${config.baseUrl}/stream/biddings/${streamId}`);
            if (res?.data) {
                setBiddings(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };



    const fetchToken = async () => {
        try {
            let res = await axios.get(`${config.baseUrl3}/stream/token/${streamId}/${isHost ? "host" : "subscriber"}`);
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

    const handleEndStream = async () => {
        try {
            if (isHost && !coHost) {
                let id = await AsyncStorage.getItem('streamId');
                let res = await axios.put(`${config.baseUrl2}/stream/end/${id}`)
                if (res?.data?.data) {
                    navigation.navigate('Home')
                    leave()
                }
            }
            else {
                await agoraEngineRef.current?.leaveChannel();
                navigation.navigate('Home')
            }
        }
        catch (error) {
            navigation.navigate('Home')
            // leave()
            console.log(error)
        }
    }
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
        try {
            await axios.post(`${config.baseUrl}/stream/message`, { streamId: streamId, userId: uId, message })
            setMessage("");
        } catch (error) {
            console.log(error, 'erro in handle message send');
        }
    };
    const fetchMessages = async () => {
        try {
            console.log(streamId, 'streamId');
            let res = await axios.get(`${config.baseUrl}/stream/message/${streamId}`);
            if (res?.data?.data) {
                setComments(res?.data?.data?.slice(0, 5));
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
        }
    }

    const handleBid = async (quickBid = null) => {
        Keyboard.dismiss();
        setshowBid(false)
        
        // Check if timer has ended
        if (timeLeft === "00:00") {
            Alert.alert("Bidding Closed", "The bidding time has ended. No more bids are accepted.");
            return;
        }
        
        const finalBidAmount = quickBid || (bidAmount ? parseInt(bidAmount) : 0);
        if (finalBidAmount <= currentBid) {
            Alert.alert("Insufficient Amount", `Your bid must be higher than the current bid of $${currentBid}`);
            return;
        }
        try {
            let paymentIntentRes = await axios.post(`${config.baseUrl2}/payment/create-intent`, { amount: finalBidAmount * 100, currency: "usd" });
            console.log(paymentIntentRes,'paymentIntentRes')
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
                        await axios.post(`${config.baseUrl}/stream/bidding`, { streamId: streamInfo?._id, bidderId: userId, bidAmount: finalBidAmount });
                        
                        // Show notification for quickbid
                        if (quickBid) {
                            setShowBidNotifcation(true);
                            setBidNotifcationData({
                                bidderId: { username: data?.username },
                                bidAmount: finalBidAmount
                            });
                            setTimeout(() => {
                                setShowBidNotifcation(false);
                                setBidNotifcationData(null);
                            }, 3000);
                        }
                        
                        ToastAndroid.show('Bid Added!', ToastAndroid.SHORT);
                        setBidAmount('');
                        fetchBiddings(streamInfo?._id);
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
            let biddingEndTime = minutes * 60 + seconds;
            let res = await axios.post(`${config.baseUrl2}/stream/bidding/timer`, { streamId: streamInfo?._id, biddingEndTime });
            if (res?.data?.data) {
                console.log(res?.data?.data, 'timer added')
                ToastAndroid.show('Timer Added!', ToastAndroid.SHORT);
                fetchStreamInfo();
            }
        } catch (error) {
            console.log(error);
        }
    }

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
                console.log("Shipment created:", res.data);
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
            console.log("✅ Winner notification sent");
        } catch (error) {
            console.error('Notification error:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchToken()
            agoraEngineRef.current?.enableVideo()
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

    // Reset bid amount when modal opens
    useEffect(() => {
        if (showBid) {
            setBidAmount('');
        }
    }, [showBid]);

    // BIDDING TIMER 
    useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
                clearInterval(interval);
                
                if (biddings.length > 0) {
                    setBiddingWinner(true);
                    
                    // ✨ AUTO-CREATE SHIPMENT FOR AUCTION WINNER
                    const winningBid = biddings[0]; // Highest bid
                    console.log('Winning Bid:', winningBid);
                    //  createShipmentForWinner(streamInfo, winningBid);
                }
                return;
            }

            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(
                `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, biddings, streamInfo]);



    // SOCKET 
    useEffect(() => {
        socketRef.current = io(config.socketUrl, { transports: ["websocket"] });
        socketRef.current.emit("join", { streamId });
        socketRef.current.on("biddingTimeUpdated", (biddingInfo) => {
            console.log('biddingTimeUpdated', biddingInfo)
            fetchStreamInfo()
        });
        socketRef.current.on("newBidding", (newBidding) => {
            console.log('newBidding', newBidding)
            setShowBidNotifcation(true)
            setBidNotifcationData(newBidding)
            fetchStreamInfo()
            setTimeout(() => {
                setShowBidNotifcation(false);
                setBidNotifcationData(null)
            }, 3000);
        });
        return () => {
            socketRef.current.disconnect();
        };
    }, [streamId]);

    const currentBid = biddings.length > 0 ? biddings[0].bidAmount : 0


    return (
        <View style={{ flex: 1 }}>
            <KeyboardAwareScrollView contentContainerStyle={styles.container} enableOnAndroid={true}>


                {isJoined && isHost && (
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

                {isHost && isJoined && remoteUids?.map(uid => (
                    <RtcSurfaceView
                        key={uid}
                        canvas={{ uid, renderMode: 1 }}
                        connection={{ channelId: channelName, localUid }}
                        style={styles.remoteVideo}
                    />
                ))}

                {!isHost && isJoined && remoteUids.length > 0 && remoteUids.map((uid, index) => (
                    <RtcSurfaceView key={uid} canvas={{ uid, renderMode: 1 }} connection={{ channelId: channelName, localUid }} style={index == 0 ? styles.remoteVideo2 : styles?.remoteVideo} />
                ))}

                <View style={{ position: "absolute", top: 50, left: "5%", justifyContent: "space-between", alignItems: "center", flexDirection: "row", width: "90%" }}>
                    <View style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: "row" }}>
                        <View style={{ display: "flex", alignItems: "center", gap: 15, flexDirection: "row" }}>
                            <View style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, backgroundColor: "#9a9a94", paddingHorizontal: 5, paddingVertical: 5, borderRadius: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Pressable onPress={() => { navigation.navigate("profile_details", { userId: streamInfo?.creatorId?._id }) }} style={{ flexDirection: "row", gap: 6 }}>
                                    <View style={{ marginLeft: 5 }}>
                                        <Image source={{ uri: streamInfo?.creatorId?.profile }} style={{ width: 30, height: 30, borderRadius: 20, borderWidth: 1, borderColor: "#FF3729" }} />
                                        <View style={{ backgroundColor: "#FF3729", borderRadius: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                            <Text style={{ color: "#fff", fontSize: 7 }}>Live</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{streamInfo?.creatorId?.username}</Text>
                                        <Text style={{ color: "#fff", fontSize: 10 }}>{streamInfo?.creatorId?.followers ?? 0} Followers</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => { followCreator(streamInfo?.creatorId?._id, streamInfo?.creatorId?.followedBy) }} style={{ backgroundColor: "#FF3729", justifyContent: "center", alignItems: "center", borderRadius: 100, paddingHorizontal: 15, marginLeft: 10 }}>
                                        <Text style={{ color: "#fff" }}>{streamInfo?.creatorId?.followedBy?.includes(uId) ? "Following" : "Follow"}</Text>
                                    </TouchableOpacity>
                                </Pressable>
                            </View>
                        </View>
                        <TouchableOpacity style={{ shadowColor: "white", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, backgroundColor: "#9a9a94", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 40, display: "flex", alignItems: "center", flexDirection: "row", gap: 5 }}>
                            <AntDesign name="eye" size={24} color="white" />
                            <Text style={{ color: "#fff" }}>{viewerCount == 0 ? 1 : viewerCount}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleEndStream} style={{ backgroundColor: "gray", padding: 5, marginLeft: 5,borderRadius: 100, flexDirection: "row", alignItems: "center", zIndex: 100 }}>
                        <Entypo name='cross' size={22} color={"#fff"} />
                    </TouchableOpacity>
                </View>

                {/* BIDDING TIMER  */}
                <TouchableOpacity onPress={() => { setTimerSelectionModal(true) }} style={{ position: "absolute", top: 120, left: "5%", width: 80, height: 30, borderWidth: 1, borderColor: "#999893", borderRadius: 26, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: timeLeft && Number(timeLeft.split(":")[0]) * 60 + Number(timeLeft.split(":")[1]) <= 10 ? "red" : "white", fontSize: 14, marginRight: 5 }}>{timeLeft}</Text>
                    <AntDesign name="plus" size={14} color="white" />
                </TouchableOpacity>



                <Modal animationType="slide" transparent={true} visible={showUserInvitation} onRequestClose={() => setShowUserInvitation(false)}>
                    <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0)", justifyContent: "flex-end" }}>

                        <View style={{ backgroundColor: "rgba(46, 45, 45, 0.8)", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", }}>
                            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "white" }}>Invite Users</Text>

                            {/* User List */}
                            <FlatList data={allUsers} keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (

                                    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.5)", }}>
                                        <Image
                                            source={{ uri: item?.profile ? item.profile : "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740&q=80" }
                                            }
                                            defaultSource={{ uri: "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740&q=80" }} // iOS only
                                            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                        />
                                        <Text style={{ flex: 1, fontSize: 16, color: "white" }}>{item?.username}</Text>
                                        <TouchableOpacity style={{ backgroundColor: "#007bff", paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, }} onPress={() => sendInvite(item._id)}>
                                            <Text style={{ color: "#fff", fontSize: 14 }}>Send Invite</Text>
                                        </TouchableOpacity>
                                    </View>

                                )}
                            />

                            {/* Close Button */}
                            <TouchableOpacity style={{ backgroundColor: "red", padding: 10, marginTop: 10, borderRadius: 5, alignItems: "center", }} onPress={() => setShowUserInvitation(false)}>
                                <Text style={{ color: "#fff", fontSize: 14 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
                        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim }]}>
                            <Text style={styles.giftText}>{bidInfo?._doc?.username} added a bid! of $ {bidInfo?.amount}</Text>
                        </Animated.View>
                    )
                }

                {/* DISABLE THAT  */}
                <View style={{ position: 'absolute', bottom: isHost ? 230 : 250, right: 20, gap: 15, alignItems: "center" }}>

                    {
                        isHost && (
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
                        isHost && (

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
                        isHost &&
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
                    <TouchableOpacity onPress={() => handleBid(currentBid + 2)} style={{ backgroundColor: "orange", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                        <Text style={{ color: "white", fontSize: 14 }}>Quick Bid</Text>
                    </TouchableOpacity>
                </View>

                {
                    showBidNotifcation && (
                        <View style={{ padding: 10, backgroundColor: "#D9D9D961", borderRadius: 20, marginVertical: 10, position: "absolute", top: "30%", left: "15%", }}>
                            <Text style={{ color: "#fff", fontWeight: "800" }}> {bidNotifcationData?.bidderId?.username} added a ${bidNotifcationData?.bidAmount} Bid</Text>
                        </View>
                    )
                }


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
                                                {/* <View
                                                style={{
                                                    flexDirection: "row",
                                                    gap: 5,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Pressable onPress={() => setQuantity(quantity + 1)}>
                                                    <AntDesign name="plus" size={15} color="#fff" />
                                                </Pressable>
                                                <Text style={{ color: "#fff", fontSize: 15 }}>{quantity}</Text>
                                                <Pressable
                                                    onPress={() => {
                                                        if (quantity > 1) setQuantity(quantity - 1);
                                                    }}
                                                >
                                                    <AntDesign name="minus" size={15} color="#fff" />
                                                </Pressable>
                                            </View> */}
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

                                        <TouchableOpacity
                                            onPress={() => {
                                                handleAddToCard(item);
                                                setshowShirts(false);
                                            }}
                                            style={{
                                                backgroundColor: "#fff",
                                                borderRadius: 20,
                                                paddingHorizontal: 15,
                                                paddingVertical: 5,
                                            }}
                                        >
                                            <Text style={{ color: "#000" }}>Add to cart</Text>
                                        </TouchableOpacity>
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
                    <View style={{ position: "absolute", left: 10, right: 10, bottom: 5, padding: 20, backgroundColor: "#000", zIndex: 1, width: "95%", borderRadius: 10 }}>

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
                    <View style={{ position: "absolute", left: 10, right: 10, bottom: 5, padding: 20, backgroundColor: "#000", zIndex: 1, width: "95%", borderRadius: 10 }}>
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
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", zIndex: 1, width: "90%", borderRadius: 30 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff" }}>$ Add Bid</Text>
                        </View>
                        <Text style={{ textAlign: "center", marginVertical: 10, color: "#c4c4c4" }}>Current Bid : ${currentBid}</Text>
                        <TextInput keyboardType="numeric" value={bidAmount} onChangeText={(text) => setBidAmount(text)} placeholderTextColor={"#fff"} style={{ flex: 1, backgroundColor: "#D9D9D91F", height: 50, paddingHorizontal: 20, borderWidth: 1, borderColor: "#747474", marginLeft: 10, borderRadius: 10, color: "white" }} placeholder='Your Bid' />
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
                    <View style={{ position: "absolute", left: 20, right: 10, bottom: keyboardOpen ? 400 : 30, padding: 20, backgroundColor: "#000", zIndex: 1, width: "90%", borderRadius: 30 }}>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5 }}>
                            <Text style={{ color: "#fff", fontSize: 30 }}>Winner</Text>
                        </View>
                        <Text style={{ textAlign: "center", marginVertical: 10, color: "#c4c4c4" }}>Bid Amount : ${biddings[0]?.bidAmount}</Text>
                        <View style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 5, gap: 10 }}>
                            {
                                biddings[0]?.bidderId?.profile && (
                                    <Image source={{ uri: biddings[0]?.bidderId?.profile }} style={{ width: 40, height: 40, borderRadius: 40, marginBottom: 10 }} />
                                )
                            }
                            <Text style={{ color: "#fff", fontSize: 15 }}>{biddings[0]?.bidderId?.username} has won the bidding</Text>
                        </View>
                        <View style={{ flexDirection: "row", marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setBiddingWinner(false)} style={[styles.cancelButton, { flex: 1 }]}>
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }


                <View style={{ position: "absolute", bottom: keyboardOpen ? 280 : 40, left: 10, paddingVertical: 10, maxHeight: "50%" }}>

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
                                        <View key={i?._id} style={{ ...styles.cardStyle, width: 250, padding: 20, borderRadius: 20, marginBottom: 20, marginRight: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                                                <Image source={{ uri: i?.images?.[0] || "https://via.placeholder.com/150", }} style={{ width: 50, height: 50, borderRadius: 10 }} />
                                                <View>
                                                    <Text style={{ color: "white" }}>{i?.title}</Text>
                                                    <Text style={{ color: "#C4C4C4" }}>In stock - {i?.stock}</Text>
                                                    <Text style={{ color: "white" }}>$ {i?.price}</Text>
                                                </View>
                                            </View>
                                            <Pressable onPress={() => handleAddToCard(i)}>
                                                <Feather name="plus-circle" size={25} color="#fff" />
                                            </Pressable>
                                        </View>
                                    ))
                                }
                            </ScrollView>
                        )
                    }

                    {/* BOTTOM ICONS  */}
                    <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", gap: 10, width: "75%" }}>
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

                        <Pressable onPress={() => { setshowShirts(true) }} style={styles.commanStyle}>
                            <Ionicons name="cart-outline" size={20} color="#fff" />
                        </Pressable>
                        <Pressable onPress={() => { setshowGifts(true) }} style={styles.commanStyle}>
                            <Image source={giftImg} style={{ width: 20, height: 20 }} />
                        </Pressable>
                        <Pressable onPress={() => { setshowBid(true) }} style={{ ...styles.commanStyle, backgroundColor: '#F78E1B', }}>
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
        zIndex: 0,
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
        zIndex: 0,
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
        top: 80,
        left: "30%",
        transform: [{ translateX: -50 }],
        backgroundColor: "rgba(52, 52, 52, 0.8)",
        padding: 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 30
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
                elevation: 10,
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
    }
});

export default CreatorStreamScreen;