import { useEffect, useState } from "react";

export function Sender2() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8080');
        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: 'sender' }));
        };
        setSocket(newSocket);

        return () => {
            newSocket.close();
            if (pc) pc.close();
        };
    }, []);

    async function StartSendingVideo() {
        if (!socket) return;

        // Create RTCPeerConnection if not already created
        const peerConnection = new RTCPeerConnection();
        setPc(peerConnection);

        peerConnection.onnegotiationneeded = async () => {
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.send(JSON.stringify({ type: 'createoffer', sdp: peerConnection.localDescription }));
            } catch (error) {
                console.error("Error during negotiation:", error);
            }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
            }
        };

        // Handle messages from the receiver
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'createanswer') {
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } else if (data.type === 'iceCandidate') {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        // Access the user's video and audio stream
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    }

    return (
        <div>
            <button onClick={StartSendingVideo}>Start Sending Video</button>
        </div>
    );
}
