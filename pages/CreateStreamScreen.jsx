import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Switch, Modal, Image, TextInput, Pressable, Button, ToastAndroid } from 'react-native';
import BottomNavBar from '../components/BottomNav';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Insta from '../assets/insta.png'
import Tiktok from '../assets/tiktok.png'
import Youtub from '../assets/youtub.png'
import { useNavigation } from '@react-navigation/core';
import config from "../config";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
const timeOptions = ['5s', '10s', '15s', '20s', '25s', '30s', '40s', '50s', '1m'];
const tabs = ["Auction", "Buy Now", "Giveaway", "Sold", "Offers", "Tips"];


const CreateStreamScreen = () => {
    const navigation = useNavigation();

    const [data, setData] = useState({
        startingBid: 1,
        productId: [], // ✅ array for multi-select
        image: null
    });
    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])

    const [isSuddenDeathEnabled, setIsSuddenDeathEnabled] = useState(false);
    const [selectedTime, setSelectedTime] = useState('10s');
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isSocialVisible, setIsSocialVisible] = useState(false);
    const [isStoreVisible, setIsStoreVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');
    const [selectedTab, setSelectedTab] = useState("Auction");
    const [filteredProducts, setFilterProducts] = useState([])


    const togglePopup = () => { setIsPopupVisible(!isPopupVisible); }
    const handleCategoryPress = (category) => {
        setActiveCategory(category);
        const filtered = products.filter(product => product?.categories?.includes(category));
        setFilterProducts(filtered);

    };

    const fetchCategory = async () => {
        try {
            let res = await axios.get(`${config.baseUrl}/category/all`)
            if (res?.data) {
                setCategories(res?.data?.data);
                setActiveCategory(res?.data?.data[0]?.category)
            }
        }
        catch (error) {
            console.log(error)
        }
    }
    const fetchProduct = async () => {
        let userId = await AsyncStorage.getItem('userId');
        try {
            let res = await axios.get(`${config.baseUrl}/product/user/${userId}`)
            if (res?.data) {
                setProducts(res?.data?.data);
                setFilterProducts(activeCategory ? res?.data?.data?.filter((x) => x?.categories?.includes(activeCategory)) : res?.data?.data)
            }
        }
        catch (error) {
            console.log(error)
        }
    }
    const pickImage = async () => {
        const options = { mediaType: 'photo', quality: 1, includeBase64: false, };
        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                ToastAndroid.show('Image selection canceled!', ToastAndroid.SHORT);
            }
            else if (response.errorMessage) {
                console.log('ImagePicker Error: ', response.errorMessage);
            }
            else if (response.assets && response.assets.length > 0) {
                const selectedImage = response.assets[0].uri;
                setData({ ...data, image: selectedImage });
            }
        });
    };

    // const handleStartStream = async () => {
    //     let creatorId = await AsyncStorage.getItem('userId');

    //     if (!data.startingBid || data.productId.length === 0 || !data.image) {
    //         ToastAndroid.show('All Fields Are Required!', ToastAndroid.SHORT);
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append("startingBid", data.startingBid);
    //     formData.append("creatorId", creatorId);
    //     data.productId.forEach((id) => formData.append("productId[]", id));

    //     if (data.image) {
    //         formData.append("image", {
    //             uri: data.image,
    //             name: "product.jpg",
    //             type: "image/jpeg",
    //         });
    //     }

    //     try {
    //         ToastAndroid.show('Creating Stream!', ToastAndroid.SHORT);
    //         const res = await axios.post(`${config.baseUrl}/stream/create`, formData, {
    //             headers: { 'Content-Type': 'multipart/form-data' },
    //         });

    //         if (res?.data?.data) {
    //             ToastAndroid.show('Stream Created!', ToastAndroid.SHORT);
    //             await AsyncStorage.setItem('streamId', res.data.data._id);
    //             setTimeout(() => {
    //                 navigation.replace("CreatorStream", {
    //                     streamId: res.data.data.streamId,
    //                     isHost: true,
    //                 });
    //             }, 3000);
    //         }
    //     } catch (error) {
    //         console.log("Error creating stream:", error);
    //     }
    // };

    const convertTimeToMinutes = (timeString) => {
        if (timeString.includes("s")) {
            const seconds = parseInt(timeString.replace("s", ""));
            return seconds / 60; // backend will convert to Date
        }
        if (timeString.includes("m")) {
            return parseInt(timeString.replace("m", ""));
        }
        return 1;
    };

    const handleStartStream = async () => {
        let creatorId = await AsyncStorage.getItem('userId');

        const biddingDuration = convertTimeToMinutes(selectedTime);

        if (!data.startingBid || isNaN(data.startingBid)) {
            ToastAndroid.show('Valid Starting Bid Required!', ToastAndroid.SHORT);
            return;
        }

        if (data.productId.length === 0) {
            ToastAndroid.show('Select at least one product!', ToastAndroid.SHORT);
            return;
        }

        if (!data.image) {
            ToastAndroid.show('Cover Image Required!', ToastAndroid.SHORT);
            return;
        }

        const formData = new FormData();

        formData.append("startingBid", Number(data.startingBid));
        formData.append("creatorId", creatorId);
        formData.append("biddingDuration", biddingDuration);
        formData.append("duration", biddingDuration);
        formData.append("mode", selectedTab?.toUpperCase());
        data.productId.forEach((id) => {
            formData.append("productId[]", id);
        });

        // formData.append("coverImage", {
        //     uri: data.image,
        //     name: "cover.jpg",
        //     type: "image/jpeg",
        // });
        if (data.image) {
            formData.append("image", {
                uri: data.image,
                name: "product.jpg",
                type: "image/jpeg",
            });
        }
        try {
            ToastAndroid.show('Creating Stream...', ToastAndroid.SHORT);

            const res = await axios.post(
                `${config.baseUrl}/stream/create`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (res?.data?.data) {
                ToastAndroid.show('Stream Created!', ToastAndroid.SHORT);

                await AsyncStorage.setItem('streamId', res.data.data._id);

                navigation.replace("CreatorStream", {
                    streamId: res.data.data.streamId,
                    isHost: true,
                });
            }

        } catch (error) {
            console.log("Error creating stream:", error?.response?.data || error.message);
            ToastAndroid.show('Failed to create stream', ToastAndroid.SHORT);
        }
    };
    useEffect(() => {
        fetchCategory();
        fetchProduct()
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.headerText}>LIVE listings</Text>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                    <Text style={styles.searchText}>Search</Text>
                </View>

                <ScrollView showsHorizontalScrollIndicator={false} horizontal style={styles.tabContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.activeTab]} onPress={() => setSelectedTab(tab)}>
                            <Text style={selectedTab === tab ? styles.activeTabText : styles.tabText}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity onPress={() => setIsStoreVisible(!isStoreVisible)} style={styles.viewStoreButton}>
                    <Text style={styles.viewStoreText}>Select Product For Auction</Text>
                </TouchableOpacity>

                {/* <Text style={styles.sectionHeader}>LIVE settings</Text>

                <TouchableOpacity onPress={togglePopup} style={styles.addPlatform}>
                    <Text style={{ color: "grey" }} >+ Add Platform</Text>
                </TouchableOpacity> */}

                <Text style={styles.sectionHeader}>Auction settings</Text>

                <TouchableOpacity onPress={pickImage} style={{ width: "100%", paddingVertical: 10, backgroundColor: data?.image ? "#FFA500" : "#1A1A1A", borderRadius: 5, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ color: "#fff" }}>{data?.image ? "Image Picked" : "Pick Stream Cover Image"}</Text>
                </TouchableOpacity>

                <TextInput defaultValue='1' onChangeText={(text) => setData({ ...data, startingBid: text })} keyboardType='numeric' placeholderTextColor={"grey"} placeholder='Starting Bid' style={{ borderRadius: 5, paddingVertical: 7, paddingHorizontal: 10, marginVertical: 10, backgroundColor: "#1A1A1A", color: "white" }} />
                <View style={styles.timeContainer}>
                    <Text style={styles.inputLabel}>Time</Text>
                    <ScrollView showsHorizontalScrollIndicator={false} horizontal contentContainerStyle={styles.timeOptionsContainer}>
                        {timeOptions.map((time) => (
                            <TouchableOpacity key={time} style={[styles.timeOption, selectedTime === time && styles.activeTimeOption]} onPress={() => setSelectedTime(time)}>
                                <Text style={[styles.timeOptionText, selectedTime !== time && styles.inActiveTimeOptionText]}>{time}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.suddenDeathContainer}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.inputLabel}>Sudden death</Text>
                        <Switch trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isSuddenDeathEnabled ? "#f5dd4b" : "#f4f3f4"} ios_backgroundColor="#3e3e3e" onValueChange={setIsSuddenDeathEnabled} value={isSuddenDeathEnabled} style={{ marginLeft: 10 }} />
                    </View>
                    <Text style={styles.suddenDeathDescription}>This means when you're down to 00:01 the last person to bid wins!</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleStartStream} style={styles.startAuctionButton}>
                        <Text style={styles.startAuctionText}>Start Stream</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={isPopupVisible} onRequestClose={togglePopup}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add platforms</Text>
                        <Text style={styles.modalSubtitle}>Broadcast through TUGM LIVE by connecting a platform</Text>

                        <View style={styles.platformIconsContainer}>
                            <TouchableOpacity onPress={() => { setIsPopupVisible(false); setIsSocialVisible(true) }} style={styles.platformIcon}>
                                <Image source={Insta} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setIsPopupVisible(false); setIsSocialVisible(true) }} style={styles.platformIcon}>
                                <Image source={Tiktok} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setIsPopupVisible(false); setIsSocialVisible(true) }} style={styles.platformIcon}>
                                <Image source={Youtub} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalHandle} />

                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={isSocialVisible} onRequestClose={() => setIsSocialVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add platforms</Text>
                        <Text style={styles.modalSubtitle}>Broadcast through TUGM LIVE by connecting a platform</Text>

                        <View style={styles.platformIconsContainer}>
                            <TouchableOpacity style={styles.platformIcon}>
                                <Image source={Insta} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.platformIcon}>
                                <Image source={Tiktok} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.platformIcon}>
                                <Image source={Youtub} style={styles.iconImage} resizeMode="contain" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.rtmoSettings}>
                            <Text style={styles.rtmoTitle}>RTMO settings</Text>

                            <View style={styles.inputContainerModal}>
                                <Text style={styles.inputLabelModal}>Stream URL *</Text>
                                <TextInput style={styles.inputModal} placeholder="http://www.zencorporation.com" placeholderTextColor={"grey"} />
                            </View>

                            <View style={styles.inputContainerModal}>
                                <Text style={styles.inputLabelModal}>Stream Key *</Text>
                                <TextInput style={styles.inputModal} placeholder="Required" placeholderTextColor={"grey"} />
                            </View>

                            <View style={styles.inputContainerModal}>
                                <Text style={styles.inputLabelModal}>Stream name *</Text>
                                <TextInput style={styles.inputModal} placeholder="Instagram" placeholderTextColor={"grey"} />
                            </View>

                            <View style={styles.advancedSettings}>
                                <Text style={styles.advancedSettingsTitle}>Stream authentication (Advanced settings)</Text>
                                <View style={styles.inputContainerModal}>
                                    <Text style={styles.inputLabelModal}>ID</Text>
                                    <TextInput style={styles.inputModal} />
                                </View>
                                <View style={styles.inputContainerModal}>
                                    <Text style={styles.inputLabelModal}>Password</Text>
                                    <TextInput style={styles.inputModal} secureTextEntry={true} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.buttonContainerModal}>
                            <TouchableOpacity onPress={() => setIsSocialVisible(false)} style={styles.cancelButtonModal}>
                                <Text style={styles.cancelTextModal}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsSocialVisible(false)} style={styles.saveButtonModal}>
                                <Text style={styles.saveTextModal}>Save</Text>
                            </TouchableOpacity>
                        </View>
                        {/* <View style={styles.modalHandle} /> */}

                    </View>
                </View>
            </Modal>

            {/* onRequestClose={() => setIsStoreVisible(false)} */}
            <Modal animationType="slide" transparent visible={isStoreVisible}>
                <Pressable
                    onPress={() => setIsStoreVisible(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'flex-end',
                    }}
                >
                    {/* This inner Pressable prevents closing when tapping inside */}
                    <Pressable style={{ maxHeight: '80%' }} onPress={() => { }}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{
                                backgroundColor: '#0c0b0bff',
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                padding: 20,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 16 }}>Live listings</Text>

                            <View
                                style={{
                                    backgroundColor: '#1A1A1A',
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 10,
                                    paddingVertical: 2,
                                    marginVertical: 10,
                                }}
                            >
                                <Ionicons name="search" size={20} color="gray" />
                                <TextInput placeholder="Search for products" placeholderTextColor="gray" />
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoryContainer}
                            >
                                {categories?.map((category) => (
                                    <TouchableOpacity
                                        key={category?._id}
                                        style={[
                                            styles.button,
                                            activeCategory === category?.category && styles.activeButton,
                                        ]}
                                        onPress={() => handleCategoryPress(category?.category)}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                activeCategory !== category?.category && styles.inActiveButtonText,
                                            ]}
                                        >
                                            {category?.category}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>My Store</Text>

                            {filteredProducts?.map((i) => (
                                <View
                                    key={i._id}
                                    style={{
                                        padding: 10,
                                        backgroundColor: '#1A1A1A',
                                        borderRadius: 10,
                                        marginVertical: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            borderBottomWidth: 2,
                                            borderBottomColor: '#494848',
                                            paddingBottom: 20,
                                        }}
                                    >
                                        <Image
                                            source={{ uri: i.images[0] }}
                                            style={{ width: 70, height: 70, borderRadius: 10 }}
                                        />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ color: '#fff', fontSize: 12 }}>{i.title}</Text>
                                            <Text style={{ color: '#c4c4c4', fontSize: 12, marginTop: 8 }}>
                                                QTY: {i?.stock}
                                            </Text>
                                            <Text style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>
                                                ${i.price}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            marginTop: 15,
                                        }}
                                    >
                                        <View>
                                            <Text style={{ color: '#fff', fontSize: 16, marginTop: 3 }}>
                                                ${i.price}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => {
                                                const alreadySelected = data.productId.includes(i._id);
                                                let updatedProducts;

                                                if (alreadySelected) {
                                                    updatedProducts = data.productId.filter((id) => id !== i._id);
                                                } else {
                                                    updatedProducts = [...data.productId, i._id];
                                                }

                                                setData({ ...data, productId: updatedProducts });
                                            }}
                                            style={{
                                                backgroundColor: data.productId.includes(i._id)
                                                    ? '#FFA500'
                                                    : '#fff',
                                                width: 120,
                                                borderWidth: 1,
                                                borderRadius: 25,
                                                padding: 10,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: data.productId.includes(i._id) ? '#fff' : '#000',
                                                }}
                                            >
                                                {data.productId.includes(i._id)
                                                    ? 'Selected'
                                                    : 'Select Product'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>


            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 70
    },
    headerText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchBar: {
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginBottom: 10
    },
    searchIcon: {
        marginRight: 10,
        color: "grey"
    },
    searchText: {
        color: "grey"
    },
    tabContainer: {
        flexDirection: "row",
        marginBottom: 20
    },
    tab: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "grey",
        marginRight: 10
    },
    activeTab: {
        backgroundColor: "orange",
        borderColor: "orange"
    },
    tabText: {
        color: "grey"
    },
    activeTabText: {
        color: "black"
    },
    viewStoreButton: {
        borderRadius: 5,
        padding: 10,
        alignItems: "center",
        marginBottom: 20,
        backgroundColor: "white",
        width: "100%"
    },
    viewStoreText: {
        color: "black"
    },
    sectionHeader: {
        color: "white",
        fontWeight: "bold",
        marginBottom: 10
    },
    inputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        backgroundColor: "#1A1A1A"
    },
    inputLabel: {
        color: "grey"
    },
    inputValue: {
        color: "white"
    },
    timeContainer: {
        marginBottom: 20
    },
    timeOptionsContainer: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
    timeOption: {
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: "#1A1A1A",
        marginTop: 10
    },
    activeTimeOption: {
        backgroundColor: "orange",
        borderColor: "orange"
    },
    timeOptionText: {
        color: "white"
    },
    inActiveTimeOptionText: {
        color: "white"
    },
    suddenDeathContainer: {
        padding: 10,
        marginBottom: 20
    },
    suddenDeathDescription: {
        color: "grey",
        marginTop: 10
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
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

    addPlatform: {
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        backgroundColor: "#1A1A1A"
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'white',
        borderRadius: 2.5,
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(43, 43, 43, 0.5)',
    },
    modalContent: {
        backgroundColor: '#000',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    modalContent2: {
        backgroundColor: '#000',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubtitle: {
        color: 'grey',
        marginBottom: 20,
    },
    platformIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 10,
    },
    platformIcon: {
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        padding: 6,
    },
    iconImage: {
        width: 30,
        height: 30,
    },
    buttonContainerModal: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 1
    },
    cancelButtonModal: {
        borderWidth: 1,
        borderColor: "grey",
        borderRadius: 20,
        padding: 10,
        width: "48%",
        alignItems: "center"
    },
    cancelTextModal: {
        color: "white"
    },
    saveButtonModal: {
        backgroundColor: "orange",
        borderRadius: 20,
        padding: 10,
        width: "48%",
        alignItems: "center",
        marginLeft: 15
    },
    saveTextModal: {
        color: "white"
    },
    rtmoSettings: {
        width: '100%',
        marginTop: 5,
    },
    rtmoTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    inputContainerModal: {
        marginBottom: 15,
    },
    inputLabelModal: {
        color: 'grey',
        marginBottom: 5,
    },
    inputModal: {
        backgroundColor: '#1A1A1A',
        color: "white",
        borderRadius: 8,
        padding: 10,
    },
    advancedSettings: {
        marginTop: 15,
    },
    advancedSettingsTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    categoryContainer: {
        flexDirection: 'row',
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

});

export default CreateStreamScreen;
