import { useNavigation, useRoute } from '@react-navigation/core';
import axios from 'axios';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, PermissionsAndroid } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import config from '../../config';
import RNFS from "react-native-fs";
import { Alert, Platform } from "react-native";
import { encode } from 'base64-arraybuffer';
import RNFetchBlob from 'rn-fetch-blob';

const ShipmentDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { shipment } = route.params;

    // const handlePrintShippingLabel = async () => {
    //     try {
    //         const url = `${config.baseUrl}/order/print/${shipment._id}`;
    //         const fileName = `shipment_${shipment._id}.pdf`;

    //         // Fetch PDF as arraybuffer
    //         const response = await axios.post(url, {}, { responseType: 'arraybuffer', });
    //         const base64Data = encode(response.data);
    //         console.log("Base64 Data Length:", response);
    //         if (Platform.OS === 'android') {
    //             const version = Platform.Version;

    //             // Android 11+ needs MANAGE_EXTERNAL_STORAGE or use app folder
    //             let hasPermission = true;

    //             if (version < 33) {
    //                 // Android <= 12
    //                 const granted = await PermissionsAndroid.request(
    //                     PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //                     {
    //                         title: 'Storage Permission Required',
    //                         message: 'App needs access to your storage to save the PDF',
    //                         buttonPositive: 'OK',
    //                     }
    //                 );
    //                 hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
    //             }

    //             if (!hasPermission) {
    //                 Alert.alert('Permission Denied', 'Cannot save PDF without storage permission');
    //                 return;
    //             }

    //             // Get directories
    //             const dirs = RNFetchBlob.fs.dirs;
    //             const path = `${dirs.DownloadDir}/${fileName}`; // Downloads folder

    //             // Save file
    //             await RNFetchBlob.fs.writeFile(path, base64Data, 'base64');

    //             // Show in Downloads app
    //             RNFetchBlob.android.addCompleteDownload({
    //                 title: fileName,
    //                 description: 'Shipment PDF',
    //                 mime: 'application/pdf',
    //                 path,
    //                 showNotification: true,
    //                 open: true,
    //             });

    //             Alert.alert('Success', `PDF saved to Downloads`);
    //             console.log('PDF saved at:', path);
    //         } else {
    //             // iOS: save to DocumentDir
    //             const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    //             await RNFS.writeFile(path, base64Data, 'base64');
    //             Alert.alert('Success', `PDF saved to Documents`);
    //             console.log('PDF saved at:', path);
    //         }
    //     } catch (err) {
    //         console.error(err);
    //         Alert.alert('Error', 'Failed to save PDF');
    //     }
    // };
    // const handlePrintShippingLabel = async () => {
    //     try {
    //         const url = `${config.baseUrl}/order/print/${shipment._id}`;
    //         const fileName = `shipment_${shipment._id}.pdf`;

    //         const response = await axios.post(url, {}, {
    //             responseType: "arraybuffer",
    //             timeout: 120000,
    //         });
    //         console.log(response)
    //         // const base64Data = RNFetchBlob.base64.encode(response.data);
    //         const base64Data = encode(response.data);
    //         const dirs = RNFetchBlob.fs.dirs;
    //         const path =
    //             Platform.OS === "android"
    //                 ? `${dirs.DownloadDir}/${fileName}`
    //                 : `${dirs.DocumentDir}/${fileName}`;

    //         await RNFetchBlob.fs.writeFile(path, base64Data, "base64");

    //         if (Platform.OS === "android") {
    //             RNFetchBlob.android.addCompleteDownload({
    //                 title: fileName,
    //                 description: "Shipment PDF",
    //                 mime: "application/pdf",
    //                 path,
    //                 showNotification: true,
    //             });
    //         }

    //         Alert.alert("Success", `PDF saved at: ${path}`);
    //         console.log("PDF saved at:", path);

    //     } catch (err) {
    //         console.log("PDF Download Error:", err?.message);
    //         console.log("Status:", err?.response?.status);
    //         Alert.alert("Error", "Failed to save PDF");
    //     }
    // };

    const handlePrintShippingLabel = async () => {
        try {
            const url = `${config.baseUrl}/order/print/${shipment._id}`;
            const fileName = `shipment_${shipment._id}.pdf`;

            const response = await axios.post(url, {}, {
                responseType: "arraybuffer",
                timeout: 120000,
            });
            console.log(response)
            // ✅ Proper ArrayBuffer → base64 conversion
            const base64Data = encode(response.data);
            console.log(base64Data)
            const dirs = RNFetchBlob.fs.dirs;
            console.log(dirs)
            const path =
                Platform.OS === "android"
                    ? `${dirs.DownloadDir}/${fileName}`
                    : `${dirs.DocumentDir}/${fileName}`;

            await RNFetchBlob.fs.writeFile(path, base64Data, "base64");

            if (Platform.OS === "android") {
                RNFetchBlob.android.addCompleteDownload({
                    title: fileName,
                    description: "Shipment PDF",
                    mime: "application/pdf",
                    path,
                    showNotification: true,
                });
            }

            Alert.alert("Success", `PDF saved at: ${path}`);
            console.log("PDF saved at:", path);

        } catch (err) {
            console.log("PDF Download Error:", err?.message);
            console.log("Status:", err?.response?.status);
            Alert.alert("Error", "Failed to save PDF");
        }
    };

    const handleTrackingLink = () => {
        if (!shipment.trackingId) return;
        const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.trackingId}`;
        Linking.openURL(trackingUrl).catch(err => console.error("Couldn't load page", err));
    };
    return (
        <ScrollView style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.tugmText}>TUGM</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <AntDesign name="close" size={24} color="#A0A0A0" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Text style={styles.shipmentsTitle}>Shipments</Text>
                <View>
                    <View style={[styles.deliveredBadge, { backgroundColor: "#FF6600" }]}>
                        <Text style={styles.itemCountText}>{shipment.quantity} Item</Text>
                    </View>
                    <Text style={styles.shipmentIdText}>#{shipment._id}</Text>
                    <View style={[styles.deliveredBadge, { backgroundColor: shipment.status === "delivered" ? "#28A745" : "#F78E1B" }]}>
                        <Text style={styles.deliveredText}>{shipment.status}</Text>
                    </View>
                </View>
            </View>

            {/* Order Information */}
            <View style={styles.section}>
                <Text style={styles.orderNumberText}>Order - #{shipment._id}</Text>
                <View style={styles.itemRow}>
                    <Text style={styles.itemNameText}>{shipment?.productId?.title}</Text>
                    <View style={styles.soldBadge}>
                        <Text style={styles.soldText}>{shipment?.quantity} QTY</Text>
                    </View>
                </View>
                <Text style={styles.itemDescriptionText}>{shipment?.productId?.description}</Text>
            </View>

            {/* Shipping Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shipping actions</Text>
                <Text style={styles.shippingLabel}>Ship to</Text>
                <Text style={styles.shippingAddress}>
                    {shipment.customer_address}, {shipment.city}, {shipment.state}, {shipment.country}
                </Text>

                {shipment.trackingId && (
                    <View style={styles.trackingRow}>
                        <Text style={styles.shippingLabel}>Tracking ID</Text>
                        <TouchableOpacity onPress={handleTrackingLink}>
                            <Text style={styles.trackingIdText}>{shipment.trackingId}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={handlePrintShippingLabel}>
                    <Feather name="printer" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Print Shipping Label</Text>
                </TouchableOpacity>
            </View>

            {/* Shipment Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shipment Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Shipment #</Text>
                    <Text style={[styles.detailValueBold, { color: "#FEEF06" }]}>{shipment._id}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order</Text>
                    <Text style={[styles.detailValueBold, { color: "#FEEF06" }]}>{shipment._id}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order date</Text>
                    <Text style={styles.detailValue}>{new Date(shipment.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dimension</Text>
                    <Text style={styles.detailValue}>{shipment.productId?.dimensions || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{shipment.productId?.weight ? `${shipment.productId.weight} oz` : "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Value</Text>
                    <Text style={styles.detailValue}>${shipment.total}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A', // Dark background
        paddingHorizontal: 16,
        paddingTop: 50, // To account for status bar/notch
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align items to the start for multi-line right content
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    tugmText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    shipmentsTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    itemCountBadge: {
        backgroundColor: '#FF6600', // Orange badge
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 60
    },
    itemCountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    shipmentIdText: {
        color: '#A0A0A0',
        fontSize: 12,
        marginBottom: 4,
    },
    deliveredBadge: {
        backgroundColor: '#28A745', // Green
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-end', // Ensure badge aligns right
    },
    deliveredText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: -10, // Adjust to position accurately relative to container
        right: -10, // Adjust to position accurately relative to container
        padding: 10, // Make it easier to tap
    },
    section: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    orderNumberText: {
        color: '#A0A0A0',
        fontSize: 14,
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemNameText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginRight: 10,
    },
    soldBadge: {
        backgroundColor: '#FF6600', // Orange
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    soldText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    itemDescriptionText: {
        color: '#A0A0A0',
        fontSize: 14,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    shippingLabel: {
        color: '#A0A0A0',
        fontSize: 14,
        marginBottom: 4,
    },
    shippingAddress: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 16,
    },
    trackingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    trackingIdText: {
        color: '#FEEF06', // Orange for link
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#F78E1B',
        borderRadius: 10,
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        color: '#A0A0A0',
        fontSize: 14,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    detailValueBold: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ShipmentDetailScreen;
