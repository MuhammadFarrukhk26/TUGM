import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import Ionicons from 'react-native-vector-icons/Ionicons';
import product_img from "../assets/product/main.png";
import axios from 'axios';
import config from '../config';

const RatingScreen = () => {
    const navigation = useNavigation();
    const [rating, setRating] = useState(0);
    const route = useRoute()
    const { orderDetails } = route.params || {};
    const [review, setReview] = useState('');
    const [name, setName] = useState('');

    const handleStarPress = (star) => {
        setRating(star);
    };

    const handleSubmit = async () => {
        // Handle submission logic here, e.g., send data to an API
        console.log('Submitted Review:', { rating, review, name });
        if (!rating) {
            alert("Please select rating");
            return;
        }

        if (!review.trim()) {
            alert("Please write review");
            return;
        }

        const productId = orderDetails?.productId?._id;

        const payload = {
            userId: orderDetails?.userId,
            orderId: orderDetails?._id,
            comment: review,
            name: name,
            rating: rating

        };
        console.log("Submitting review with payload:", payload);
        try {
            const res = await axios.post(`${config.baseUrl}/product/review/${productId}`, payload);

            console.log("Review added:", res.data);
            alert("Review submitted successfully");
            navigation.goBack();

        } catch (error) {
            console.error(
                "Add review error:",
                error?.response?.data || error.message
            );
            alert("Failed to submit review");
        }
        // After submission, you might want to navigate back or show a success message

    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back-outline" size={30} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Rating & Review</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.productCard}>
                    <Image source={{ uri: orderDetails?.productId?.images?.[0] }} style={styles.productImage} />
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

                <View style={styles.ratingCard}>
                    <Text style={styles.ratingPrompt}>Tap the stars to rate</Text>
                    <View style={styles.starContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                                <Ionicons
                                    name={rating >= star ? 'star' : 'star-outline'}
                                    size={40}
                                    color={rating >= star ? '#F8BD00' : '#373737'}
                                    style={styles.starIcon}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Detailed review</Text>
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="I really like the product, it's a very quality material."
                        placeholderTextColor="#888"
                        multiline
                        value={review}
                        onChangeText={setReview}
                    />
                    <Text style={styles.reviewLabel}>Your name</Text>
                    <TextInput
                        style={styles.nameInput}
                        placeholder="John Doe"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 80,
        marginBottom: 30,
    },
    backButton: {
        width: 30,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
    },
    placeholder: {
        width: 30,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#1B1B1B',
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
    ratingCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingPrompt: {
        color: '#888',
        marginBottom: 10,
    },
    starContainer: {
        flexDirection: 'row',
    },
    starIcon: {
        marginHorizontal: 5,
    },
    reviewSection: {
        marginBottom: 20,
    },
    reviewLabel: {
        color: '#888',
        marginBottom: 5,
    },
    reviewInput: {
        backgroundColor: '#1C1C1E',
        color: 'white',
        borderRadius: 10,
        padding: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    nameInput: {
        backgroundColor: '#1C1C1E',
        color: 'white',
        borderRadius: 10,
        padding: 15,
    },
    submitButton: {
        backgroundColor: '#F78E1B',
        borderRadius: 60,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitButtonText: {
        fontSize: 18,
    },
    closeButtonText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10
    },
});

export default RatingScreen;
