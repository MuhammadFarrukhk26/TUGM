import { useEffect, useRef, useState } from "react";
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    AudienceLatencyLevelType,
} from "react-native-agora";

export const useAgoraLiveStream = ({
    appId,
    channelName,
    token,
    isHost,
}) => {
    const engineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUids, setRemoteUids] = useState([]);
    const [viewerCount, setViewerCount] = useState(0);

    useEffect(() => {
        if (!token) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId });

        if (isHost) {
            engine.enableVideo();
            engine.startPreview();
        }

        engine.registerEventHandler({
            onJoinChannelSuccess: () => {
                setIsJoined(true);
                if (isHost) setViewerCount(1);
            },
            onUserJoined: (_, uid) => {
                setRemoteUids(prev => [...new Set([...prev, uid])]);
                setViewerCount(v => v + 1);
            },
            onUserOffline: (_, uid) => {
                setRemoteUids(prev => prev.filter(id => id !== uid));
                setViewerCount(v => Math.max(v - 1, 0));
            },
        });

        engine.joinChannel(token, channelName, 0, {
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            clientRoleType: isHost
                ? ClientRoleType.ClientRoleBroadcaster
                : ClientRoleType.ClientRoleAudience,
            publishCameraTrack: isHost,
            publishMicrophoneTrack: isHost,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
            audienceLatencyLevel: isHost
                ? undefined
                : AudienceLatencyLevelType.AudienceLatencyLevelUltraLowLatency,
        });

        return () => {
            engine.leaveChannel();
            engine.release();
        };
    }, [token]);

    return {
        engineRef,
        isJoined,
        remoteUids,
        viewerCount,
    };
};
