export const useStreamSocket = ({
    streamId,
    onNewBid,
    onTimerUpdate,
}) => {
    useEffect(() => {
        const socket = io(config.socketUrl);

        socket.emit("joinStream", streamId);

        socket.on("newBid", onNewBid);
        socket.on("biddingTimeUpdated", data => {
            if (data?.endTime) {
                onTimerUpdate(data.endTime);
            }
        });

        return () => socket.disconnect();
    }, []);
};
