import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";


export const getProfileInfo = async () => {
    try {
        const userId = await AsyncStorage.getItem("userId");

        if (!userId) {
            throw new Error("User ID not found in storage");
        }

        const res = await axios.get(`${config.baseUrl2}/account/single/${userId}`);

        return {
            userId,
            data: res?.data?.data || null,
        };
    } catch (error) {
        console.error("❌ getProfileInfo error:", error.message);
        throw error;
    }
};
export const getAllGifts = async () => {
    try {
        const res = await axios.get(`${config.baseUrl2}/gifts/all`);
        return res?.data?.data || [];
    } catch (error) {
        console.error("❌ getAllGifts error:", error.message);
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const res = await axios.get(`${config.baseUrl2}/account/all`);
        return res?.data?.data || [];
    } catch (error) {
        console.error("❌ getAllUsers error:", error.message);
        throw error;
    }
};