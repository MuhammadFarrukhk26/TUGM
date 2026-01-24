import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    ToastAndroid,
    Modal,
    TouchableWithoutFeedback
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'; // Import FontAwesome5 for specific icons
import { useNavigation, useRoute } from '@react-navigation/core';
import axios from 'axios';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const productSizesOptions = ['XS', 'S', 'M', 'L', 'XL', 'M Tall', 'L Tall', 'XL Tall', 'XXL'];
const listingOptions = ['In Stock', 'Few Unit Left', 'Out Of Stock'];
const shippingOptions = ['Pickup Available', 'State-wide Delivery Available', 'National Delivery Available', 'International Delivery Available'];
const productColorsOptions = [
    'Red', 'Yellow', 'Orange', 'Pink', 'White', 'Black', 'Brown', 'Magenta', 'Purple',
    'Blue', 'Cyan', 'Lime', 'Teal', 'Indigo', 'Violet', 'Gold', 'Silver', 'Maroon',
    'Olive', 'Navy', 'Coral', 'Salmon', 'Khaki', 'Turquoise', 'Lavender', 'Plum',
    'Chocolate', 'Crimson', 'Orchid', 'Tan', 'Beige', 'Mint', 'SkyBlue', 'Peach',
    'Amber', 'Emerald', 'SteelBlue', 'SlateGray', 'Rose'
];

const CreateProductScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const editProduct = route.params?.product;
    const isEdit = route.params?.isEdit || false;
    
    const [price, setPrice] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [productImages, setProductImages] = useState([]);
    const [selectedListing, setSelectedListing] = useState('');
    const [isListingModalVisible, setListingModalVisible] = useState(false);
    const [selectedProductSizes, setSelectedProductSizes] = useState([]);
    const [productTitle, setProductTitle] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [searchTags, setSearchTags] = useState([]);
    const [newSearchTag, setNewSearchTag] = useState('');
    const [minimumQuantity, setMinimumQuantity] = useState('');
    const [weight, setWeight] = useState('');
    const [dimension, setDimension] = useState('');
    const [shippingOption, setShippingOption] = useState('');
    const [isShippingModalVisible, setShippingModalVisible] = useState(false);
    const [selectedColors, setSelectedColors] = useState([]);

    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    // Load product data if editing
    useEffect(() => {
        if (isEdit && editProduct) {
            setProductTitle(editProduct.title || editProduct.name || '');
            setProductDescription(editProduct.description || '');
            setPrice(editProduct.price?.toString() || '');
            setProductImages(editProduct.images || []);
            setSelectedListing(editProduct.listing || '');
            setSelectedProductSizes(editProduct.sizes || []);
            setSelectedColors(editProduct.colors || []);
            setSearchTags(editProduct.tags || []);
            setMinimumQuantity(editProduct.minimumQuantity?.toString() || '');
            setWeight(editProduct.weight?.toString() || '');
            setDimension(editProduct.dimension || '');
            setShippingOption(editProduct.shipping || '');
            setCategories(editProduct.categories || []);
        }
    }, [isEdit, editProduct]);


    React.useEffect(() => {
        setIsStep1Valid(
            productImages.length > 0 &&
            selectedListing !== '' &&
            selectedProductSizes.length > 0
        );
    }, [productImages, selectedListing, selectedProductSizes]);

    React.useEffect(() => {
        setIsStep2Valid(
            productTitle.trim().length > 0 &&
            productDescription.trim().length > 0
        );
    }, [productTitle, productDescription]);


    const handleImagePick = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 5 - productImages.length, // Allow up to 5 images
        });
        if (result.didCancel) {
            console.log('User cancelled image picker');
        } else if (result.errorCode) {
            console.log('ImagePicker Error: ', result.errorCode);
        } else if (result.assets) {
            setProductImages(prevImages => [...prevImages, ...result.assets.map(asset => asset.uri)]);
        }
    };

    const handleRemoveImage = (uriToRemove) => {
        setProductImages(prevImages => prevImages.filter(uri => uri !== uriToRemove));
    };

    const toggleProductSize = (size) => {
        setSelectedProductSizes(prevSizes =>
            prevSizes.includes(size) ? prevSizes.filter(s => s !== size) : [...prevSizes, size]
        );
    };

    const toggleProductColor = (color) => {
        setSelectedColors(prevColors =>
            prevColors.includes(color) ? prevColors.filter(c => c !== color) : [...prevColors, color]
        );
    };

    const addCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const removeCategory = (categoryToRemove) => {
        setCategories(categories.filter(category => category !== categoryToRemove));
    };

    const addSearchTag = () => {
        if (newSearchTag.trim() && !searchTags.includes(newSearchTag.trim())) {
            setSearchTags([...searchTags, newSearchTag.trim()]);
            setNewSearchTag('');
        }
    };

    const removeSearchTag = (tagToRemove) => {
        setSearchTags(searchTags.filter(tag => tag !== tagToRemove));
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!isStep1Valid) {
                ToastAndroid.show('Please fill all required fields in Step 1.', ToastAndroid.SHORT);
                return;
            }
        } else if (currentStep === 2) {
            if (!isStep2Valid) {
                ToastAndroid.show('Please fill all required fields in Step 2.', ToastAndroid.SHORT);
                return;
            }
        }
        setCurrentStep(prevStep => prevStep + 1);
    };

    const handlePublish = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");

            if (isEdit && editProduct?._id) {
                // Update existing product - separate APIs for details and images
                
                // Step 1: Update product details
                const detailsFormData = new FormData();
                detailsFormData.append("userId", userId);
                detailsFormData.append("title", productTitle);
                detailsFormData.append("size", selectedProductSizes);
                detailsFormData.append("description", productDescription);
                detailsFormData.append("listing_type", selectedListing);
                detailsFormData.append("shipping_type", shippingOption);
                detailsFormData.append("categories", JSON.stringify(categories));
                detailsFormData.append("tags", JSON.stringify(searchTags));
                detailsFormData.append("colors", JSON.stringify(selectedColors));
                detailsFormData.append("weight", weight);
                detailsFormData.append("dimensions", dimension);
                detailsFormData.append("quantity", minimumQuantity);
                detailsFormData.append("price", price);
                detailsFormData.append("stock", selectedListing === "Out Of Stock" ? 0 : 1);

                const detailsResponse = await axios.put(
                    `${config.baseUrl}/product/update/${editProduct._id}`,
                    detailsFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (detailsResponse.status === 200) {
                    // Step 2: Upload new images separately
                    const newImages = productImages.filter(
                        uri => uri.startsWith('file://') || uri.startsWith('content://')
                    );

                    if (newImages.length > 0) {
                        for (let i = 0; i < newImages.length; i++) {
                            const imageFormData = new FormData();
                            imageFormData.append("image", {
                                uri: newImages[i],
                                type: "image/jpeg",
                                name: `product_${i}.jpg`
                            });

                            await axios.put(
                                `${config.baseUrl}/product/update/image/${editProduct._id}`,
                                imageFormData,
                                {
                                    headers: {
                                        "Content-Type": "multipart/form-data",
                                    },
                                }
                            );
                        }
                    }

                    ToastAndroid.show("Product Updated Successfully!", ToastAndroid.SHORT);
                    navigation.goBack();
                }
            } else {
                // Create new product
                const formData = new FormData();
                formData.append("userId", userId);
                formData.append("title", productTitle);
                formData.append("size", selectedProductSizes);
                formData.append("description", productDescription);
                formData.append("listing_type", selectedListing);
                formData.append("shipping_type", shippingOption);
                formData.append("categories", JSON.stringify(categories));
                formData.append("tags", JSON.stringify(searchTags));
                formData.append("colors", JSON.stringify(selectedColors));
                formData.append("weight", weight);
                formData.append("dimensions", dimension);
                formData.append("quantity", minimumQuantity);
                formData.append("price", price);
                formData.append("stock", selectedListing === "Out Of Stock" ? 0 : 1);

                // append multiple images
                productImages.forEach((uri, index) => {
                    formData.append("images", {
                        uri,
                        type: "image/jpeg",
                        name: `product_${index}.jpg`
                    });
                });

                const response = await axios.post(`${config.baseUrl}/product/create`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.status === 200) {
                    ToastAndroid.show("Product Published!", ToastAndroid.SHORT);
                    navigation.goBack();
                }
            }
        } catch (error) {
            console.log("Product error:", JSON.stringify(error));
            ToastAndroid.show(isEdit ? "Failed to update product" : "Failed to publish product", ToastAndroid.SHORT);
        }
    };


    const renderBottomModal = (isVisible, options, onSelect, selectedValue, type) => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={() => {
                if (type === 'listing') setListingModalVisible(false);
                else if (type === 'shipping') setShippingModalVisible(false);
            }}
        >
            <TouchableWithoutFeedback onPress={() => {
                if (type === 'listing') setListingModalVisible(false);
                else if (type === 'shipping') setShippingModalVisible(false);
            }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {options.map((option, index) => (
                            <TouchableOpacity key={index} style={styles.modalOption} onPress={() => { onSelect(option); if (type === 'listing') setListingModalVisible(false); else if (type === 'shipping') setShippingModalVisible(false); }}>
                                <Text style={styles.modalOptionText}>{option}</Text>
                                {type === 'listing' && selectedValue === option && (<FontAwesome5 name="check" size={15} color="#FFA500" />)}
                                {type === 'shipping' ? (
                                    <View style={styles.radioCircle}>
                                        {selectedValue === option && <View style={styles.selectedRadioFill} />}
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
            {/* Header Section */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }} />
                <Text style={styles.headerTitle}>Add new product</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Entypo size={25} name="cross" style={{ color: "#fff" }} />
                </TouchableOpacity>
            </View>

            {/* Progress Bar Section */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
                <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: "#FFA500" }} />
                <View style={{ flex: 1, height: 5, borderRadius: 100, backgroundColor: currentStep >= 2 ? "#FFA500" : "#8F8F93" }} />
                <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: currentStep >= 2 ? "#FFA500" : "#8F8F93" }} />
                <View style={{ flex: 1, height: 5, borderRadius: 100, backgroundColor: currentStep === 3 ? "#FFA500" : "#8F8F93" }} />
                <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: currentStep === 3 ? "#FFA500" : "#8F8F93" }} />
            </View>

            {/* STEP 1: Images, Listing, and Sizes */}
            {currentStep === 1 && (
                <View style={{ marginTop: 20 }}>
                    {productImages.length === 0 ? (
                        <TouchableOpacity style={styles.imageUploadCard} onPress={handleImagePick}>
                            <Text style={styles.imageUploadText}>Upload product image</Text>
                            <Feather name="image" size={25} color={"#8F8F93"} style={{ marginTop: 8 }} />
                            <Text style={styles.imageUploadSubText}>You can upload maximum of 5 images</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.uploadedImagesGrid}>
                            <TouchableOpacity 
                                onPress={handleImagePick}
                                style={styles.mainImageWrapper}
                            >
                                <Image source={{ uri: productImages[0] }} style={styles.mainUploadedImage} />
                                <TouchableOpacity 
                                    onPress={() => handleRemoveImage(productImages[0])} 
                                    style={[styles.removeImageButton, { top: 10, right: 10 }]}
                                >
                                    <FontAwesome5 name="times-circle" size={20} color="red" solid />
                                </TouchableOpacity>
                            </TouchableOpacity>
                            <View style={styles.thumbnailContainer}>
                                {productImages.filter((_, index) => index > 0).map((uri) => (
                                    <View key={uri} style={styles.uploadedImageWrapper}>
                                        <Image source={{ uri }} style={styles.uploadedImage} />
                                        <TouchableOpacity onPress={() => handleRemoveImage(uri)} style={styles.removeImageButton}>
                                            <FontAwesome5 name="times-circle" size={20} color="red" solid />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {productImages.length < 5 && (
                                    <TouchableOpacity style={styles.addImageButton} onPress={handleImagePick}>
                                        <FontAwesome5 name="plus" size={30} color="#666" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <Text style={styles.tipText}>Did you know? Buyers like to browse images that are clear, non-blurry and tells easily what your product is? Make your product image counts!</Text>

                    <Text style={styles.sectionTitle}>Select Listing</Text>
                    <TouchableOpacity style={styles.selectOptionButton} onPress={() => setListingModalVisible(true)}>
                        <Text style={styles.selectOptionText}>{selectedListing || 'In Stock'}</Text>
                        <MaterialIcons name="keyboard-arrow-right" size={25} color={"#fff"} />
                    </TouchableOpacity>
                    {renderBottomModal(isListingModalVisible, listingOptions, setSelectedListing, selectedListing, 'listing')}

                    {selectedListing === 'Few Unit Left' && <Text style={styles.listingStatusText}>Few Unit Left</Text>}
                    {selectedListing === 'Out Of Stock' && <Text style={styles.listingStatusText}>Out Of Stock</Text>}

                    <Text style={styles.sectionTitle}>Product Sizes</Text>
                    <View style={styles.sizeOptionsContainer}>
                        {productSizesOptions.map((i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.sizeOptionButton, selectedProductSizes.includes(i) && styles.sizeOptionButtonSelected]}
                                onPress={() => toggleProductSize(i)}
                            >
                                <Text style={[styles.sizeOptionText, selectedProductSizes.includes(i) && styles.sizeOptionTextSelected]}>{i}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* STEP 2: Title and Description */}
            {currentStep === 2 && (
                <View style={{ marginTop: 40 }}>
                    <Text style={styles.inputLabel}>Product Title</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Jacket Name"
                        placeholderTextColor="#666"
                        value={productTitle}
                        onChangeText={setProductTitle}
                    />

                    <Text style={styles.inputLabel}>Product description</Text>
                    <View style={styles.descriptionInputContainer}>
                        <View style={styles.descriptionToolbar}>
                            <Text style={styles.descriptionParagraph}>Paragraph</Text>
                            <View style={styles.descriptionIcons}>
                                <FontAwesome5 name="bold" size={16} color="#fff" style={styles.descriptionIcon} />
                                <FontAwesome5 name="italic" size={16} color="#fff" style={styles.descriptionIcon} />
                                <FontAwesome5 name="underline" size={16} color="#fff" style={styles.descriptionIcon} />
                                <FontAwesome5 name="align-left" size={16} color="#fff" style={styles.descriptionIcon} />
                                <FontAwesome5 name="list-ul" size={16} color="#fff" style={styles.descriptionIcon} />
                                <FontAwesome5 name="list-ol" size={16} color="#fff" style={styles.descriptionIcon} />
                            </View>
                        </View>
                        <TextInput
                            style={[styles.textInput, styles.descriptionTextInput]}
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={10}
                            value={productDescription}
                            onChangeText={setProductDescription}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            )}

            {/* STEP 3: Categories, Tags, and Shipping */}
            {currentStep === 3 && (
                <View style={{ marginTop: 40 }}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <View style={styles.tagInputContainer}>
                        {categories.map((category, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{category}</Text>
                                <TouchableOpacity onPress={() => removeCategory(category)} style={styles.tagCloseButton}>
                                    <FontAwesome5 name="times" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TextInput
                            style={styles.tagTextInput}
                            placeholderTextColor="#666"
                            value={newCategory}
                            onChangeText={setNewCategory}
                            onSubmitEditing={addCategory}
                            returnKeyType="done"
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Search Tags</Text>
                    <View style={styles.tagInputContainer}>
                        {searchTags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                                <TouchableOpacity onPress={() => removeSearchTag(tag)} style={styles.tagCloseButton}>
                                    <FontAwesome5 name="times" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TextInput
                            style={styles.tagTextInput}
                            placeholder="Tag"
                            placeholderTextColor="#666"
                            value={newSearchTag}
                            onChangeText={setNewSearchTag}
                            onSubmitEditing={addSearchTag}
                            returnKeyType="done"
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Minimum Quantity</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="5"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={minimumQuantity}
                        onChangeText={setMinimumQuantity}
                    />

                    <Text style={styles.sectionTitle}>Weight</Text>
                    <View style={styles.inlineInputs}>
                        <TextInput
                            style={[styles.textInput, styles.inlineInputHalf]}
                            placeholder="7"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                        />
                        <Text style={styles.inlineInputLabel}>oz</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Dimension</Text>
                    <View style={styles.inlineInputs}>
                        <TextInput
                            style={[styles.textInput, styles.inlineInputHalf]}
                            placeholder="12 × 12 × 12"
                            placeholderTextColor="#666"
                            value={dimension}
                            onChangeText={setDimension}
                        />
                        <Text style={styles.inlineInputLabel}>in</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Shipping</Text>
                    <TouchableOpacity style={styles.selectOptionButton} onPress={() => setShippingModalVisible(true)}>
                        <Text style={styles.selectOptionText}>{shippingOption || 'Select option'}</Text>
                        <MaterialIcons name="keyboard-arrow-right" size={25} color={"#fff"} />
                    </TouchableOpacity>
                    {renderBottomModal(isShippingModalVisible, shippingOptions, setShippingOption, shippingOption, 'shipping')}

                    <Text style={styles.sectionTitle}>Product color</Text>
                    <View style={styles.colorOptionsContainer}>
                        {productColorsOptions.map((color) => {
                            const colorMap = {
                                'Red': '#FF0000',
                                'Yellow': '#FFFF00',
                                'Orange': '#FFA500',
                                'Pink': '#FFC0CB',
                                'White': '#FFFFFF',
                                'Black': '#000000',
                                'Brown': '#A52A2A',
                                'Magenta': '#FF00FF',
                                'Purple': '#800080',
                                'Blue': '#0000FF',
                                'Cyan': '#00FFFF',
                                'Lime': '#00FF00',
                                'Teal': '#008080',
                                'Indigo': '#4B0082',
                                'Violet': '#EE82EE',
                                'Gold': '#FFD700',
                                'Silver': '#C0C0C0',
                                'Maroon': '#800000',
                                'Olive': '#808000',
                                'Navy': '#000080',
                                'Coral': '#FF7F50',
                                'Salmon': '#FA8072',
                                'Khaki': '#F0E68C',
                                'Turquoise': '#40E0D0',
                                'Lavender': '#E6E6FA',
                                'Plum': '#DDA0DD',
                                'Chocolate': '#D2691E',
                                'Crimson': '#DC143C',
                                'Orchid': '#DA70D6',
                                'Tan': '#D2B48C',
                                'Beige': '#F5F5DC',
                                'Mint': '#98FF98',
                                'SkyBlue': '#87CEEB',
                                'Peach': '#FFDAB9',
                                'Amber': '#FFBF00',
                                'Emerald': '#50C878',
                                'SteelBlue': '#4682B4',
                                'SlateGray': '#708090',
                                'Rose': '#FF007F',
                            };
                            const bgColor = colorMap[color] || '#333';
                            const isSelected = selectedColors.includes(color);
                            
                            return (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOptionButton,
                                        {
                                            backgroundColor: isSelected ? bgColor : '#171717',
                                            borderColor: isSelected ? bgColor : '#333',
                                            borderWidth: isSelected ? 3 : 1,
                                        }
                                    ]}
                                    onPress={() => toggleProductColor(color)}
                                >
                                    <Text style={[
                                        styles.colorOptionText,
                                        {
                                            color: isSelected && (color === 'White' || color === 'Yellow' || color === 'Cyan' || color === 'Lime' || color === 'Lavender' || color === 'Khaki' || color === 'Beige' || color === 'Mint' || color === 'SkyBlue' || color === 'Peach' || color === 'Gold' || color === 'Silver' || color === 'Tan') ? '#000' : isSelected ? '#FFF' : '#fff',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                        }
                                    ]}>
                                        {color}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionTitle}>Price</Text>
                    <TextInput style={styles.textInput} placeholder="100" placeholderTextColor="#666" keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
            )}

            {/* Navigation Buttons */}
            {currentStep < 3 ? (
                <TouchableOpacity
                    style={[styles.bottomButton, (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid) ? styles.buttonDisabled : styles.buttonEnabled]}
                    onPress={handleNext}
                    disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
                >
                    <Text style={styles.bottomButtonText}>Next</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.bottomButton, !(categories.length > 0 && searchTags.length > 0 && minimumQuantity && weight && dimension && shippingOption && selectedColors.length > 0) ? styles.buttonDisabled : styles.buttonEnabled]}
                    onPress={handlePublish}
                    disabled={!(categories.length > 0 && searchTags.length > 0 && minimumQuantity && weight && dimension && shippingOption && selectedColors.length > 0)}
                >
                    <Text style={styles.bottomButtonText}>Publish</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
    // return (
    //     <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
    //         {/* Header */}
    //         <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    //             <View style={{ flex: 1 }}></View> {/* Spacer to push title to center */}
    //             <Text style={styles.headerTitle}>Add new product</Text>
    //             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
    //                 <Entypo size={25} name="cross" style={{ color: "#fff" }} />
    //             </TouchableOpacity>
    //         </View>

    //         {/* PROGRESS BAR */}
    //         <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>

    //             <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: "#FFA500" }}></View>

    //             <View style={{ flex: 1, height: 5, borderRadius: 100, backgroundColor: currentStep >= 2 ? "#FFA500" : "#8F8F93" }}></View>

    //             <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: currentStep >= 2 ? "#FFA500" : "#8F8F93" }}></View>

    //             <View style={{ flex: 1, height: 5, borderRadius: 100, backgroundColor: currentStep === 3 ? "#FFA500" : "#8F8F93" }}></View>

    //             <View style={{ width: 16, height: 16, borderRadius: 100, backgroundColor: currentStep === 3 ? "#FFA500" : "#8F8F93" }}></View>

    //         </View>

    //         {currentStep === 1 && (
    //             <View style={{ marginTop: 20 }}>
    //                 {productImages.length === 0 ? (
    //                     <TouchableOpacity style={styles.imageUploadCard} onPress={handleImagePick}>
    //                         <Text style={styles.imageUploadText}>Upload product image</Text>
    //                         <Feather name="image" size={25} color={"#8F8F93"} style={{ marginTop: 8 }} />
    //                         <Text style={styles.imageUploadSubText}>You can upload maximum of 5 images</Text>
    //                     </TouchableOpacity>
    //                 ) : (
    //                     <View style={styles.uploadedImagesGrid}>

    //                         <Image source={{ uri: productImages[0] }} style={[styles.mainUploadedImage]} />
    //                         <View style={styles.thumbnailContainer}>
    //                             {productImages.map((uri, index) => (
    //                                 index > 0 && (
    //                                     <View key={index} style={styles.uploadedImageWrapper}>
    //                                         <Image source={{ uri: uri }} style={styles.uploadedImage} />
    //                                         <TouchableOpacity onPress={() => handleRemoveImage(uri)} style={styles.removeImageButton}>
    //                                             <FontAwesome5 name="times-circle" size={20} color="red" solid />
    //                                         </TouchableOpacity>
    //                                     </View>
    //                                 )
    //                             ))}
    //                             {productImages.length < 5 && (
    //                                 <TouchableOpacity style={styles.addImageButton} onPress={handleImagePick}>
    //                                     <FontAwesome5 name="plus" size={30} color="#666" />
    //                                 </TouchableOpacity>
    //                             )}
    //                         </View>
    //                     </View>
    //                 )}

    //                 <Text style={styles.tipText}>Did you know? Buyers like to browse images that are clear, non-blurry and tells easily what your product is? Make your product image counts!</Text>

    //                 <Text style={styles.sectionTitle}>Select Listing</Text>
    //                 <TouchableOpacity
    //                     style={styles.selectOptionButton}
    //                     onPress={() => setListingModalVisible(true)}
    //                 >
    //                     <Text style={styles.selectOptionText}>{selectedListing || 'In Stock'}</Text>
    //                     <MaterialIcons name="keyboard-arrow-right" size={25} color={"#fff"} />
    //                 </TouchableOpacity>
    //                 {renderBottomModal(isListingModalVisible, listingOptions, setSelectedListing, selectedListing, 'listing')}

    //                 {selectedListing === 'Few Unit Left' && (
    //                     <Text style={styles.listingStatusText}>Few Unit Left</Text>
    //                 )}
    //                 {selectedListing === 'Out Of Stock' && (
    //                     <Text style={styles.listingStatusText}>Out Of Stock</Text>
    //                 )}


    //                 <Text style={styles.sectionTitle}>Product Sizes</Text>
    //                 <View style={styles.sizeOptionsContainer}>
    //                     {productSizesOptions.map((i) => (
    //                         <TouchableOpacity
    //                             key={i}
    //                             style={[
    //                                 styles.sizeOptionButton,
    //                                 selectedProductSizes.includes(i) && styles.sizeOptionButtonSelected
    //                             ]}
    //                             onPress={() => toggleProductSize(i)}
    //                         >
    //                             <Text
    //                                 style={[
    //                                     styles.sizeOptionText,
    //                                     selectedProductSizes.includes(i) && styles.sizeOptionTextSelected
    //                                 ]}
    //                             >{i}</Text>
    //                         </TouchableOpacity>
    //                     ))}
    //                 </View>
    //             </View>
    //         )}

    //         {currentStep === 2 && (
    //             <View style={{ marginTop: 40 }}>
    //                 <Text style={styles.inputLabel}>Product Title</Text>
    //                 <TextInput
    //                     style={styles.textInput}
    //                     placeholder="Jacket Name"
    //                     placeholderTextColor="#666"
    //                     value={productTitle}
    //                     onChangeText={setProductTitle}
    //                 />

    //                 <Text style={styles.inputLabel}>Product description</Text>
    //                 <View style={styles.descriptionInputContainer}>
    //                     <View style={styles.descriptionToolbar}>
    //                         <Text style={styles.descriptionParagraph}>Paragraph</Text>
    //                         <View style={styles.descriptionIcons}>
    //                             <FontAwesome5 name="bold" size={16} color="#fff" style={styles.descriptionIcon} />
    //                             <FontAwesome5 name="italic" size={16} color="#fff" style={styles.descriptionIcon} />
    //                             <FontAwesome5 name="underline" size={16} color="#fff" style={styles.descriptionIcon} />
    //                             <FontAwesome5 name="align-left" size={16} color="#fff" style={styles.descriptionIcon} />
    //                             <FontAwesome5 name="list-ul" size={16} color="#fff" style={styles.descriptionIcon} />
    //                             <FontAwesome5 name="list-ol" size={16} color="#fff" style={styles.descriptionIcon} />
    //                         </View>
    //                     </View>
    //                     <TextInput
    //                         style={[styles.textInput, styles.descriptionTextInput]}
    //                         placeholder=""
    //                         placeholderTextColor="#666"
    //                         multiline
    //                         numberOfLines={10}
    //                         value={productDescription}
    //                         onChangeText={setProductDescription}
    //                         textAlignVertical="top"
    //                     />
    //                 </View>
    //             </View>
    //         )}

    //         {currentStep === 3 && (
    //             <View style={{ marginTop: 40 }}>
    //                 <Text style={styles.sectionTitle}>Categories</Text>
    //                 <View style={styles.tagInputContainer}>
    //                     {categories.map((category, index) => (
    //                         <View key={index} style={styles.tag}>
    //                             <Text style={styles.tagText}>{category}</Text>
    //                             <TouchableOpacity onPress={() => removeCategory(category)} style={styles.tagCloseButton}>
    //                                 <FontAwesome5 name="times" size={12} color="#fff" />
    //                             </TouchableOpacity>
    //                         </View>
    //                     ))}
    //                     <TextInput
    //                         style={styles.tagTextInput}
    //                         placeholderTextColor="#666"
    //                         value={newCategory}
    //                         onChangeText={setNewCategory}
    //                         onSubmitEditing={addCategory}
    //                         returnKeyType="done"
    //                     />
    //                 </View>

    //                 <Text style={styles.sectionTitle}>Search Tags</Text>
    //                 <View style={styles.tagInputContainer}>
    //                     {searchTags.map((tag, index) => (
    //                         <View key={index} style={styles.tag}>
    //                             <Text style={styles.tagText}>{tag}</Text>
    //                             <TouchableOpacity onPress={() => removeSearchTag(tag)} style={styles.tagCloseButton}>
    //                                 <FontAwesome5 name="times" size={12} color="#fff" />
    //                             </TouchableOpacity>
    //                         </View>
    //                     ))}
    //                     <TextInput
    //                         style={styles.tagTextInput}
    //                         placeholder="Tag"
    //                         placeholderTextColor="#666"
    //                         value={newSearchTag}
    //                         onChangeText={setNewSearchTag}
    //                         onSubmitEditing={addSearchTag}
    //                         returnKeyType="done"
    //                     />
    //                 </View>

    //                 <Text style={styles.sectionTitle}>Minimum Quantity</Text>
    //                 <TextInput
    //                     style={styles.textInput}
    //                     placeholder="5"
    //                     placeholderTextColor="#666"
    //                     keyboardType="numeric"
    //                     value={minimumQuantity}
    //                     onChangeText={setMinimumQuantity}
    //                 />

    //                 <Text style={styles.sectionTitle}>Weight</Text>
    //                 <View style={styles.inlineInputs}>
    //                     <TextInput
    //                         style={[styles.textInput, styles.inlineInputHalf]}
    //                         placeholder="7"
    //                         placeholderTextColor="#666"
    //                         keyboardType="numeric"
    //                         value={weight}
    //                         onChangeText={setWeight}
    //                     />
    //                     <Text style={styles.inlineInputLabel}>oz</Text>
    //                 </View>

    //                 <Text style={styles.sectionTitle}>Dimension</Text>
    //                 <View style={styles.inlineInputs}>
    //                     <TextInput
    //                         style={[styles.textInput, styles.inlineInputHalf]}
    //                         placeholder="12 × 12 × 12"
    //                         placeholderTextColor="#666"
    //                         value={dimension}
    //                         onChangeText={setDimension}
    //                     />
    //                     <Text style={styles.inlineInputLabel}>in</Text>
    //                 </View>

    //                 <Text style={styles.sectionTitle}>Shipping</Text>
    //                 <TouchableOpacity
    //                     style={styles.selectOptionButton}
    //                     onPress={() => setShippingModalVisible(true)}
    //                 >
    //                     <Text style={styles.selectOptionText}>{shippingOption || 'Select option'}</Text>
    //                     <MaterialIcons name="keyboard-arrow-right" size={25} color={"#fff"} />
    //                 </TouchableOpacity>
    //                 {renderBottomModal(isShippingModalVisible, shippingOptions, setShippingOption, shippingOption, 'shipping')}

    //                 <Text style={styles.sectionTitle}>Product color</Text>
    //                 <View style={styles.colorOptionsContainer}>
    //                     {productColorsOptions.map((color) => (
    //                         <TouchableOpacity
    //                             key={color}
    //                             style={[
    //                                 styles.colorOptionButton,
    //                                 { backgroundColor: color.toLowerCase() },
    //                                 selectedColors.includes(color) && styles.colorOptionButtonSelected,
    //                             ]}
    //                             onPress={() => toggleProductColor(color)}
    //                         >
    //                             <Text style={{color:"black"}}
    //                             >
    //                                 {color}
    //                             </Text>
    //                         </TouchableOpacity>
    //                     ))}
    //                 </View>

    //                 <Text style={styles.sectionTitle}>Price</Text>
    //                 <TextInput style={styles.textInput} placeholder="100" placeholderTextColor="#666" keyboardType="numeric" value={price} onChangeText={setPrice} />
    //             </View>
    //         )}

    //         {/* Dynamic Next/Publish Button */}
    //         {currentStep < 3 && (
    //             <TouchableOpacity
    //                 style={[
    //                     styles.bottomButton,
    //                     (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid) ? styles.buttonDisabled : styles.buttonEnabled
    //                 ]}
    //                 onPress={handleNext}
    //                 disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
    //             >
    //                 <Text style={styles.bottomButtonText}>Next</Text>
    //             </TouchableOpacity>
    //         )}

    //         {currentStep === 3 && (
    //             <TouchableOpacity
    //                 style={[
    //                     styles.bottomButton,
    //                     !(categories.length > 0 && searchTags.length > 0 && minimumQuantity.trim() && weight.trim() && dimension.trim() && shippingOption && selectedColors.length > 0) ? styles.buttonDisabled : styles.buttonEnabled
    //                 ]}
    //                 onPress={handlePublish}
    //                 disabled={!(categories.length > 0 && searchTags.length > 0 && minimumQuantity.trim() && weight.trim() && dimension.trim() && shippingOption && selectedColors.length > 0)}
    //             >
    //                 <Text style={styles.bottomButtonText}>Publish</Text>
    //             </TouchableOpacity>
    //         )}

    //     </ScrollView>
    // );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        paddingTop: 70,
        paddingBottom: 70,
        paddingHorizontal: 30,
        minHeight: "100%"
    },
    headerTitle: {
        color: "#fff",
        fontSize: 19,
        fontWeight: 'bold', // Added bold for title
        textAlign: 'center',
        flex: 2, // Allow title to take more space
    },
    closeButton: {
        flex: 1, // To position it right
        alignItems: 'flex-end',
    },
    progressBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        justifyContent: 'center', // Center the progress bar
        width: '100%', // Ensure it takes full width
    },
    progressBarDot: {
        width: 10, // Adjusted size
        height: 10, // Adjusted size
        borderRadius: 5,
        marginHorizontal: 5, // Spacing between dots
    },
    progressBarDotActive: {
        backgroundColor: "#FFA500", // Orange color for active
    },
    progressBarDotInactive: {
        backgroundColor: "#8F8F93",
    },
    imageUploadCard: {
        height: 200,
        backgroundColor: "#171717",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333', // Subtle border
        borderStyle: 'dashed', // Dashed border
    },
    imageUploadText: {
        color: "#8F8F93",
        fontSize: 16,
        fontWeight: '600',
    },
    imageUploadSubText: {
        color: "#8F8F93",
        fontSize: 12,
        marginTop: 5,
    },
    tipText: {
        marginTop: 20,
        color: "#8F8F93",
        textAlign: "center",
        fontSize: 13, // Adjusted font size
        lineHeight: 18, // Added line height for readability
    },
    sectionTitle: {
        color: "#6C6C6C",
        fontSize: 15,
        marginTop: 19,
        fontWeight: 'bold', // Added bold as per UI
    },
    selectOptionButton: {
        width: "100%",
        height: 50,
        backgroundColor: "#171717",
        marginTop: 10,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15, // Adjusted padding
    },
    selectOptionText: {
        color: "#fff",
        fontSize: 16,
    },
    listingStatusText: {
        color: '#FFA500', // Orange color
        fontSize: 14,
        marginTop: 5, // Spacing from above
        marginLeft: 5, // Indent slightly
    },
    sizeOptionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 15,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    sizeOptionButton: {
        minWidth: 95, // Adjusted for better distribution
        height: 60,
        backgroundColor: "#171717",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 10, // Ensure text fits
    },
    sizeOptionButtonSelected: {
        backgroundColor: "#FFA500", // Orange background when selected
    },
    sizeOptionText: {
        color: "#fff",
        fontSize: 15,
    },
    sizeOptionTextSelected: {
        color: "#000", // Black text when selected
        fontWeight: 'bold',
    },
    bottomButton: {
        height: 60,
        borderRadius: 30, // More rounded, like the image
        marginTop: 40, // Increased margin for visual separation
        justifyContent: "center",
        alignItems: "center",
    },
    buttonEnabled: {
        backgroundColor: "#FFA500", // Orange when enabled
    },
    buttonDisabled: {
        backgroundColor: "#1B1B1B", // Dark grey when disabled
    },
    bottomButtonText: {
        color: "#000", // Black text for enabled button
        fontSize: 17,
        fontWeight: "600",
    },
    uploadedImagesGrid: {
        flexDirection: 'column', // Changed to column for main image on top
        justifyContent: 'flex-start',
        marginBottom: 20,
    },
    mainUploadedImage: {
        width: '100%',
        height: 250, // Larger size for the main image
        borderRadius: 8,
        marginBottom: 10, // Space below the main image
    },
    mainImageWrapper: {
        position: 'relative',
        width: '100%',
        height: 250,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumbnailContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    uploadedImageWrapper: {
        position: 'relative',
        margin: 5,
        width: 100,
        height: 100,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'transparent',
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#666',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Position at the bottom
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalOptionText: {
        color: '#fff',
        fontSize: 16,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFA500',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    selectedRadioFill: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#FFA500',
    },
    inputLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 5,
        marginTop: 20,
    },
    textInput: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
        marginTop: 8
    },
    descriptionInputContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 10,
    },
    descriptionToolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    descriptionParagraph: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    descriptionIcons: {
        flexDirection: 'row',
    },
    descriptionIcon: {
        marginLeft: 15,
    },
    descriptionTextInput: {
        paddingTop: 10,
        paddingBottom: 10,
        height: 250, // Fixed height for description
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#fff',
    },
    tagInputContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#171717',
        borderRadius: 10,
        padding: 5,
        minHeight: 50,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 8

    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        margin: 4,
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 5,
    },
    tagCloseButton: {
        marginLeft: 5,
    },
    tagTextInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        paddingVertical: 5,
        paddingHorizontal: 5,
        minWidth: 80,
    },
    inlineInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        marginTop: 10,
    },
    inlineInputHalf: {
        flex: 1,
        backgroundColor: 'transparent',
        marginRight: 0,
    },
    inlineInputLabel: {
        color: '#666',
        fontSize: 16,
        paddingHorizontal: 15,
    },
    colorOptionsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: 10,
        marginTop: 15,
    },
    colorOptionButton: {
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: "center",
        alignItems: "center",
        width: 100,
        backgroundColor: '#171717',
    },
    colorOptionButtonSelected: {
        backgroundColor: "#FFA500",
        borderColor: "#FFA500",
    },
    colorOptionText: {
        color: "#fff",
        fontSize: 14,
    },
    colorOptionTextSelected: {
        color: "#000",
        fontWeight: 'bold',
    },
});

export default CreateProductScreen;