import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, ToastAndroid, Switch, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import BottomNavBar from '../components/BottomNav';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import axios from 'axios';
import config from "../config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/core';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { useDispatch } from 'react-redux';
import { clearCart } from '../redux/cartSlice';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const [data, setData] = useState({});
    const [image, setImage] = useState("");
    // const [image, setImage] = useState("https://randomuser.me/api/portraits/men/8.jpg");
    const [sellerMode, setSellerMode] = useState(false);
    const dispatch = useDispatch()
    const menuItems = [
        { link: "transaction_history", icon: <Feather name="repeat" size={20} color="white" />, text: 'Transaction' },
        { link: "MyOrders", icon: <Feather name="clock" size={20} color="white" />, text: 'History' },
    ];

    const fetchProfileInfo = async () => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            let res = await axios.get(`${config.baseUrl2}/account/single/${userId}`);
            if (res?.data) {
                setData(res?.data?.data);
                setSellerMode(res?.data?.data?.sellerMode);
                if (res?.data?.data?.profile) {
                    setImage(res?.data?.data?.profile);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const switchCreatorMode = async (value) => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            let res = await axios.put(`${config.baseUrl2}/account/switch/profile/${userId}`, { sellerMode: value });
            if (res?.data) {
                ToastAndroid.show('Mode Changed Successfully!', ToastAndroid.SHORT);
                setSellerMode(value);
                fetchProfileInfo();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const pickImage = async () => {
        const options = { mediaType: 'photo', quality: 0.5, includeBase64: false, };
        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
            }
            else if (response.error) {
                console.log('ImagePicker Error:', response.error);
            }
            else {
                const selectedImage = response.assets[0].uri;
                setImage(selectedImage);
                updateImage(selectedImage);
            }
        });
    };

    const updateImage = async (imageUri) => {
        try {
            let userId = await AsyncStorage.getItem('userId');
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                name: 'profile.jpg',
                type: 'image/jpeg',
            });

            let res = await axios.put(`${config.baseUrl2}/account/change/profile/${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res?.data) {
                ToastAndroid.show('Profile Image Updated!', ToastAndroid.SHORT);
                fetchProfileInfo();
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    const handleSubscribe = async () => {

        try {
            let paymentIntentRes = await axios.post(`${config.baseUrl2}/payment/create-intent`, { amount: 7 * 100, currency: "usd" });
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
                    console.log(paymentResponse)
                    if (paymentResponse.error) {
                        Alert.alert(paymentResponse?.error?.message)
                        return
                    }
                    else {
                        let userId = await AsyncStorage.getItem('userId');
                        axios.get(`${config.baseUrl2}/account/subscribe/${userId}`)
                        fetchProfileInfo()
                        ToastAndroid.show('Subscription Added!', ToastAndroid.SHORT);
                    }
                }

            }
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchProfileInfo();
    }, []);
    const logout = async () => {
        dispatch(clearCart());
        await AsyncStorage.removeItem('userId')
        navigation.navigate('Login');
    }
    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={pickImage}>
                    <Image source={{ uri: image }} style={styles.profileImage} />
                    <Ionicons name="camera" size={24} color="white" style={styles.cameraIcon} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.menu}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity onPress={() => navigation.navigate(item.link)} key={index} style={styles.menuItem}>
                        {item.icon}
                        <Text style={styles.menuText}>{item.text}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={() => navigation.navigate('MyOrders')} style={styles.menuItem}>
                    <Entypo name="shopping-cart" size={20} color="white" />
                    <Text style={styles.menuText}>Purchase History</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('chats')} style={styles.menuItem}>
                    <Feather name="message-square" size={20} color="white" />
                    <Text style={styles.menuText}>Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('support')} style={styles.menuItem}>
                    <Entypo name="help-with-circle" size={20} color="white" />
                    <Text style={styles.menuText}>Support</Text>
                </TouchableOpacity>


                <TouchableOpacity onPress={() => navigation.navigate('favourite')} style={styles.menuItem}>
                    <EvilIcons name="heart" size={25} color="white" />
                    <Text style={styles.menuText}>Favourite</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('promotion')} style={styles.menuItem}>
                    <Feather name="speaker" size={25} color="white" />
                    <Text style={styles.menuText}>Promotions & Coupons</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('shipments')} style={styles.menuItem}>
                    <Feather name="truck" size={20} color="white" />
                    <Text style={styles.menuText}>Shipments</Text>
                </TouchableOpacity>

                {
                    (sellerMode && data?.isSubscribed) && (

                        <TouchableOpacity onPress={() => navigation.navigate('SellerProducts')} style={styles.menuItem}>
                            <Feather name="shopping-bag" size={20} color="white" />
                            <Text style={styles.menuText}>My store</Text>
                        </TouchableOpacity>

                    )
                }

                {
                    (sellerMode && data?.isSubscribed) && (

                        <TouchableOpacity onPress={() => navigation.navigate('SellerOrders')} style={styles.menuItem}>
                            <FontAwesome name="buysellads" size={20} color="white" />
                            <Text style={styles.menuText}>My Orders</Text>
                        </TouchableOpacity>

                    )
                }

                {
                    !data?.isSubscribed && (

                        <TouchableOpacity onPress={handleSubscribe} style={styles.menuItem}>
                            <MaterialIcons name="payment" size={20} color="white" />
                            <Text style={styles.menuText}>Subscribe</Text>
                        </TouchableOpacity>

                    )
                }


                <View style={{ justifyContent: "space-between", flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#282828', paddingVertical: 10 }}>
                    <Text style={{ color: 'white', fontSize: 16, marginRight: 10 }}>Seller Mode</Text>
                    <Switch value={sellerMode} onValueChange={(value) => switchCreatorMode(value)} trackColor={{ false: '#767577', true: '#34D399' }} thumbColor={sellerMode ? '#10B981' : '#f4f3f4'} />
                </View>
                <TouchableOpacity onPress={() => logout()} style={styles.logoutButton}>
                    <AntDesign name="logout" size={20} color="#FF4500" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>


            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 30
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'gray',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#000',
        padding: 5,
        borderRadius: 15,
    },
    menu: {
        marginBottom: 50,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#282828',
    },
    menuText: {
        color: 'white',
        marginLeft: 20,
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#282828',
        marginBottom: 30
    },
    logoutText: {
        color: '#FF4500',
        marginLeft: 10,
        fontSize: 16,
    },
});

export default ProfileScreen;
