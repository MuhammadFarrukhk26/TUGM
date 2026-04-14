import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Modal, Pressable, Image, ToastAndroid, Platform, KeyboardAvoidingView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import config from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CompetitionsSettings = () => {
    const navigation = useNavigation();
    const [competitionName, setCompetitionName] = useState('');
    const [isAddOpponentModalVisible, setIsAddOpponentModalVisible] = useState(false);
    const [allowPerks, setAllowPerks] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState(null);
    const [searchOpponentText, setSearchOpponentText] = useState('');
    const [opponents, setOpponents] = useState([]);
    const [thumbAsset, setThumbAsset] = useState(null);
    const [videoAsset, setVideoAsset] = useState(null);
    const [creating, setCreating] = useState(false);
    const [products, setProducts] = useState([])
    const [isStoreVisible, setIsStoreVisible] = useState(false);
    const [data, setData] = useState({ startingBid: 1, productIds: [], image: null });


    const filteredOpponents = useMemo(() => {
        const q = searchOpponentText.trim().toLowerCase();
        if (!q) return opponents;
        return opponents.filter(o => {
            const u = (o?.username || '').toLowerCase();
            const e = (o?.email || '').toLowerCase();
            return u.includes(q) || e.includes(q);
        });
    }, [searchOpponentText, opponents]);

    const handleSelectOpponent = (opponent) => {
        setSelectedOpponent(opponent);
        setIsAddOpponentModalVisible(false);
    };

    const handleRemoveOpponent = () => {
        setSelectedOpponent(null);
    };

    const fetchAllOpponents = async () => {
        try {
            const res = await axios.get(`${config.baseUrl}/account/all`);
            if (res?.data?.data) setOpponents(res.data.data);
        } catch (error) {
            ToastAndroid.show('Failed to load opponents', ToastAndroid.SHORT);
        }
    };

    const pickMedia = async (kind) => {
        const result = await launchImageLibrary({ mediaType: kind === 'video' ? 'video' : 'photo', selectionLimit: 1 });
        if (result?.didCancel) return;
        const asset = result?.assets?.[0];
        if (!asset?.uri) {
            ToastAndroid.show('Selection failed', ToastAndroid.SHORT);
            return;
        }
        if (kind === 'photo') {
            setThumbAsset({ uri: asset.uri, type: asset.type || 'image/jpeg', fileName: asset.fileName || `thumb_${Date.now()}.jpg` });
        } else {
            setVideoAsset({ uri: asset.uri, type: asset.type || 'video/mp4', fileName: asset.fileName || `intro_${Date.now()}.mp4` });
        }
    };

    const validate = () => {
        if (!competitionName.trim()) {
            ToastAndroid.show('Enter competition name', ToastAndroid.SHORT);
            return false;
        }
        if (!selectedOpponent?._id) {
            ToastAndroid.show('Select an opponent', ToastAndroid.SHORT);
            return false;
        }
        if (!thumbAsset && !videoAsset) {
            ToastAndroid.show('Add a thumbnail or a video', ToastAndroid.SHORT);
            return false;
        }
        return true;
    };

    const fetchProduct = async () => {
        let userId = await AsyncStorage.getItem('userId');
        try {
            let res = await axios.get(`${config.baseUrl}/product/user/${userId}`)
            if (res?.data) {
                // setProducts(res?.data?.data);
                   setProducts(res?.data?.data?.filter((x) => x?.isDeleted !== true));
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const createBattle = async () => {
        if (!validate()) return;
        try {
            setCreating(true);
            const form = new FormData();
            form.append('name', competitionName.trim());
            form.append('creatorId', await AsyncStorage.getItem('userId'));
            form.append('opponentId', String(selectedOpponent._id));
            data.productIds.forEach(id => form.append('productId[]', id));
            const fileToSend = thumbAsset;
            if (fileToSend) {
                form.append('image', {
                    uri: Platform.OS === 'ios' ? fileToSend.uri.replace('file://', '') : fileToSend.uri,
                    type: fileToSend.type,
                    name: fileToSend.fileName
                });
            }
            const res = await axios.post(`${config.baseUrl}/battle/create`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res?.data?.data?._id) {
                ToastAndroid.show('Battle Created', ToastAndroid.SHORT);
                navigation.replace("competition", { streamId: res?.data?.data.streamId, isHost: true });
            } else {
                ToastAndroid.show('Failed to create battle', ToastAndroid.SHORT);
            }
        } catch (e) {
            console.log(e, 'error')
            ToastAndroid.show(e?.response?.data?.error || 'Error creating battle', ToastAndroid.LONG);
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        fetchProduct()
        fetchAllOpponents();
    }, []);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={{ flex: 1, backgroundColor: "black" }}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Competition settings</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollViewContent}>
                    <Text style={styles.label}>Name your competition</Text>
                    <TextInput style={styles.input} placeholder="Enter competition name" placeholderTextColor="#666" value={competitionName} onChangeText={setCompetitionName} />

                    <Text style={styles.label}>Add opponent</Text>
                    <TouchableOpacity onPress={() => setIsAddOpponentModalVisible(true)} style={styles.addOpponentContainer}>
                        {selectedOpponent ? (
                            <View style={styles.selectedOpponentPill}>
                                <Image source={{ uri: selectedOpponent.profile }} style={styles.selectedOpponentAvatar} />
                                <Text style={styles.selectedOpponentText}>@{String(selectedOpponent.username || '').replace(/\s/g, '_').toLowerCase()}</Text>
                                <TouchableOpacity onPress={handleRemoveOpponent} style={styles.removeOpponentButton}>
                                    <AntDesign name="closecircle" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addOpponentButton} onPress={() => setIsAddOpponentModalVisible(true)}>
                                <Feather name="user-plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setIsAddOpponentModalVisible(true)}>
                            <MaterialCommunityIcons name="account-group-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    <Text style={styles.label}>Media</Text>
                    <Text style={styles.subLabel}>Add a thumbnail and Battle ready prep screen with your intros.</Text>
                    <View style={styles.mediaContainer}>
                        <View style={styles.mediaOption}>
                            <TouchableOpacity style={[styles.mediaButton, thumbAsset ? styles.mediaSelected : null]} onPress={() => pickMedia('photo')}>
                                {thumbAsset ? <Image source={{ uri: thumbAsset.uri }} style={styles.preview} /> : <Feather name="camera" size={24} color="#fff" />}
                                <Text style={styles.mediaButtonText}>{thumbAsset ? 'Thumbnail Selected' : 'Add a Thumbnail'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.mediaOption}>
                            <TouchableOpacity style={[styles.mediaButton, videoAsset ? styles.mediaSelected : null]} onPress={() => pickMedia('video')}>
                                <Ionicons name="play-circle-outline" size={24} color="#fff" />
                                <Text style={styles.mediaButtonText}>{videoAsset ? 'Video Selected' : 'Prep video intros'}</Text>
                                <Text style={styles.mediaTime}>{videoAsset ? '' : '01:00'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.label}>Add Product</Text>
                    <TouchableOpacity onPress={() => setIsStoreVisible(!isStoreVisible)} style={styles.viewStoreButton}>
                        <Text style={{ color: "white" }}>Select Product For Auction</Text>
                    </TouchableOpacity>

                    <View style={styles.perksContainer}>
                        <View>
                            <Text style={styles.label}>Allow Perks</Text>
                            <Text style={styles.subLabel}>You can use 1-2 perks per competition.</Text>
                        </View>
                        <Switch trackColor={{ false: "#767577", true: "#F78E1B" }} thumbColor={allowPerks ? "#f4f3f4" : "#f4f3f4"} ios_backgroundColor="#3e3e3e" onValueChange={setAllowPerks} value={allowPerks} />
                    </View>

                    <Text style={styles.label}>Primary Category</Text>
                    <Text style={styles.subLabel}>Accurately categorizing your show will help to increase</Text>
                    <TouchableOpacity style={styles.categoryButton}>
                        <TextInput placeholder='Category' placeholderTextColor={"white"} style={{ flex: 1, border: "none" }} />
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton} disabled={creating}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={createBattle} style={styles.goLiveButton} disabled={creating}>
                            <Text style={styles.goLiveButtonText}>{creating ? 'Creating...' : 'Go LIVE'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <Modal animationType="slide" transparent={true} visible={isAddOpponentModalVisible} onRequestClose={() => setIsAddOpponentModalVisible(false)}>
                    <Pressable style={styles.modalBackground} onPress={() => setIsAddOpponentModalVisible(false)}>
                        <Pressable style={styles.addOpponentModalView}>
                            <TouchableOpacity style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add your opponent</Text>
                                <TouchableOpacity onPress={() => setIsAddOpponentModalVisible(false)}>
                                    <AntDesign name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </TouchableOpacity>

                            <View style={styles.modalSearchBar}>
                                <Ionicons name="search" size={20} color="gray" style={styles.modalSearchIcon} />
                                <TextInput style={styles.modalSearchInput} placeholder="Search for opponent" placeholderTextColor="gray" value={searchOpponentText} onChangeText={setSearchOpponentText} />
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.opponentList}>
                                {filteredOpponents.map((opponent) => {
                                    const isSelected = selectedOpponent?._id === opponent._id;
                                    return (
                                        <TouchableOpacity key={opponent._id} style={styles.opponentItem} onPress={() => handleSelectOpponent(opponent)}>
                                            <Image source={{ uri: opponent.profile }} style={styles.opponentAvatar} />
                                            <View style={styles.opponentInfo}>
                                                <Text style={styles.opponentName}>{opponent.username}</Text>
                                                <Text style={styles.opponentFollowers}>{opponent.email}</Text>
                                                {opponent.isOnline ? <Text style={styles.opponentStatus}>Online</Text> : null}
                                            </View>
                                            {isSelected ? (
                                                <AntDesign name="checkcircle" size={24} color="#F78E1B" />
                                            ) : (
                                                <TouchableOpacity style={styles.inviteButton} onPress={() => handleSelectOpponent(opponent)}>
                                                    <Text style={styles.inviteButtonText}>Invite</Text>
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isStoreVisible}
                onRequestClose={() => setIsStoreVisible(false)}
            >
                <Pressable
                    onPress={() => setIsStoreVisible(false)} // 👈 Tap outside closes modal
                    style={{
                        flex: 1,
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()} // 👈 Prevent closing when tapping inside content
                        style={{
                            backgroundColor: '#0c0b0bff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            padding: 20,
                            paddingBottom: 40,
                            maxHeight: 600,
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>My Store</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
                            {products?.map((i) => (
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
                                            flexDirection: "row",
                                            alignItems: "flex-start",
                                            borderBottomWidth: 2,
                                            borderBottomColor: "#494848",
                                            paddingBottom: 20,
                                        }}
                                    >
                                        <Image
                                            source={{ uri: i?.images[0] }}
                                            style={{ width: 70, height: 70, borderRadius: 10 }}
                                        />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ color: "#fff", fontSize: 12 }}>{i.title}</Text>
                                            <Text style={{ color: "#c4c4c4", fontSize: 12, marginTop: 8 }}>
                                                QTY: {i?.stock}
                                            </Text>
                                            <Text style={{ color: "#fff", fontSize: 12, marginTop: 8 }}>
                                                ${i.price}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexDirection: "row",
                                            marginTop: 15,
                                        }}
                                    >
                                        <Text style={{ color: "#fff", fontSize: 16 }}>${i.price}</Text>

                                        <TouchableOpacity
                                            onPress={() => {
                                                setData(prev => {
                                                    const alreadySelected = prev.productIds.includes(i._id);
                                                    const updatedProductIds = alreadySelected
                                                        ? prev.productIds.filter(id => id !== i._id)
                                                        : [...prev.productIds, i._id];
                                                    return { ...prev, productIds: updatedProductIds };
                                                });
                                            }}
                                            style={{
                                                backgroundColor: data?.productIds?.includes(i._id)
                                                    ? "#FFA500"
                                                    : "#fff",
                                                width: 120,
                                                borderWidth: 1,
                                                borderRadius: 25,
                                                padding: 10,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: data?.productIds?.includes(i._id) ? "#fff" : "#000",
                                                }}
                                            >
                                                {data?.productIds?.includes(i._id)
                                                    ? "Selected"
                                                    : "Select Product"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>



        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingTop: 80 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scrollViewContent: { paddingHorizontal: 20 },
    label: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    subLabel: { color: '#999', fontSize: 12, marginBottom: 10 },
    input: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 15, height: 50, color: '#fff', fontSize: 16 },
    addOpponentContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 15, height: 50 },
    addOpponentButton: { padding: 5 },
    selectedOpponentPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828', borderRadius: 20, padding: 5, paddingRight: 10 },
    selectedOpponentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
    selectedOpponentText: { color: '#fff', fontSize: 16 },
    removeOpponentButton: { marginLeft: 10, padding: 2 },
    mediaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    mediaOption: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
    mediaButton: { backgroundColor: '#1A1A1A', borderRadius: 10, width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', padding: 10 },
    mediaSelected: { borderWidth: 1, borderColor: '#F78E1B' },
    mediaButtonText: { color: '#fff', marginTop: 10, textAlign: 'center' },
    mediaTime: { color: '#999', fontSize: 12, marginTop: 5 },
    optionalText: { color: '#999', fontSize: 12, marginTop: 5 },
    preview: { width: '100%', height: 80, borderRadius: 8, resizeMode: 'cover' },
    perksContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
    categoryButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 15, height: 50, marginTop: 10 },
    categoryButtonText: { color: '#fff', fontSize: 16 },
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 50 },
    cancelButton: { flex: 1, backgroundColor: '#282828', borderRadius: 100, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cancelButtonText: { color: '#fff', fontSize: 16 },
    goLiveButton: { flex: 1, backgroundColor: '#F78E1B', borderRadius: 100, height: 50, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    goLiveButtonText: { color: '#fff', fontSize: 16 },
    modalBackground: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
    addOpponentModalView: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    modalSearchBar: { backgroundColor: '#282828', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20 },
    modalSearchIcon: { marginRight: 10 },
    modalSearchInput: { flex: 1, height: 40, color: '#fff', fontSize: 16 },
    opponentList: { flex: 1 },
    opponentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
    opponentAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    opponentInfo: { flex: 1 },
    opponentName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    opponentFollowers: { color: '#999', fontSize: 12 },
    opponentStatus: { color: '#0f0', fontSize: 12, marginTop: 2 },
    inviteButton: { backgroundColor: '#F78E1B', borderRadius: 5, paddingVertical: 8, paddingHorizontal: 15 },
    viewStoreButton: {
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 13,
        alignItems: "center",
        marginBottom: 20,
        backgroundColor: "#1A1A1A",
        width: "100%",
    },
});

export default CompetitionsSettings;
