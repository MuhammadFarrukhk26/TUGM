import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../config';

const Shipments = () => {
    const shippingServiceImageUrl = 'https://www.ecommercebytes.com/wp-content/uploads/2017/06/USPS.jpg';
    const navigation = useNavigation();
    const [orders, setOrders] = useState([])


    const fetchProduct = async () => {
        let userId = await AsyncStorage.getItem('userId');
        try {
            let res = await axios.get(`${config.baseUrl}/order/seller/${userId}`)
            if (res?.data) {
                setOrders(res?.data?.data);
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchProduct()
    }, [])

    let sales = orders.reduce((acc, cur) => (acc + cur.total), 0)
    let sales_wihout = orders.filter(order => order.status !== "cancelled").reduce((acc, cur) => acc + cur.total, 0);
    let total_cancelled = orders.filter(order => order.status !== "cancelled");
    let total_delivered = orders.filter(order => order.status == "delivered");
    let total_ongoing = orders.filter(order => order.status == "ongoing");


    const getStatusStyle = (status) => {
        switch (status) {
            case 'delivered':
                return styles.statusDelivered;
            case 'ongoing':
                return styles.statusNeedsLabel;
            case 'Unfulfilled':
                return styles.statusUnfulfilled;
            case 'Shipping':
                return styles.statusShipping;
            case 'Pickup':
                return styles.statusPickup;
            case 'cancelled':
                return styles.statusCancelled;
            default:
                return {};
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text></Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Shipments</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                        <AntDesign name="close" size={24} color="#A0A0A0" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Section */}
            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Sales</Text>
                    <Text style={styles.summaryValue}>${sales}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Completed Earnings</Text>
                    <Text style={styles.summaryValue}>${sales_wihout}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Shipping Speed</Text>
                    <Text style={styles.summaryValue}>$4.99</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Items Sold</Text>
                    <Text style={styles.summaryValue}>{total_cancelled?.length}</Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryItemSpan]}>
                    <Text style={styles.summaryLabel}>Total Delivered</Text>
                    <Text style={styles.summaryValue}>{total_delivered.length}</Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryItemSpan]}>
                    <Text style={styles.summaryLabel}>Pending Delivery</Text>
                    <Text style={styles.summaryValue}>{total_ongoing?.length}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchIcon}>
                    <Feather name="search" size={20} color="#A0A0A0" />
                </View>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Username, order ID..."
                    placeholderTextColor="#A0A0A0"
                />
            </View>

            {/* Shipment List Items */}
            <ScrollView horizontal style={{ marginTop: 10 }}>
                <View style={{ minWidth: 1000 }}>
                    {/* Table Header */}
                    <View style={[styles.listItem, { backgroundColor: '#222' }]}>
                        <View style={{ width: 50 }}>
                            <Text style={styles.tableHeaderCell}>#</Text>
                        </View>
                        <View style={{ width: 120 }}>
                            <Text style={styles.tableHeaderCell}>Recipient</Text>
                        </View>
                        <View style={{ width: 100 }}>
                            <Text style={styles.tableHeaderCell}>Order Date</Text>
                        </View>
                        <View style={{ width: 60 }}>
                            <Text style={styles.tableHeaderCell}>Items</Text>
                        </View>
                        <View style={{ width: 80 }}>
                            <Text style={styles.tableHeaderCell}>Value</Text>
                        </View>
                        <View style={{ width: 80 }}>
                            <Text style={styles.tableHeaderCell}>Weight</Text>
                        </View>
                        <View style={{ width: 120 }}>
                            <Text style={styles.tableHeaderCell}>Dimensions</Text>
                        </View>
                        <View style={{ width: 120 }}>
                            <Text style={styles.tableHeaderCell}>Status</Text>
                        </View>
                        <View style={{ width: 200, marginLeft: 30 }}>
                            <Text style={styles.tableHeaderCell}>Tracking</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    <ScrollView style={{ maxHeight: 400 }}>
                        {orders.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.listItem}
                                onPress={() => {
                                    if (item.status == "ongoing") {
                                        navigation.navigate('shipment_detail', { shipment: item })
                                    }
                                }}
                            >
                                <View style={[styles.tableCell, { width: 50 }]}>
                                    <Text style={styles.tableCell}>{index + 1}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 120 }]}>
                                    <Text style={styles.tableCell}>{item.userId?.username}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 100 }]}>
                                    <Text style={styles.tableCell}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 60 }]}>
                                    <Text style={styles.tableCell}>{1}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 80 }]}>
                                    <Text style={styles.tableCell}>${item?.total}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 80 }]}>
                                    <Text style={styles.tableCell}>{item.productId?.weight} oz</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 120 }]}>
                                    <Text style={styles.tableCell}>{item.productId?.dimensions}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: 120 }]}>
                                    <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                                        <Text style={styles.statusBadgeText}>{item.status}</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, { width: 200, marginLeft: 30 }]}>
                                    {
                                        item?.shipmentPdfUrl ? (
                                            <View style={{ width: "100%", flexDirection: 'row', alignItems: 'center', }}>
                                                <Image source={{ uri: shippingServiceImageUrl }} style={styles.shippingServiceImage} />
                                                <Text style={styles.listItemTextSmall}>USPS GROUND ADVANTAGE</Text>
                                            </View>
                                        ) :
                                            <Text style={styles.listItemTextSmall}>-</Text>
                                    }
                                </View>
                            </TouchableOpacity>
                        ))}

                    </ScrollView>
                </View>
            </ScrollView>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A', // Dark background
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
        marginTop: 50
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    summaryItem: {
        width: '48%', // Approx half width for 2 columns on small screens
        marginBottom: 12,
    },
    summaryItemSpan: {
        width: '48%', // For the "Total Delivered" and "Pending Delivery"
    },
    summaryLabel: {
        color: '#A0A0A0',
        fontSize: 12,
        marginBottom: 4,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tabsContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
        maxHeight: 50

    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    tabButtonActive: {
        backgroundColor: '#FF6600', // Orange
    },
    tabButtonInactive: {
        backgroundColor: '#333333',
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    tabTextInactive: {
        color: '#A0A0A0',
        fontWeight: '600',
        fontSize: 13,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333333',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginVertical: 16,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    pageButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    pageButtonActive: {
        backgroundColor: '#FF6600',
    },
    pageButtonInactive: {
        backgroundColor: '#333333',
    },
    pageTextActive: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    pageTextInactive: {
        color: '#A0A0A0',
        fontSize: 13,
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
        backgroundColor: '#222222', // Slightly different background for header
    },
    listHeaderColCheckbox: {
        width: '10%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeaderColRecipient: {
        width: '30%',
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listHeaderColOrderDate: {
        width: '25%',
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listHeaderColItems: {
        width: '15%',
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listHeaderColMore: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItemsContainer: {
        flex: 1,
        paddingBottom: 50
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    listColRecipient: {
        width: '30%',
    },
    listColOrderDate: {
        width: '25%',
        color: '#FFFFFF',
        fontSize: 13,
    },
    listColItems: {
        width: '15%',
        color: '#FFFFFF',
        fontSize: 13,
    },
    listColStatus: {
        width: '20%',
    },
    listColTracking: {
        width: '40%', // Adjust width to accommodate image and text
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
    },
    listItemTextBold: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listItemTextSmall: {
        color: '#A0A0A0',
        fontSize: 11,
    },
    statusBadge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statusDelivered: {
        backgroundColor: '#28A745', // Green
    },
    statusNeedsLabel: {
        backgroundColor: '#007BFF', // Blue
    },
    statusUnfulfilled: {
        backgroundColor: '#FFC107', // Yellow
    },
    statusShipping: {
        backgroundColor: '#17A2B8', // Teal
    },
    statusPickup: {
        backgroundColor: '#6C757D', // Gray
    },
    statusCancelled: {
        backgroundColor: '#DC3545', // Red
    },
    shippingServiceImage: {
        width: 24, // Adjust size as needed
        height: 24,
        marginRight: 8,
        resizeMode: 'contain', // Ensure the image fits within the bounds
    },
    tableHeaderCell: {
        color: '#A0A0A0',
        fontWeight: 'bold',
        fontSize: 12,
        paddingVertical: 6,
    },

    tableCell: {
        color: '#FFFFFF',
        fontSize: 13,
        paddingVertical: 6,
    },

});

export default Shipments;
