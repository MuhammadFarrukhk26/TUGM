// SingleStreamScreen.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

const SingleStreamScreen = ({ route }) => {
  const { streamId } = route.params;

  const [stream, setStream] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchStream();
  }, []);

  useEffect(() => {
    if (stream?.endTime) {
      startTimer();
    }
    return () => clearInterval(intervalRef.current);
  }, [stream]);

  const fetchStream = async () => {
    const { data } = await axios.get(
      `https://your-api.com/streams/${streamId}`
    );
    setStream(data);
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      const diff =
        new Date(stream.endTime) - new Date();

      if (diff <= 0) {
        clearInterval(intervalRef.current);
        fetchStream(); // refresh status
      } else {
        setRemainingTime(
          Math.floor(diff / 1000)
        );
      }
    }, 1000);
  };

  const placeBid = async () => {
    if (!bidAmount) return;

    if (Number(bidAmount) <= stream.currentBid) {
      Alert.alert(
        "Invalid Bid",
        "Bid must be higher than current bid"
      );
      return;
    }

    try {
      await axios.post(
        "https://your-api.com/bids",
        {
          streamId,
          amount: Number(bidAmount),
        }
      );

      setBidAmount("");
      fetchStream();
    } catch (error) {
      Alert.alert("Error", "Bid failed");
    }
  };

  if (!stream) return null;

  const isAuction = stream.mode === "AUCTION";
  const isLive = stream.status === "LIVE";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Stream</Text>

      {isAuction && (
        <>
          <Text style={styles.price}>
            Current Bid: ${stream.currentBid}
          </Text>

          {isLive && (
            <Text style={styles.timer}>
              Time Left: {remainingTime}s
            </Text>
          )}

          {!isLive && (
            <Text style={styles.winner}>
              Auction Ended
              {"\n"}
              Winner: {stream.highestBidder || "N/A"}
            </Text>
          )}

          {isLive && (
            <>
              <TextInput
                placeholder="Enter Bid"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.bidButton}
                onPress={placeBid}
              >
                <Text style={{ color: "white" }}>
                  Place Bid
                </Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {!isAuction && (
        <>
          <Text>Buy Now Mode</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={{ color: "white" }}>
              Buy Now
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default SingleStreamScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold" },
  price: { fontSize: 20, marginVertical: 10 },
  timer: {
    fontSize: 18,
    color: "red",
  },
  winner: {
    fontSize: 18,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  bidButton: {
    backgroundColor: "black",
    padding: 15,
    alignItems: "center",
  },
  buyButton: {
    backgroundColor: "green",
    padding: 15,
    alignItems: "center",
  },
});
