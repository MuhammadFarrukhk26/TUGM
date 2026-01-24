import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, Pressable, TouchableOpacity, ToastAndroid, Modal, Dimensions } from 'react-native';
import BottomNavBar from '../components/BottomNav';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import config from '../config';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

import Video from 'react-native-video';
import { addToFavourite } from '../redux/favouriteSlice';
const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
    const cart = useSelector(state => state.cart.cartItems);
    const [activeCategory, setActiveCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilterProducts] = useState([])
    const [streams, setStreams] = useState([])
    const [uid, setUid] = useState("");
    const [profileData, setprofileData] = useState(null)
    const [stories, setstories] = useState([]);
    const [viewStoryModel, setViewStoryModel] = useState(false)
    const [createStoryData, setcreateStoryData] = useState({ assets: [] });
    const [createStoryModel, setcreateStoryModel] = useState(false);
    const [showViewersModel, setShowViewersModel] = useState(false)

    const dispatch = useDispatch();
    const navigation = useNavigation();

    const fetchCategory = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/category/all`);
            if (res?.data) {
                setCategories(res?.data?.data);
                setActiveCategory(res?.data?.data[0]?.category);
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    const fetchLiveStreams = async () => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            setUid(userId)
            let res = await axios.get(`${config.baseUrl2}/stream/active`);
            if (res?.data) {
                console.log('Auction list',res?.data?.data)
                setStreams(res?.data?.data);
            }
        }
        catch (error) {
            console.log(error, 'error');
        }
    };
    const fetchProduct = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/product/all`);
            if (res?.data) {
                setProducts(res?.data?.data);
                setFilterProducts(activeCategory ? res?.data?.data?.filter((x) => x?.categories?.includes(activeCategory)) : res?.data?.data)
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    const fetchStory = async () => {
        try {
            let res = await axios.get(`${config.baseUrl2}/story/all`);
            if (res?.data) {
                setstories(res?.data?.data);
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    const fetchProfileInfo = async () => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            let res = await axios.get(`${config.baseUrl2}/account/single/${userId}`);
            if (res?.data) {
                setprofileData(res?.data?.data);
            }
        } catch (error) {
            console.log(error);
        }
    };
    const handleCategoryPress = (category) => {
        setActiveCategory(category);
        const filtered = products?.filter(product => product?.categories?.includes(category));
        setFilterProducts(filtered);
    };
    const updateViewers = async (storyId) => {
        try {
            await axios.put(`${config.baseUrl2}/story/view/${storyId}`, { uId: uid, });
        }
        catch (error) {
            console.error("Error updating viewers:", error);
        }
    };


    const followCreator = async (cid, followedBy) => {
        try {
            if (!followedBy?.includes(cid)) {
                let res = await axios.put(`${config.baseUrl2}/account/follow/${uid}/${cid}`);
                if (res?.data?.data) {
                    ToastAndroid.show('Now Following Creator!', ToastAndroid.SHORT);
                    fetchLiveStreams();
                }
            }
        }
        catch (error) {
            // ToastAndroid.show('Error In Following Creator!', ToastAndroid.SHORT);
            console.log(error)
        }
    }
    const handleAddToCard = (product) => {
        ToastAndroid.show('Item Added In Cart', ToastAndroid.SHORT);
        dispatch(addToCart({ ...product, quantity: 1 }));
    };

    const pickMedia = async () => {
        const options = {
            mediaType: 'mixed',  // Allows both images & videos
            quality: 1,
            includeBase64: false,
            selectionLimit: 3,  // Allows selecting up to 3 media files
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                ToastAndroid.show('Selection canceled!', ToastAndroid.SHORT);
            } else if (response.errorMessage) {
                console.log('MediaPicker Error:', response.errorMessage);
            } else if (response.assets) {
                let selectedFiles = response.assets.map(item => item.uri);

                // Ensure total selected files do not exceed 3
                setcreateStoryData(prevData => ({
                    ...prevData,
                    assets: [...prevData.assets, ...selectedFiles].slice(0, 3)
                }));
            }
        });
    };


    const uploadStory = async () => {
        let userId = await AsyncStorage.getItem('userId');
        if (createStoryData.assets.length === 0) {
            ToastAndroid.show("Please select at least one image or video!", ToastAndroid.SHORT);
            return;
        }

        ToastAndroid.show("Uploading Story!", ToastAndroid.SHORT);

        const formData = new FormData();
        formData.append("userId", userId);
        createStoryData?.assets?.forEach((uri, index) => {
            formData.append('assets', {
                uri,
                type: uri.includes('.mp4') ? 'video/mp4' : 'image/jpeg',
                name: `file_${index}.${uri.split('.').pop()}`
            });
        });

        try {
            let response = await axios.post(`${config.baseUrl}/story/create`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, })
            if (response?.data?.data) {
                ToastAndroid.show("Story Uploaded!", ToastAndroid.SHORT);
                setcreateStoryData({ assets: [] });
                setcreateStoryModel(false);
                fetchStory()
            }
        } catch (error) {
            console.log("Upload Error:", error);
            ToastAndroid.show("Upload Failed!", ToastAndroid.SHORT);
        }
    };



    useEffect(() => {
        fetchLiveStreams();
        fetchCategory();
        fetchProduct();
        fetchStory();
        fetchProfileInfo()
    }, []);

    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        if (viewStoryModel) {
            setCurrentStoryIndex(0);
            setCurrentMediaIndex(0);
        }
    }, [viewStoryModel]);
    useEffect(() => {
        if (viewStoryModel && currentStory?._id) {
            updateViewers(currentStory._id);
        }
    }, [viewStoryModel, currentStoryIndex]);

    const currentStory = stories[currentStoryIndex];
    const currentMedia = currentStory?.assets[currentMediaIndex];

    const nextMedia = () => {
        if (currentMediaIndex < currentStory.assets.length - 1) {
            setCurrentMediaIndex(currentMediaIndex + 1);
        } else {
            nextStory();
        }
    };

    const prevMedia = () => {
        if (currentMediaIndex > 0) {
            setCurrentMediaIndex(currentMediaIndex - 1);
        }
        else {
            prevStory();
        }
    };

    const nextStory = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            setCurrentMediaIndex(0);
        } else {
            setViewStoryModel(false);
        }
    };

    const prevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
            setCurrentMediaIndex(0);
        }
        else {
            setViewStoryModel(false);
        }
    };

    const timeAgo = (timestamp) => {

        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return "just now";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;
        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} months ago`;
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} years ago`;

    };

    return (
        <View style={styles.container}>

            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 40 }}>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>TUGM</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Pressable style={{ marginRight: 10 }} onPress={() => { navigation.navigate("Notification") }}>
                            <Ionicons name="notifications" size={24} color="white" />
                        </Pressable>
                        <Pressable onPress={() => { navigation.navigate("Cart") }} style={{ position: "relative" }}>
                            <Feather name="shopping-cart" size={24} color="white" />
                            {
                                cart.length > 0 && (
                                    <View style={{ position: "absolute", top: -10, right: -10, backgroundColor: "#FFA500", justifyContent: "center", alignItems: "center", borderRadius: 100, width: 25, height: 25 }}>
                                        <Text style={{ color: "#fff" }}>{cart.length ?? 0}</Text>
                                    </View>
                                )
                            }
                        </Pressable>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storyContainer}>
                    <Pressable onPress={() => setcreateStoryModel(!createStoryModel)} style={styles.storyItem}>
                        <View style={[styles.imageContainer]}>
                            <Image source={{ uri: profileData?.profile }} style={styles.storyImage} />
                        </View>
                        <Text style={{ color: '#C4C4C4', marginTop: 5 }}>Upload Story</Text>
                    </Pressable>
                    {stories.map((user, index) => (
                        <Pressable onPress={() => setViewStoryModel(!viewStoryModel)} key={index} style={styles.storyItem}>
                            <View style={[styles.imageContainer, index == 0 && styles.activeStoryBorder]}>
                                <Image source={{ uri: user?.userId?.profile }} style={styles.storyImage} />
                            </View>
                            <Text numberOfLines={1} lineBreakMode='tail' style={styles.storyText}>{user?.userId?.username}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {
                    streams?.length > 0 && (
                        <TouchableOpacity onPress={() => { navigation.navigate("CreatorStream", { streamId: streams[0]?.streamId, isHost: false }) }} style={styles.liveContainer}>
                            <Image source={{ uri: streams[0]?.coverImage }} style={styles.liveImage} />
                            <View style={styles.liveInfo}>
                                <View style={styles.liveUserInfo}>
                                    <View style={styles.liveBadge}>
                                        <Text style={styles.liveBadgeText}>LIVE</Text>
                                    </View>
                                    <View style={styles.liveStreamText}>
                                        <Text style={styles.liveStreamTitle}>{streams[0]?.creatorId?.username}</Text>
                                        <Text style={styles.liveStreamDescription}>{streams[0]?.creatorId?.followers} followers</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => followCreator(streams[0]?.creatorId?._id, streams[0]?.creatorId?.followedBy)} style={styles.followButton}>
                                    <Text style={styles.followButtonText}>{streams[0]?.creatorId?.followedBy?.includes(uid) ? "Following" : "Follow"}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dotsContainer}>
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                            <TouchableOpacity style={styles.likeButton2}>
                                <AntDesign name="hearto" size={24} color="white" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )
                }


                <ScrollView showsHorizontalScrollIndicator={false} horizontal contentContainerStyle={styles.categoryContainer}>
                    {categories?.map((category) => (
                        <TouchableOpacity key={category?._id} style={[styles.button, activeCategory === category?.category && styles.activeButton,]} onPress={() => handleCategoryPress(category?.category)}>
                            <Text style={[styles.buttonText, activeCategory !== category?.category && styles.inActiveButtonText]}>{category?.category}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.productList}>
                    {filteredProducts?.map((product) => (
                        <TouchableOpacity onPress={() => navigation.navigate("single_product", { productId: product._id })} key={product._id} style={styles.card}>
                            <TouchableOpacity style={styles.cartButton} onPress={() => handleAddToCard(product)}>
                                <AntDesign name="plus" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.cartButton, { top: 40 }]} onPress={() => { dispatch(addToFavourite(product)); ToastAndroid.show("Item Added", ToastAndroid.SHORT) }}>
                                <AntDesign name="heart" size={13} color="white" />
                            </TouchableOpacity>
                            <Image source={{ uri: product?.images[0] }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product?.title}</Text>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.rating}>4.3</Text>
                                    <Text style={styles.reviews}>(0 Reviews)</Text>
                                </View>
                                <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>


            <Modal visible={createStoryModel} transparent={true} animationType="slide" onRequestClose={() => setcreateStoryModel(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create Story</Text>

                        <Pressable onPress={pickMedia} style={[styles.closeButton, { backgroundColor: "orange" }]}>
                            <Text style={styles.closeButtonText}>Pick Image/Video</Text>
                        </Pressable>

                        <ScrollView showsHorizontalScrollIndicator={false} horizontal style={{ marginVertical: 0 }}>
                            {createStoryData.assets.map((uri, index) => (
                                <View key={index} style={{ marginRight: 10, marginTop: 10 }}>
                                    <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                                </View>
                            ))}
                        </ScrollView>

                        <Pressable onPress={uploadStory} style={[styles.closeButton, { backgroundColor: "#1A1A1A" }]}>
                            <Text style={styles.closeButtonText}>Upload Story</Text>
                        </Pressable>

                        {/* Close Button */}
                        <Pressable onPress={() => setcreateStoryModel(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>


            <Modal visible={viewStoryModel} transparent={true} animationType="fade" onRequestClose={() => viewStoryModel(false)}>
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    {/* User Info */}
                    {currentStory?.userId && (

                        <View style={{ width: "100%", top: 0, left: 0, zIndex: 2, backgroundColor: "#5D5E63", paddingVertical: 20, paddingHorizontal: 20, borderTopEndRadius: 40, borderTopStartRadius: 40 }}>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', }}>
                                <View style={{ flexDirection: 'row', alignItems: "center", gap: 10 }}>
                                    <TouchableOpacity onPress={() => setViewStoryModel(false)}><Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" /></TouchableOpacity>
                                    <Image source={{ uri: currentStory.userId.profile }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, borderColor: "orange", borderWidth: 1 }} />
                                </View>
                                <View>
                                    <Text style={{ color: 'white', fontSize: 16 }}>{currentStory.userId.username || "None"}</Text>
                                    <Text style={{ marginTop: 4 }}>{timeAgo(currentStory?.createdAt)}</Text>
                                </View>
                            </View>

                        </View>

                    )}


                    {/* Story Content */}
                    <TouchableOpacity style={{ flex: 1 }} onPress={nextMedia} activeOpacity={1}>
                        {/* {console.log(currentMedia?.includes('.mp4'))} */}
                        {currentMedia?.includes('.mp4') ? (
                            // <Video controls={true} ref={videoRef} source={{ uri: currentMedia }} style={{ width, height }} resizeMode="cover" onEnd={nextMedia} autoplay />
                            <Video ref={videoRef} source={{ uri: currentMedia, cache: true }} style={{ width, height }} resizeMode="cover" controls={false} onLoadStart={() => console.log("Loading video...")} onLoad={() => console.log("Video Loaded!")} onError={(error) => console.log("Video Error:", error)} onEnd={nextMedia} />
                        )
                            : (<Image source={{ uri: currentMedia }} style={{ width, height }} resizeMode="cover" />)}
                    </TouchableOpacity>

                    <TouchableOpacity style={{ position: 'absolute', left: 0, width: '25%', height, backgroundColor: 'transparent' }} onPress={prevMedia} />
                    <TouchableOpacity style={{ position: 'absolute', right: 0, width: '25%', height, backgroundColor: 'transparent' }} onPress={nextMedia} />
                    {
                        uid == currentStory?.userId?._id && (
                            !showViewersModel ?

                                <TouchableOpacity style={{ position: 'absolute', bottom: 50, width: "100%", justifyContent: "center", alignItems: "center" }} onPress={() => setShowViewersModel(!showViewersModel)}>
                                    <AntDesign name="eye" size={20} color="white" />
                                </TouchableOpacity> :

                                <Pressable style={{ position: 'absolute', marginHorizontal: 20, bottom: 50, height: 100, width: "90%", backgroundColor: "#FFFFFF", borderRadius: 15 }} onPress={() => setShowViewersModel(!showViewersModel)}>

                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, backgroundColor: "#F6F5F3", borderTopEndRadius: 15, borderTopStartRadius: 15 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                            <AntDesign name="eyeo" size={20} color="black" />
                                            <Text style={{ color: "#000" }}>Viewed by {currentStory?.viewers?.length || 0}</Text>
                                        </View>
                                        <AntDesign name="instagram" size={20} color="black" />
                                    </View>

                                    {
                                        currentStory?.viewers?.length > 0 ?
                                            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10, paddingHorizontal: 10 }}>
                                                {currentStory.viewers.map((viewer, index) => (
                                                    <View key={index} style={{ alignItems: "flex-start", marginRight: 15, flexDirection: "row", gap: 9 }}>
                                                        <Image source={{ uri: viewer.profile }} style={{ width: 40, height: 40, borderRadius: 20, borderColor: "#9D9D9D", borderWidth: 1 }} />
                                                        <Text style={{ color: '#000000', fontSize: 12, marginTop: 5 }}>{viewer.username || "Unknown"}</Text>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                            :
                                            <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: "center", marginTop: 10, paddingHorizontal: 10 }}>
                                                <Text style={{ marginTop: 10, color: "#5C5C5C" }}>No Viewers Found</Text>
                                            </View>
                                    }


                                </Pressable>

                        )
                    }
                </View>
            </Modal>





            <BottomNavBar />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    storyContainer: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        flexDirection: "row",
        display: "flex",
        overflow: "scroll"
    },
    storyItem: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'gray',
        justifyContent: "center",
        alignItems: "center"
    },
    activeStoryBorder: {
        borderColor: "orange"
    },
    storyImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
        resizeMode: 'cover',
    },
    storyText: {
        color: '#C4C4C4',
        marginTop: 5,
        width: 60,
    },
    liveContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    liveImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
        borderRadius: 10, // Match container border radius
    },
    liveInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        shadowOpacity: 0,
        opacity: 2,
        position: 'absolute',
        width: '100%',
    },
    liveUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveBadge: {
        backgroundColor: 'red',
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    liveBadgeText: {
        color: 'white',
        fontSize: 10,
    },
    liveStreamText: {
        marginLeft: 10,
    },
    liveStreamTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    liveStreamDescription: {
        color: 'white',
        fontSize: 12,
    },
    followButton: {
        backgroundColor: 'white',
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    followButtonText: {
        color: 'black',
        fontWeight: "bold"
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        alignSelf: "center"
    },
    dot: {
        backgroundColor: 'white',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    likeButton2: {
        position: "absolute",
        bottom: 30,
        right: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center"
    },
    categoryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20, // Add horizontal padding for spacing
        marginTop: 20
    },
    button: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'gray',
        marginRight: 10, // Add spacing between buttons
        backgroundColor: "#1A1A1A"
    },
    activeButton: {
        borderColor: '#FFA500', // Orange border for active button
        backgroundColor: '#FFA500', // Orange background for active button
    },
    inActiveButtonText: {
        color: "grey"
    },
    buttonText: {
        color: "black"
    },
    productList: {
        marginTop: 20,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 50,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 50,
    },
    card: {
        flexBasis: "46%",
        backgroundColor: '#282828',
        borderRadius: 10,
        marginHorizontal: 5,
        marginBottom: 20
    },
    productImage: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        resizeMode: 'cover',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    rating: {
        color: 'gold',
        marginRight: 5,
    },
    reviews: {
        color: 'gray',
    },
    price: {
        color: 'white',
        fontWeight: 'bold',
    },
    cartButton: {
        position: "absolute",
        top: 10,
        right: 5,
        zIndex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        width: 30,
        height: 30,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#000",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: "#727272",
        borderRadius: 5,
        width: "100%",
        height: 40,
        justifyContent: "center",
        alignItems: "center"
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
    },
});
export default HomeScreen;
