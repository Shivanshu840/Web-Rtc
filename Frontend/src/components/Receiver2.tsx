import { useEffect, useRef } from "react";

export function Receiver2() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pc = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'createoffer') {
                // Initialize RTCPeerConnection if not already initialized
                if (!pc.current) {
                    pc.current = new RTCPeerConnection();

                    // Handle ICE candidates
                    pc.current.onicecandidate = (event) => {
                        if (event.candidate) {
                            socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
                        }
                    };

                    // Handle incoming tracks
                    pc.current.ontrack = (event) => {
                        if (videoRef.current && event.streams[0]) {
                            videoRef.current.srcObject = event.streams[0];
                        }
                    };
                }

                // Set the remote description and create an answer
                await pc.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: 'createanswer', sdp: pc.current.localDescription }));
                
            } else if (message.type === 'iceCandidate' && pc.current) {
                // Add received ICE candidate to RTCPeerConnection
                await pc.current.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
        };

        // Clean up WebSocket and RTCPeerConnection on component unmount
        return () => {
            socket.close();
            if (pc.current) {
                pc.current.close();
            }
        };
    }, []);
    
    return (
        <div>
            <h3>Get the video of sender</h3>
            <video controls ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "500px" }} />
        </div>
    );
}
