import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import config from "../config";

export const useChat = ({ streamId, userId }) => {
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // ------------------------------------------------
    // FETCH INITIAL MESSAGES
    // ------------------------------------------------
    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);

            const { data } = await axios.get(
                `${config.baseUrl}/stream/message/${streamId}`
            );

            if (data?.data) {
                // Keep only last 50 to prevent memory bloat
                const latest = data.data.slice(-50);
                setMessages(latest);
            }
        } catch (err) {
            console.error("Chat fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [streamId]);

    // ------------------------------------------------
    // SEND MESSAGE
    // ------------------------------------------------
    const sendMessage = useCallback(
        async (text) => {
            if (!text?.trim()) return;

            try {
                await axios.post(`${config.baseUrl}/stream/message`, {
                    streamId,
                    userId,
                    message: text.trim(),
                });
            } catch (err) {
                console.error("Send message error:", err);
            }
        },
        [streamId, userId]
    );

    // ------------------------------------------------
    // SOCKET SETUP
    // ------------------------------------------------
    useEffect(() => {
        if (!streamId) return;

        socketRef.current = io(config.socketUrl, {
            transports: ["websocket"],
        });

        socketRef.current.emit("joinStreamChat", streamId);

        socketRef.current.on("newMessage", (incoming) => {
            setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.find((m) => m._id === incoming._id)) {
                    return prev;
                }

                const updated = [...prev, incoming];

                // Keep only last 50
                return updated.slice(-50);
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [streamId]);

    // ------------------------------------------------
    // INITIAL LOAD
    // ------------------------------------------------
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return {
        messages,
        loading,
        sendMessage,
        refreshChat: fetchMessages,
    };
};
