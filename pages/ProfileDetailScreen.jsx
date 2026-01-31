import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, ToastAndroid } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import axios from 'axios'
import config from '../config';
import { addToFavourite } from '../redux/favouriteSlice';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/core';

const ProfileDetailScreen = ({ route }) => {
    const { userId } = route.params;
    const navigation = useNavigation();
    const [profileData, setProfileData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('Catalogue');
    const [streams, setStreams] = useState([]);
    const [posts, setPosts] = useState([]);
    const [currentUserId, setcurrentUserId] = useState("");

    const dispatch = useDispatch()
    const fetchProfileInfo = async () => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            setcurrentUserId(userId)
            let res = await axios.get(`${config.baseUrl2}/account/single/${userId}`);
            if (res?.data) {
                setProfileData(res?.data?.data);
            }
        } catch (error) {
            console.log("Error fetching profile info:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/product/user/${userId}`);
            if (res.data) {
                setProducts(res.data.data);
                console.log(res)
            }
        } catch (error) {
            console.log("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchUserStreams = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/stream/user/${userId}`);
            if (res?.data) {
                setStreams(res?.data?.data);
            }
        } catch (error) {
            console.log("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchPosts = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/post/user/${userId}`);
            if (res?.data) {
                setPosts(res?.data?.data);
            }
        } catch (error) {
            console.log("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const followCreator = async (cid, followedBy) => {
        try {
            if (!followedBy?.includes(cid)) {
                let res = await axios.put(`${config.baseUrl2}/account/follow/${currentUserId}/${cid}`);
                if (res?.data?.data) {
                    ToastAndroid.show('Now Following Creator!', ToastAndroid.SHORT);
                    fetchProfileInfo()
                }
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchProfileInfo();
        fetchProducts();
        fetchUserStreams()
        fetchPosts()
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const displayData = profileData;

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => { navigation.goBack() }}>
                <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{displayData?.username}</Text>
            <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );

    console.log(profileData, 'profileData?.followedBy')

    const renderProfileSection = () => (
        <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
                <Image source={{ uri: displayData?.profile }} style={styles.profileImage} />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Seller</Text>
                </View>
            </View>
            <Text style={styles.username}>{displayData?.username}</Text>
            {/* <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => (
                    <FontAwesome
                        key={i} name="star" size={16} color={i < Math.floor(3) ? "#FFD700" : "#666"} style={{ marginRight: 2 }} />
                ))}
            </View> */}
            <Text style={styles.bioText}>The best shoe seller | Shoe designer | New Balance | Nike | Adidas</Text>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statCount}>{formatNumber(displayData?.followers)}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statCount}>{formatNumber(displayData?.followers)}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statCount}>{streams.length}</Text>
                    <Text style={styles.statLabel}>Streams</Text>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleMessagePress} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Share Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { followCreator(userId, profileData?.followedBy) }} style={styles.actionButton}>
                    <Text style={{ color: "#fff" }}>{profileData?.followedBy?.includes(currentUserId) ? "Following" : "Follow"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {['Catalogue', 'Live', 'Posts'].map(tab => (
                <TouchableOpacity key={tab} style={[styles.actionCategories, selectedTab === tab && styles.actionButton]} onPress={() => setSelectedTab(tab)}>
                    <Text style={styles.tabText}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderProductItem = ({ item }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: item?.images[0] }} style={styles.productImage} />
            <TouchableOpacity onPress={() => { dispatch(addToFavourite(item)); ToastAndroid.show("Item Added", ToastAndroid.SHORT) }} style={styles.heartIcon}>
                <Ionicons name="heart-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.title}</Text>
                <View style={styles.productRating}>
                    <FontAwesome name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>
                        {item.rating || 4.9} ({Array.isArray(item.reviews) ? item.reviews.length : 0} Reviews)
                    </Text>
                </View>
                <Text style={styles.productPrice}>${item.price}</Text>
            </View>
        </View>
    );
    const renderStream = ({ item }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: item?.coverImage }} style={styles.productImage} />
        </View>
    );

    const renderPost = ({ item }) => {
        return (
            <View style={styles.productCard}>
                <TouchableOpacity
                    onPress={async () => {
                        try {
                            await axios.put(`${config.baseUrl}/post/view/${item._id}`);
                        } catch (err) {
                            console.log("Error updating view count", err);
                        }
                        navigation.navigate('view_post', { post: item });
                    }}
                >
                    <View style={styles.blurCard}>
                        <Ionicons name="play-circle-outline" size={50} color="white" />
                    </View>
                </TouchableOpacity>

                <View style={{ position: "absolute", bottom: 10, left: 10, flexDirection: "row", alignItems: "center", display: 'flex', gap: 10 }}>
                    <AntDesign name="eye" color={"white"} />
                    <Text style={{ color: "white" }}>{item?.views} Views</Text>
                </View>
            </View>
        );
    };


    const handleMessagePress = async () => {
        const currentUserId = await AsyncStorage.getItem("userId")
        if (!currentUserId) {
            ToastAndroid.show("User not authenticated", ToastAndroid.SHORT);
            return;
        }
        try {
            const payload = { userId1: currentUserId, userId2: userId };
            const res = await axios.post(`${config.baseUrl2}/chat/create`, payload);
            if (res?.data?.data) {
                const chat = res.data.data;
                navigation.navigate("messages", { chatId: chat._id, chatUser: displayData, currentUserId });
            } else {
                ToastAndroid.show("Failed to create chat", ToastAndroid.SHORT);
            }
        } catch (err) {
            console.log("create chat error", err);
            ToastAndroid.show("Error starting chat", ToastAndroid.SHORT);
        }
    };


    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView>
                {renderProfileSection()}
                {renderTabs()}
                {/* Render content based on selected tab */}
                {selectedTab === 'Catalogue' && (
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.productGrid}
                        scrollEnabled={false}
                        contentContainerStyle={styles.productListContainer}
                    />
                )}
                {selectedTab === 'Live' && (
                    <FlatList
                        data={streams}
                        renderItem={renderStream}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.productGrid}
                        scrollEnabled={false}
                        contentContainerStyle={styles.productListContainer}
                    />
                )}
                {selectedTab === 'Posts' && (
                    <FlatList
                        data={posts}
                        renderItem={renderPost}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.productGrid}
                        scrollEnabled={false}
                        contentContainerStyle={styles.productListContainer}
                    />
                )}

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#555',
    },
    badge: {
        position: 'absolute',
        bottom: -10,
        left: '15%',
        transform: [{ translateX: -30 }],
        backgroundColor: '#4CAF50',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 2,
        borderColor: '#1C1C1C',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
    },
    username: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        marginTop: 5,
    },
    bioText: {
        color: '#ccc',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statCount: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#ccc',
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 25,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: "center",
        paddingVertical: 9
    },
    actionCategories: {
        flex: 1,
        backgroundColor: '#1B1B1B',
        borderRadius: 25,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: "center",
        marginBottom: 15
    },
    actionButtonText: {
        color: 'white',
        fontSize: 15
    },
    shareButton: {
        backgroundColor: '#333',
        borderRadius: 25,
        padding: 12,
        marginLeft: 5,
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginTop: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    selectedTab: {
        borderBottomWidth: 2,
        borderBottomColor: 'white',
    },
    tabText: {
        color: '#ccc',
    },
    productListContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    productGrid: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productCard: {
        flex: 1,
        backgroundColor: '#2A2A2A',
        borderRadius: 15,
        marginHorizontal: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: 180,
    },
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 5,
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    productRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingText: {
        color: '#ccc',
        fontSize: 12,
        marginLeft: 5,
    },
    productPrice: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 5,
    },
    loadingText: {
        color: 'white',
        textAlign: 'center',
        marginTop: 50,
    },
    blurCard: {
        width: '100%',
        height: 180,
        backgroundColor: '#222',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.7,
    },
});

export default ProfileDetailScreen;
