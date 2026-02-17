export const useAuction = ({ stream, streamId }) => {
    const [currentBid, setCurrentBid] = useState(0);
    const [endTime, setEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!stream) return;

        setCurrentBid(stream.currentBid || stream.startingBid);

        if (stream.endTime) {
            setEndTime(new Date(stream.endTime).getTime());
        }
    }, [stream]);

    useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const diff = endTime - Date.now();

            if (diff <= 0) {
                setTimeLeft("00:00");
                clearInterval(interval);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setTimeLeft(
                `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    const handleIncomingBid = (data) => {
        setCurrentBid(data.currentBid);
    };

    const updateEndTime = (newEndTime) => {
        setEndTime(new Date(newEndTime).getTime());
    };

    return {
        currentBid,
        timeLeft,
        handleIncomingBid,
        updateEndTime,
    };
};