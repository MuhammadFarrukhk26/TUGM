import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, ToastAndroid } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import Ionicons from 'react-native-vector-icons/Ionicons';
import product_img from "../assets/product/main.png";
import truck_img from "../assets/truck.png";
import axios from 'axios';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderTrackingScreen = () => {
    const navigation = useNavigation();
    const [orderDetails, setOrderDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const route = useRoute();
    // const [product, setProduct] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [isOrderSummaryCollapsed, setOrderSummaryCollapsed] = useState(false);
    const [orders, setOrders] = useState([]);
    const [isPackageHistoryVisible, setPackageHistoryVisible] = useState(false);
    const { orderId } = route.params;
    const toggleOrderSummary = () => {
        setOrderSummaryCollapsed(!isOrderSummaryCollapsed);
    };

    const togglePackageHistory = () => {
        setPackageHistoryVisible(!isPackageHistoryVisible);
    };
    const fetchProduct = async () => {
        let userId = await AsyncStorage.getItem('userId');
        try {
            let res = await axios.get(`${config.baseUrl}/order/user/${userId}`)
            if (res?.data) {
                console.log("orders", res?.data?.data)
                console.log("orderId", res?.data?.data.find(order => order._id === orderId))
                setOrders(res?.data?.data);
                setOrderDetails(res?.data?.data.find(order => order._id === orderId));
                setSelectedImage(res?.data?.data.find(order => order._id === orderId)?.productId?.images[0]);
            }
        }
        catch (error) {
            console.log(error)
        }
    }
    const markAsDelivered = async (orderId) => {

        try {
            console.log(orderId, 'orderId');
            const res = await axios.get(`${config.baseUrl}/order/delivered/${orderId}`);
            console.log(orderId, 'orderId');
            console.log(res.data.data, 'res.data.data');
            setOrderDetails(res.data.data);
            setSelectedImage(res.data.data?.images[0]);
            console.log(res.data.data, 'res.data.data');
        } catch (err) {
            console.log("Error fetching product:", err);
        } finally {
            setLoading(false);
        }
    };
    const cancelOrder = async (id) => {
        try {
            let res = await axios.put(`${config.baseUrl}/order/status/${id}`, { status: "cancelled" })
            if (res?.data) {
                fetchProduct();
                ToastAndroid.show('Order Cancelled!', ToastAndroid.SHORT);

            }
        }
        catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        fetchProduct()
        // markAsDelivered(orderId);
    }, [orderId])
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.placeholder} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close-outline" size={30} color="white" />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.statusContainer}>
                    {orderDetails?.status === "cancelled" ? (
                        <View style={styles.cancelIcon}>
                            <Ionicons name="close" size={30} color="black" />
                        </View>
                    ) : orderDetails?.status === "delivered" ? (
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark" size={30} color="black" />
                        </View>
                    ) : (
                        <Image source={truck_img} style={styles.truckImage} />
                    )}

                    <Text style={styles.statusTitle}>Order Status</Text>

                    <Text style={styles.statusSubtitle}>
                        {orderDetails?.status === "cancelled"
                            ? "Your order has been cancelled"
                            : orderDetails?.status === "delivered"
                                ? "Your package has been delivered"
                                : "Your package is on the way"}
                    </Text>
                </View>
                {/* {orderDetails?.productId */}
                <View style={styles.productCard}>
                    <Image source={{ uri: selectedImage }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <Text style={styles.productType}>{orderDetails?.productId?.categories?.join(", ")}</Text>
                        <Text style={styles.productName}>{orderDetails?.productId?.title}</Text>
                        <Text style={styles.productColor}>Color - Yellow</Text>
                    </View>
                    <View style={styles.priceInfo}>
                        <Text style={styles.priceItems}>{orderDetails?.productId?.stock} Items</Text>
                        <Text style={styles.priceText}>{orderDetails?.total}</Text>
                    </View>
                </View>
                {/* } */}
                <TouchableOpacity onPress={toggleOrderSummary} style={styles.collapsibleHeader}>
                    <Text style={styles.collapsibleTitle}>Order Summary</Text>
                    <Ionicons name={isOrderSummaryCollapsed ? "chevron-up-outline" : "chevron-down-outline"} size={24} color="white" />
                </TouchableOpacity>
                {!isOrderSummaryCollapsed && (
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Order ID</Text>
                            <Text style={styles.summaryValue}>{orderDetails?._id}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Shipping Address</Text>
                            <Text style={styles.summaryValue}>{orderDetails?.customer_address}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Tracking ID</Text>
                            <Text style={styles.summaryValue}>{orderDetails?._id}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Delivery Between</Text>
                            <Text style={styles.summaryValue}>{orderDetails?.createdAt}</Text>
                        </View>
                    </View>
                )}

                <TouchableOpacity onPress={togglePackageHistory} style={styles.collapsibleHeader}>
                    <Text style={styles.collapsibleTitle}>Payment Information</Text>
                    <Ionicons name="chevron-forward-outline" size={24} color="white" />
                </TouchableOpacity>

                {orderDetails?.status === "delivered" && <TouchableOpacity onPress={() => navigation.navigate("order_review", { orderDetails: orderDetails })} style={styles.trackOrderButton}>
                    <Text style={styles.trackOrderButtonText}> Review Order</Text>
                </TouchableOpacity>}
                {orderDetails?.status === "ongoing" && <TouchableOpacity style={styles.cancelOrderButton} onPress={() => cancelOrder(orderDetails?._id)}>
                    <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
                </TouchableOpacity>}
            </ScrollView>

            <TouchableOpacity onPress={togglePackageHistory} style={[styles.packageHistoryModal, isPackageHistoryVisible && styles.modalVisible]}>
                <TouchableOpacity style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Package History</Text>
                <View style={styles.historyTimeline}>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconActive}>
                            <Ionicons name="checkmark" size={16} color="#000" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Order Placed</Text>
                            <Text style={styles.historyDate}>8 Jun, 2025</Text>
                        </View>
                    </View>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconActive}>
                            <Ionicons name="checkmark" size={16} color="#000" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Pending Confirmation</Text>
                            <Text style={styles.historyDate}>8 Jun, 2025</Text>
                        </View>
                    </View>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconActive}>
                            <Ionicons name="checkmark" size={16} color="#000" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Waiting to be shipped</Text>
                            <Text style={styles.historyDate}>8 Jun, 2025</Text>
                        </View>
                    </View>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconActive}>
                            <Ionicons name="checkmark" size={16} color="#000" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Shipped</Text>
                            <Text style={styles.historyDate}>8 Jun, 2025</Text>
                        </View>
                    </View>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconInactive}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Available for Pickup</Text>
                            <Text style={styles.historyDate}>15 Jun and 17 Jun</Text>
                        </View>
                    </View>
                    <View style={styles.historyItem}>
                        <View style={styles.timelineIconInactive}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                        <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle}>Delivery Date</Text>
                            <Text style={styles.historyDate}>15 Jun and 17 Jun</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    placeholder: {
        width: 30,
    },
    closeButton: {

    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    truckImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    statusTitle: {
        color: 'white',
        fontSize: 20,
    },
    statusSubtitle: {
        color: '#888',
        fontSize: 16,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 15,
    },
    productInfo: {
        flex: 1,
    },
    productType: {
        color: '#888',
        fontSize: 12,
    },
    productName: {
        color: 'white',
        marginVertical: 2,
    },
    productColor: {
        color: '#888',
        fontSize: 12,
    },
    priceInfo: {
        alignItems: 'flex-end',
    },
    priceItems: {
        color: '#888',
        fontSize: 12,
    },
    priceText: {
        color: 'white',
        fontSize: 16,
        marginTop: 5,
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
    },
    collapsibleTitle: {
        color: 'white',
        fontSize: 16,
    },
    summaryContent: {
        backgroundColor: '#171717',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        color: '#888',
    },
    summaryValue: {
        color: 'white',
    },
    trackOrderButton: {
        backgroundColor: '#F28C28',
        borderRadius: 15,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    trackOrderButtonText: {
        color: 'white',
        fontSize: 18,
    },
    cancelOrderButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelOrderButtonText: {
        color: '#888',
        fontSize: 16,
    },
    packageHistoryModal: {
        position: 'absolute',
        bottom: -600, // Start off-screen
        left: 0,
        right: 0,
        backgroundColor: '#171717',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 50,
        transition: 'bottom 0.3s ease-in-out',
        // zIndex: 10,
    },
    modalVisible: {
        bottom: 0,
    },
    modalHandle: {
        width: 50,
        height: 5,
        backgroundColor: '#888',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        marginBottom: 20,
    },
    historyTimeline: {
        // Timeline styling here
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    timelineIconActive: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F28C28',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    timelineIconInactive: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#888',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    historyTextContainer: {
        flex: 1,
    },
    historyTitle: {
        color: 'white',
        fontSize: 16,
    },
    historyDate: {
        color: '#888',
        fontSize: 12,
    },
    successIcon: {
        backgroundColor: '#34C759',
        borderRadius: 50,
        width: 57.75,
        height: 57.75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f8d7da",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default OrderTrackingScreen;
