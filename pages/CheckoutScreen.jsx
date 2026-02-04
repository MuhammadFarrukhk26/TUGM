import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Modal, Pressable, Dimensions, TextInput, ToastAndroid, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import map_img from "../assets/product/map.png";
import visa_img from "../assets/product/visa.png";
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../config';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { clearCart } from '../redux/cartSlice';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { geocodeAddress } from './Shipment/helperfunctions';

const steps = ["Shipping", "Payment", "Review"];

const CheckoutScreen = () => {
    const dispatch = useDispatch();
    const isMapUpdate = useRef(false);
    const [region, setRegion] = useState({
        latitude: 24.8607,     // default Karachi
        longitude: 67.0011,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [marker, setMarker] = useState({
        latitude: 24.8607,
        longitude: 67.0011,
    });

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
                setMarker({ latitude, longitude });
            },
            error => console.log(error),
            { enableHighAccuracy: true }
        );
    };
    useEffect(() => {
        if (isAddressModalVisible) {
            getCurrentLocation();
        }
    }, [isAddressModalVisible]);
    const products = useSelector(state => state.cart.cartItems);
    useEffect(() => {
        // if (isMapUpdate.current) return;
        if (!customer_address || !city || !country) return;
        console.log('Geocoding for address:', { customer_address, city, state, zip, country });
        const timeout = setTimeout(async () => {
            try {
                setIsGeocoding(true);

                const fullAddress = `${customer_address}, ${city}, ${state}, ${zip}, ${country}`;
                const result = await geocodeAddress(fullAddress);
                console.log('Geocode result:', result);
                if (!result) return;

                setRegion(prev => ({
                    ...prev,
                    latitude: result.latitude,
                    longitude: result.longitude,
                }));

                setMarker({
                    latitude: result.latitude,
                    longitude: result.longitude,
                });
            } catch (e) {
                console.log('Geocode error:', e);
            } finally {
                setIsGeocoding(false);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [customer_address]);
    const mapRef = useRef(null);
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isAddressModalVisible, setAddressModalVisible] = useState(false);
    const [isPickupModalVisible, setPickupModalVisible] = useState(false);
    const [customer_address, setCustomer_address] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, SetZip] = useState("");
    const [pickup_station, Setpickup_station] = useState("")
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const total = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const formatDate = (date) =>
        date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
        });

    const today = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);
    const deliveryDateText = `Delivery Between ${formatDate(today)} and ${formatDate(twoDaysLater)}`;
    const shippingDateText = `${formatDate(today)} and ${formatDate(twoDaysLater)}`;

    const handleNext = async () => {
        console.log('Handle Next Called', currentStep);
        if (currentStep === 0 && !customer_address) {
            Alert.alert("Address Required", "Please add a customer address.");
            return;
        }
        if (currentStep === 0) {
            const missingFields = [];
            if (!city) missingFields.push("City");
            if (!country) missingFields.push("Country");
            if (!state) missingFields.push("State");
            if (!zip) missingFields.push("Zip Code");
            if (missingFields.length > 0) {
                Alert.alert("Incomplete Address", `Please fill in: ${missingFields.join(", ")}`);
                return;
            }
        }
        if (currentStep === 1 && !paymentMethod) {
            Alert.alert("Payment Method Required", "Please select a payment method.");
            return;
        }
        if (currentStep < steps.length - 1) {
            console.log('Current Step:', currentStep);
            setCurrentStep(currentStep + 1);
        }
        else {
            console.log('Last Step:', currentStep);
            let userId = await AsyncStorage.getItem('userId'); console.log()
            let paymentIntentRes = await axios.post(`${config.baseUrl}/payment/create-intent`, { amount: total * 100, currency: "usd" });
            if (!paymentIntentRes?.data?.clientSecret) {
                console.log(paymentIntentRes?.data, 'No Response')
                Alert.alert('Error', 'Failed to fetch payment intent');
                throw new Error("Failed to fetch payment intent");
            }
            let clientSecret = paymentIntentRes?.data?.clientSecret
            if (clientSecret) {
                const initResponse = await initPaymentSheet({ merchantDisplayName: "User", paymentIntentClientSecret: clientSecret })
                if (initResponse.error) {
                    Alert.alert('Payment Error', initResponse?.error?.message)
                    console.log(initResponse?.error, 'Init Error')
                    return
                }
                else {
                    const paymentResponse = await presentPaymentSheet()
                    if (paymentResponse.error) {
                        Alert.alert('Payment Error', paymentResponse?.error?.message)
                        console.log(paymentResponse?.error, 'Payment Error')
                        return
                    }
                    else {
                        try {
                            const orderPayload = { userId, pickup_station, customer_address, product: products, city, country, zip, state };
                            console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2));
                            let orderRes = await axios.post(`${config.baseUrl}/order/checkout`, orderPayload);
                            if (orderRes?.data) {
                                console.log(orderRes?.data, 'Order Success')
                                ToastAndroid.show('Order Placed!', ToastAndroid.SHORT);
                                dispatch(clearCart());
                                setShowSuccessModal(true);
                            }
                        } catch (error) {
                            console.log('Order Error Details:', {
                                message: error?.message,
                                status: error?.response?.status,
                                statusText: error?.response?.statusText,
                                data: error?.response?.data,
                                config: error?.config?.data
                            });
                            Alert.alert('Order Error', `Failed to place order: ${error?.response?.data?.message || error?.message || 'Please try again.'}`);
                        }
                    }
                }
            }
        }
    };
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}></TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close-outline" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );

    const renderSteps = () => (
        <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                    <View style={[styles.stepCircle, currentStep >= index && styles.stepCircleActive]}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, currentStep >= index && styles.stepTextActive]}>{step}</Text>
                </View>
            ))}
        </View>
    );

    const renderShippingStep = () => (
        <ScrollView style={styles.contentContainer}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Customer Address</Text>
                    <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                        <Text style={styles.linkText}>Add</Text>
                    </TouchableOpacity>
                </View>
                {customer_address && (
                    <View style={styles.addressCard}>
                        <Text style={styles.addressText}>{customer_address}</Text>
                    </View>
                )}
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pickup Station</Text>
                    <TouchableOpacity onPress={() => setPickupModalVisible(true)}>
                        <Text style={styles.linkText}>Add</Text>
                    </TouchableOpacity>
                </View>
                {pickup_station && (
                    <View style={styles.pickupCard}>
                        <Text style={styles.pickupTitle}>{pickup_station}</Text>
                    </View>
                )}
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shipment</Text>
                    <Text style={styles.shipmentDetails}>Fulfilled by TUGM</Text>
                </View>
                <Text style={styles.deliveryDate}>{deliveryDateText}</Text>
                {customer_address && <Text style={styles.shippingMethod}>{customer_address}</Text>}
            </View>
            {
                products.map((i) => (
                    <View key={i?._id} style={styles.productSummaryCard}>
                        <Image source={{ uri: i?.images[0] }} style={styles.productImage} />
                        <View style={styles.productSummaryDetails}>
                            <Text style={styles.productSummaryCategory}>{i?.categories[0]}</Text>
                            <Text style={styles.productSummaryName}>{i?.title}</Text>
                            <Text style={styles.productSummaryColor}>Color - {i?.colors[1]}</Text>
                        </View>
                        <View style={styles.productSummaryPrice}>
                            <Text style={styles.productSummaryItems}>{i?.quantity} items</Text>
                            <Text style={styles.productSummaryAmount}>${i?.price.toFixed(2)}</Text>
                        </View>
                    </View>
                ))
            }
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.goBackToCart}>
                <Text style={styles.goBackText}>Go to cart</Text>
            </TouchableOpacity>
            
        </ScrollView>
    );

    const renderPaymentStep = () => (
        <ScrollView style={styles.contentContainer}>
            <Text style={styles.paymentMethodTitle}>Choose a payment method</Text>
            <Text style={styles.paymentMethodSubtitle}>Please select a payment method most convenient to you.</Text>
            <View style={styles.paymentOptionsContainer}>
                <Pressable onPress={() => setPaymentMethod('credit_card')} style={styles.paymentOption}>
                    <Text style={styles.paymentOptionText}>Credit Card</Text>
                    <View style={styles.paymentOptionRight}>
                        <Image source={visa_img} style={styles.visaImage} />
                        <View style={[styles.radio, paymentMethod === 'credit_card' && styles.radioSelected]} />
                    </View>
                </Pressable>
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Customer Address</Text>
                    <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                        <Text style={styles.linkText}>Change</Text>
                    </TouchableOpacity>
                </View>
                {customer_address && (
                    <View>
                        <Text style={styles.addressText}>{customer_address}</Text>
                    </View>
                )}
            </View>
            <View style={styles.mapContainer}>
                {/* {<Image source={map_img} style={styles.mapImage} />} */}
                {isGeocoding && (
                    <Text style={{ color: '#888', marginBottom: 8 }}>
                        Updating location…
                    </Text>
                )}
                <MapView
                    style={styles.mapImage}
                    region={region}
                    showsUserLocation
                // onPress={async (e) => {
                //     isMapUpdate.current = true;

                //     const { latitude, longitude } = e.nativeEvent.coordinate;

                //     setMarker({ latitude, longitude });
                //     setRegion(prev => ({
                //         ...prev,
                //         latitude,
                //         longitude,
                //     }));

                //     setTimeout(() => {
                //         isMapUpdate.current = false;
                //     }, 400);
                // }}
                >
                    {marker && <Marker coordinate={marker} />}
                </MapView>
            </View>
        </ScrollView>
    );

    const renderReviewStep = () => (
        <ScrollView style={styles.contentContainer}>
            <Text style={styles.reviewInstruction}>Please confirm and submit your order</Text>
            <Text style={styles.reviewPolicy}>By clicking submit order, you agree to Terms Of Use and Privacy Policy.</Text>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
            </View>
            <View style={styles.summaryCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.summaryTitle}>Payment</Text>
                    <TouchableOpacity onPress={() => setCurrentStep(1)}>
                        <Text style={styles.linkText}>Edit</Text>
                    </TouchableOpacity>
                </View>
                {paymentMethod === 'credit_card' && (
                    <View style={styles.paymentDetails}>
                        <Image source={visa_img} style={styles.visaSmallImage} />
                        <Text style={styles.paymentText}>12****1121</Text>
                        <Text style={styles.paymentText}>01/26</Text>
                    </View>
                )}
                {paymentMethod === 'paypal' && (
                    <Text style={styles.paymentText}>PayPal account</Text>
                )}
            </View>
            <View style={styles.summaryCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.summaryTitle}>Shipping Address</Text>
                    <TouchableOpacity onPress={() => setCurrentStep(0)}>
                        <Text style={styles.linkText}>Edit</Text>
                    </TouchableOpacity>
                </View>
                {customer_address && (
                    <View style={styles.shippingDetails}>
                        <Text style={styles.shippingDetailLabel}>Name</Text>
                        <Text style={styles.shippingDetailValue}>{customer_address}</Text>
                    </View>
                )}
                {pickup_station && (
                    <View style={styles.shippingDetails}>
                        <Text style={styles.shippingDetailLabel}>Pickup Station</Text>
                        <Text style={styles.shippingDetailValue}>{pickup_station}</Text>
                    </View>
                )}
                {customer_address && (
                    <View style={styles.shippingDetails}>
                        <Text style={styles.shippingDetailLabel}>Delivery Between</Text>
                        <Text style={styles.shippingDetailValue}> {shippingDateText}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
    console.log("Marker coords:", marker);
    const MemoizedAddressModal = useMemo(() => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isAddressModalVisible}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add your address</Text>
                        <Pressable onPress={() => setAddressModalVisible(false)}>
                            <Ionicons name="close-outline" size={24} color="white" />
                        </Pressable>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#888" />
                        <TextInput
                            value={customer_address}
                            onChangeText={(text) => setCustomer_address(text)}
                            placeholder="washington"
                            placeholderTextColor="#ccc"
                            style={{ flex: 1, color: "#fff" }}
                        />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                        <TextInput
                            value={country}
                            onChangeText={(text) => setCountry(text)}
                            placeholder="Country"
                            placeholderTextColor="#ccc"
                            style={styles.input}
                        />
                        <TextInput
                            value={city}
                            onChangeText={(text) => setCity(text)}
                            placeholder="City"
                            placeholderTextColor="#ccc"
                            style={styles.input}
                        />
                        <TextInput
                            value={state}
                            onChangeText={(text) => setState(text)}
                            placeholder="State"
                            placeholderTextColor="#ccc"
                            style={[styles.input, { flex: 1, color: "#fff" }]}
                        />
                        <TextInput
                            value={zip}
                            onChangeText={(text) => SetZip(text)}
                            placeholder="Zip"
                            placeholderTextColor="#ccc"
                            style={[styles.input, { flex: 1, color: "#fff" }]}
                        />
                    </View>

                    {/* <Image
                        source={map_img}
                        style={{ width: Dimensions.get("screen").width - 45, marginBottom: 30 }}
                    /> */}
                    {isGeocoding && (
                        <Text style={{ color: '#888', marginBottom: 8 }}>
                            Updating location…
                        </Text>
                    )}
                    {/* <View>
                        <MapView
                            style={{
                                width: Dimensions.get("screen").width - 45,
                                height: 180,
                                borderRadius: 15,
                                marginBottom: 30,
                            }}
                            region={region}
                            initialRegion={region}
                            provider="google"
                            mapType="standard"
                            onPress={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                console.log("Map pressed at:", latitude, longitude);
                                setMarker({ latitude, longitude });
                                setRegion((prev) => ({ ...prev, latitude, longitude }));
                            }}
                        >
                            {marker && (
                                <Marker
                                    coordinate={marker}
                                    pinColor="red"
                                />
                            )}
                        </MapView>
                    </View> */}
                    {/* <View style={{ borderRadius: 15, overflow: "hidden" }}>
                        <MapView
                            provider="google"
                            style={{
                                width: Dimensions.get("screen").width - 45,
                                height: 180,
                            }}
                            initialRegion={region}
                            onPress={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                setMarker({ latitude, longitude });
                            }}
                        >
                            <Marker
                                key={`${marker.latitude}-${marker.longitude}`}
                                coordinate={marker}
                                pinColor="red"
                            />
                        </MapView>
                    </View> */}
                    <View style={{ borderRadius: 15, overflow: "hidden", marginBottom: 30 }}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={{
                                width: Dimensions.get("screen").width - 45,
                                height: 180,
                            }}
                            liteMode={true}
                            initialRegion={region}
                            showsUserLocation={true}
                            onPress={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;

                                setMarker({ latitude, longitude });

                                mapRef.current?.animateToRegion(
                                    {
                                        latitude,
                                        longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    },
                                    500
                                );
                            }}
                        >
                            <Marker
                                coordinate={{ latitude: 24.8607, longitude: 67.0011 }}
                                title="Selected Location"
                                description="Marker Working"
                            />
                        </MapView>
                    </View>
                    <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={[styles.nextButton, { marginBottom: 0 }]}>
                        <Text style={styles.nextButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    ), [
        isAddressModalVisible,
        customer_address,
        country,
        city,
        state,
        zip,
        region,
        marker,
        isGeocoding
    ]);;

    const MemoizedPickupModal = useMemo(() => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isPickupModalVisible}
            onRequestClose={() => setPickupModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Pickup Station</Text>
                        <Pressable onPress={() => setPickupModalVisible(false)}>
                            <Ionicons name="close-outline" size={24} color="white" />
                        </Pressable>
                    </View>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#888" />
                        <TextInput
                            value={pickup_station}
                            onChangeText={(text) => Setpickup_station(text)}
                            placeholderTextColor="#ccc"
                            placeholder="Search for location"
                            style={{ flex: 1, color: "#fff" }}
                        />
                    </View>
                    <TouchableOpacity onPress={() => setPickupModalVisible(false)} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save pickup station</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    ), [isPickupModalVisible, pickup_station]);

    const SuccessModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showSuccessModal}
            onRequestClose={() => setShowSuccessModal(false)}
        >
            <View style={{ flex: 1, height: "100%" }}>
                <View style={styles.successModalView}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark" size={30} color="black" />
                    </View>
                    <Text style={styles.successTitle}>Order Successfully</Text>
                    <Text style={styles.successText}>Get ready to enjoy the fruit of your purchase. Thanks for your purchase!</Text>
                    <View style={{ backgroundColor: "transparent", borderWidth: 1, borderColor: "#1B1B1B", margin: 30, padding: 20, borderRadius: 10, width: Dimensions.get("window").width }}>
                        <Text style={styles.summaryTitle}>Shipping Address</Text>
                        {customer_address && (
                            <View style={styles.shippingDetails}>
                                <Text style={styles.shippingDetailLabel}>Name</Text>
                                <Text style={styles.shippingDetailValue}>{customer_address}</Text>
                            </View>
                        )}
                        {pickup_station && (
                            <View style={styles.shippingDetails}>
                                <Text style={styles.shippingDetailLabel}>Pickup Station</Text>
                                <Text style={styles.shippingDetailValue}>{pickup_station}</Text>
                            </View>
                        )}
                        {customer_address && (
                            <View style={styles.shippingDetails}>
                                <Text style={styles.shippingDetailLabel}>Delivery Between</Text>
                                <Text style={styles.shippingDetailValue}>{shippingDateText}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => { setShowSuccessModal(false); navigation.navigate('Home') }} style={[styles.closeButton, { backgroundColor: "#1B1B1B", width: Dimensions.get("window").width }]}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderShippingStep();
            case 1:
                return renderPaymentStep();
            case 2:
                return renderReviewStep();
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderSteps()}
            {renderStepContent()}
            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextButtonText}>{currentStep === 2 ? 'Checkout' : 'Next'}</Text>
                </TouchableOpacity>
            </View>
            {MemoizedAddressModal}
            {MemoizedPickupModal}
            <SuccessModal />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#888',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#F28C28',
        borderColor: '#F28C28',
    },
    stepNumber: {
        color: '#fff',
    },
    stepText: {
        color: '#888',
    },
    stepTextActive: {
        color: 'white',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        backgroundColor: '#1C1C1E',
        padding: 15,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
    },
    linkText: {
        color: '#F28C28',
    },
    addressCard: {
        borderRadius: 10,
        marginTop: 10
    },
    addressText: {
        color: 'white',
    },
    pickupCard: {
    },
    pickupTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    pickupAddress: {
        color: '#888',
        fontSize: 12,
    },
    shipmentDetails: {
        color: '#888',
    },
    deliveryDate: {
        color: '#888',
        marginTop: 5,
    },
    shippingMethod: {
        color: 'white',
        fontWeight: 'bold',
        marginTop: 5,
    },
    productSummaryCard: {
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
    productSummaryDetails: {
        flex: 1,
    },
    productSummaryCategory: {
        color: '#888',
        fontSize: 12,
    },
    productSummaryName: {
        color: 'white',
        fontWeight: 'bold',
        marginVertical: 2,
    },
    productSummaryColor: {
        color: '#888',
        fontSize: 12,
    },
    productSummaryPrice: {
        alignItems: 'flex-end',
    },
    productSummaryItems: {
        color: '#888',
        fontSize: 12,
    },
    productSummaryAmount: {
        color: 'white',
        fontWeight: 'bold',
        marginTop: 5,
    },
    goBackToCart: {
        alignSelf: 'center',
        paddingVertical: 10,
        backgroundColor: "#1B1B1B",
        width: Dimensions.get("screen").width - 40,
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        borderRadius: 10
    },
    goBackText: {
        color: '#F28C28',
    },
    bottomBar: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        marginBottom: 10
    },
    nextButton: {
        backgroundColor: '#F28C28',
        borderRadius: 50,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 50
    },
    nextButtonText: {
        color: 'black',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: '#000',
    },
    modalView: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: "#fff",
        width: 180,
        marginVertical: 5,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
    },
    searchInput: {
        color: '#888',
        marginLeft: 10,
    },
    addressList: {
        maxHeight: 300,
    },
    addressOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    addressOptionText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addressOptionSubtitle: {
        color: '#888',
        fontSize: 12,
    },
    addressTextContainer: {
        marginLeft: 10,
    },
    paymentMethodTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    paymentMethodSubtitle: {
        color: '#888',
        marginBottom: 20,
    },
    paymentOptionsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 15,
        marginBottom: 20,
    },
    paymentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    paymentOptionText: {
        color: 'white',
        fontSize: 16,
    },
    paymentOptionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    paypalImage: {
        width: 60,
        height: 20,
        resizeMode: 'contain',
    },
    visaImage: {
        width: 80,
        height: 25,
        resizeMode: 'contain',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#888',
    },
    radioSelected: {
        backgroundColor: '#F28C28',
        borderColor: '#F28C28',
    },
    mapContainer: {
        height: 150,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
    },
    mapImage: {
        width: '100%',
        height: '100%',
        // resizeMode: 'cover',
    },
    reviewInstruction: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reviewPolicy: {
        color: '#888',
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: '#1e1e1e',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    summaryTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    totalLabel: {
        color: 'white',
        fontWeight: 'bold',
    },
    totalValue: {
        color: 'white',
        fontWeight: 'bold',
    },
    paymentDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    visaSmallImage: {
        width: 50,
        height: 20,
        resizeMode: 'contain',
    },
    paymentText: {
        color: 'white',
    },
    shippingDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    shippingDetailLabel: {
        color: '#888',
    },
    shippingDetailValue: {
        color: 'white',
    },
    locationHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    locationHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginRight: 10,
    },
    locationHeaderText: {
        color: 'white',
        marginRight: 5,
    },
    pickupOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    pickupOptionSelected: {
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        padding: 10,
    },
    pickupOptionTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    pickupOptionAddress: {
        color: '#888',
    },
    pickupOptionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pickupOptionPrice: {
        color: 'white',
        fontWeight: 'bold',
    },
    pickupRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#888',
    },
    pickupRadioSelected: {
        backgroundColor: '#F28C28',
        borderColor: '#F28C28',
    },
    saveButton: {
        backgroundColor: '#F28C28',
        borderRadius: 15,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
    },
    successModalView: {
        backgroundColor: '#000',
        height: "100%",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        alignItems: 'center',
        alignSelf: 'center',
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
    successTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    successText: {
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#F28C28',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 50,
        marginTop: 20,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
    },
});

export default CheckoutScreen;
