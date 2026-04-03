import React from "react";
import { Modal, View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";

const UserInvitationModal = ({ 
    visible, 
    onClose, 
    allUsers, 
    sendInvite 
}) => {

    const renderUserItem = ({ item }) => (
        <View style={styles.userItem}>
            <Image
                source={{ uri: item?.profile || defaultAvatar }}
                defaultSource={{ uri: defaultAvatar }}
                style={styles.userImage}
            />
            <Text style={styles.username}>{item?.username}</Text>
            <TouchableOpacity style={styles.inviteButton} onPress={() => sendInvite(item._id)}>
                <Text style={styles.inviteButtonText}>Send Invite</Text>
            </TouchableOpacity>
        </View>
    );

    const defaultAvatar = "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740&q=80";

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Invite Users</Text>
                    <FlatList
                        data={allUsers}
                        keyExtractor={(item) => item._id}
                        renderItem={renderUserItem}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0)",
        justifyContent: "flex-end",
        zIndex: 2,
    },
    modalContainer: {
        backgroundColor: "rgba(46, 45, 45, 0.8)",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "white",
    },
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.5)",
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        flex: 1,
        fontSize: 16,
        color: "white",
    },
    inviteButton: {
        backgroundColor: "#007bff",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    inviteButtonText: {
        color: "#fff",
        fontSize: 14,
    },
    closeButton: {
        backgroundColor: "red",
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 14,
    },
});

export default UserInvitationModal;