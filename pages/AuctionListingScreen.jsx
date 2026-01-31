import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Pressable, ToastAndroid } from 'react-native';
import BottomNavBar from '../components/BottomNav';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import config from '../config';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { useNavigation } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';

const auctionData = [
    {
        name: 'sam',
        image: "https://randomuser.me/api/portraits/men/10.jpg",
        date: 'Dec 26, 2024 07:52',
    },
    {
        name: 'james',
        image: "https://randomuser.me/api/portraits/women/11.jpg",
        date: 'Dec 26, 2024 08:50',
    },
    {
        name: 'c',
        image: "https://randomuser.me/api/portraits/men/12.jpg",
        date: 'Dec 28, 2024 09:10',
    },
    {
        name: 'ali',
        image: "https://randomuser.me/api/portraits/men/13.jpg",
        date: 'Dec 29, 2024 10:10',
    },
];

const dressImages = [
    "https://images.pexels.com/photos/1078983/pexels-photo-1078983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/1816183/pexels-photo-1816183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/2917595/pexels-photo-2917595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
];
const products = [
    { id: 1, name: 'Jacket name', rating: 4.9, reviews: 300, price: 45.00, image: dressImages[0] },
    { id: 2, name: 'Jacket name', rating: 4.9, reviews: 7700, price: 85.00, image: dressImages[3] },
    { id: 3, name: 'Jacket name', rating: 4.9, reviews: 700, price: 95.00, image: dressImages[2] },
    { id: 4, name: 'Jacket name', rating: 4.9, reviews: 3700, price: 55.00, image: dressImages[3] },
    { id: 1, name: 'Jacket name', rating: 4.9, reviews: 300, price: 45.00, image: dressImages[0] },
    { id: 2, name: 'Jacket name', rating: 4.9, reviews: 7700, price: 85.00, image: dressImages[3] },
    { id: 3, name: 'Jacket name', rating: 4.9, reviews: 700, price: 95.00, image: dressImages[2] },
    { id: 4, name: 'Jacket name', rating: 4.9, reviews: 3700, price: 55.00, image: dressImages[3] },
];
const AuctionListingScreen = () => {

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [uid, setUid] = useState("")

    const [categories, setCategories] = useState();
    const [products, setProducts] = useState([]);
    const [filterproducts, setFilterProducts] = useState([]);
    const [streams, setStreams] = useState([])

    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState('Auctions');
    const [activeCategory, setActiveCategory] = useState('Jacket');
    const [likedItems, setLikedItems] = useState({});

    const handleCategoryPress = (category) => {
        setActiveCategory(category);
        const filtered = products.filter(product => product?.categories?.includes(category));
        setFilterProducts(filtered);
    };
    const filteredAuctions = auctionData?.filter(stream => stream?.name?.toLowerCase()?.includes(searchText?.toLowerCase()));


    const handleTabPress = (tabName) => {
        setActiveTab(tabName);
    };


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
            let res = await axios.get(`${config.baseUrl}/stream/active`);
            if (res?.data) {
                setStreams(res?.data?.data);
                console.log(res?.data?.data)
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    const fetchProduct = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/product/all`);
            if (res?.data) {
                // const filtered = res.data.data.filter(product => product?.categoryId?.category === "Shirts");
                setProducts(res?.data?.data);
                setFilterProducts(activeCategory ? res?.data?.data?.filter((x) => x?.categories?.includes(activeCategory)) : res?.data?.data)
                // setFilterProducts(filtered);
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    const followCreator = async (cid) => {
        try {
            let res = await axios.put(`${config.baseUrl}/account/follow/${uid}/${cid}`);
            if (res?.data?.data) {
                ToastAndroid.show('Now Following Creator!', ToastAndroid.SHORT);
                fetchLiveStreams();
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const handleAddToCard = (product) => {
        ToastAndroid.show('Item Added In Cart', ToastAndroid.SHORT);
        dispatch(addToCart({ ...product, quantity: 1 }));
    };


    useEffect(() => {
        fetchLiveStreams();
        fetchCategory();
        fetchProduct();
    }, []);



    return (
        <GestureHandlerRootView style={styles.container}>


            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20 }}>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>TUGM</Text>
                    <Pressable onPress={() => { navigation.navigate("Cart") }} style={{ flexDirection: "row", alignItems: "center" }}>
                        <Feather name="shopping-cart" size={24} color="white" />
                    </Pressable>
                </View>

                <View style={styles.btnContainer}>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'Auctions' && styles.activeTab]} onPress={() => handleTabPress('Auctions')}>
                        <Text style={[styles.tabText, activeTab !== 'Auctions' ? styles.inActiveTabText : styles?.activeTab]}>Auctions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabButton, activeTab === 'Buy now' && styles.activeTab]} onPress={() => handleTabPress('Buy now')}>
                        <Text style={[styles.tabText, activeTab !== 'Buy now' ? styles.inActiveTabText : styles?.activeTab]}>Buy now</Text>
                    </TouchableOpacity>
                </View>

                {
                    activeTab == "Auctions" ?
                        (
                            streams?.length > 0 ? (
                                <View>

                                    <View style={styles.catContainer}>
                                        <View style={styles.searchBar}>
                                            <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                                            <TextInput style={styles.searchInput} placeholder="Search for auctions" placeholderTextColor="gray" value={searchText} onChangeText={setSearchText} />
                                        </View>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardList}>
                                            {streams?.map((stream, index) => (
                                                <TouchableOpacity onPress={() => { navigation.navigate("CreatorStream", { streamId: stream?.streamId,isHost:false }) }} key={stream?._id} style={styles.card}>
                                                    <Image source={{ uri: stream?.coverImage || stream?.creatorId?.profile }} style={styles.cardImage} blurRadius={4} />
                                                    <View style={styles.cardOverlay}>
                                                        <View style={styles.profileContainer}>
                                                            <Image source={{ uri: stream?.creatorId?.profile || stream?.creatorId?.coverImage  }} style={styles.profileImage} />
                                                            <Text style={styles.profileName}>{stream?.creatorId?.username}</Text>
                                                        </View>
                                                        <Text style={styles.upcomingText}>Live</Text>
                                                        {/* <Text style={styles.dateText}>{stream.date}</Text> */}
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    {
                                        streams?.map((i) => (
                                            <TouchableOpacity key={i?.id} onPress={() => { navigation.navigate("CreatorStream", { streamId: i?.streamId,isHost:false }) }} style={styles.liveContainer}>
                                                <Image source={{ uri: i?.coverImage }} style={styles.liveImage} />
                                                <View style={styles.liveInfo}>
                                                    <View style={styles.liveUserInfo}>
                                                        <View style={styles.liveBadge}>
                                                            <Text style={styles.liveBadgeText}>LIVE</Text>
                                                        </View>
                                                        <View style={styles.liveStreamText}>
                                                            <Text style={styles.liveStreamTitle}>{i?.creatorId?.username}</Text>
                                                            <Text style={styles.liveStreamDescription}>{i?.creatorId?.followers} followers</Text>
                                                        </View>
                                                    </View>
                                                    <TouchableOpacity onPress={() => followCreator(i?.creatorId?._id)} style={styles.followButton}>
                                                        <Text style={styles.followButtonText}>Follow</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={styles.dotsContainer}>
                                                    <View style={styles.dot} />
                                                    <View style={styles.dot} />
                                                    <View style={styles.dot} />
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    }


                                </View>
                            ) : <Text style={{ flex: 1, textAlign: "center", fontSize: 20, color: "#fff", marginTop: 200 }}>No Live Auction Found</Text>

                        )

                        :
                        <View>
                            <View style={styles.catContainer}>
                                <View style={styles.searchBar}>
                                    <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                                    <TextInput style={styles.searchInput} placeholder="Search for products" placeholderTextColor="gray" value={searchText} onChangeText={setSearchText} />
                                </View>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
                                {categories?.map((category) => (
                                    <TouchableOpacity key={category?._id} style={[styles.button, activeCategory === category?.category && styles.activeButton,]} onPress={() => handleCategoryPress(category?.category)}>
                                        <Text style={[styles.buttonText, activeCategory !== category?.category && styles.inActiveButtonText]}>{category?.category}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.productList}>
                                {filterproducts?.map((product) => (
                                    <View key={product?._id} style={styles.card}>
                                        <TouchableOpacity style={styles.cartButton} onPress={() => handleAddToCard(product)}>
                                            <AntDesign name="plus" size={20} color="white" />
                                        </TouchableOpacity>
                                        <Image source={{ uri: product.image }} style={styles?.productImage} />
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{product?.title}</Text>
                                            <View style={styles.ratingContainer}>
                                                <Text style={styles.rating}>4.3</Text>
                                                <Text style={styles.reviews}>(0 Reviews)</Text>
                                            </View>
                                            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                }

            </ScrollView>



            <BottomNavBar />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 40,
        paddingBottom: 20
    },
    storyContainer: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        flexDirection: "row",
        display: "flex",
        overflow: "scroll",
    },
    storyItem: {
        alignItems: 'center',
        marginHorizontal: 20,
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
    },
    liveContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 70
    },
    liveImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
        borderRadius: 10,
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
    catContainer: {
        backgroundColor: '#000',
        padding: 20,
    },
    searchBar: {
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
    },
    cardList: {
        marginTop: 20,
        flexDirection: "row",
        gap: 10
    },
    card: {
        width:150,
        backgroundColor: '#282828',
        borderRadius: 10,
        marginBottom: 20,
        overflow: 'hidden',
        marginHorizontal:15,
    },
    cardImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
    },
    upcomingText: {
        color: 'white',
        fontWeight: 'bold',
    },
    dateText: {
        color: 'gray',
        fontSize: 12,
    },
    profileContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5
    },
    profileImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 5
    },
    profileName: {
        color: "white"
    },
    btnContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    tabButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 20,
    },
    activeTab: {
        color: "#F78E1B"
    },
    tabText: {
        fontSize: 16,
        color: 'gray',
    },
    inActiveTabText: {
        color: "gray"
    },
    activeTab: {
        color: "orange"
    },
    categoryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 10
    },
    button: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'gray',
        marginRight: 10,
        backgroundColor: "#1A1A1A"
    },
    activeButton: {
        borderColor: '#FFA500',
        backgroundColor: '#FFA500',
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
        marginBottom: 50
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
    likeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1,
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
});

export default AuctionListingScreen
