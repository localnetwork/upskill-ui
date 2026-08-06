"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

function toBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function parseIceServers() {
  const raw = process.env.NEXT_PUBLIC_WEBRTC_ICE_SERVERS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

export default function CallRoomPage() {
  const router = useRouter();
  const roomId = String(router.query?.roomId || "").trim();
  const conversationId = String(router.query?.conversationId || "").trim();
  const callId = String(router.query?.call_id || "").trim();
  const hasVideo = toBool(router.query?.has_video, true);
  const initializeVideo = toBool(router.query?.initialize_video, hasVideo);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const joinedRef = useRef(false);
  const offerSentRef = useRef(false);

  const [status, setStatus] = useState("Preparing call...");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(!hasVideo);

  const canStart = useMemo(
    () => Boolean(router.isReady && roomId && conversationId && callId),
    [router.isReady, roomId, conversationId, callId],
  );

  const ensurePeer = async () => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: parseIceServers() });

    peer.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) return;
      socketRef.current.emit("chat:call:signal", {
        conversationId,
        roomId,
        signalType: "ice",
        candidate: event.candidate,
      });
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams || [];
      if (!stream || !remoteVideoRef.current) return;
      remoteVideoRef.current.srcObject = stream;
    };

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        peer.addTrack(track, localStreamRef.current);
      }
    }

    peerRef.current = peer;
    return peer;
  };

  useEffect(() => {
    if (!canStart || joinedRef.current) return;
    joinedRef.current = true;

    let active = true;
    const cookies = parseCookies();
    const token = getAuthTokenFromCookieMap(cookies);
    if (!token) {
      setError("Unauthorized. Please login and retry.");
      setStatus("Call unavailable.");
      return;
    }

    const socketBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(
      /\/api\/?$/,
      "",
    );
    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: initializeVideo,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (_error) {
        setError("Could not access mic/camera. Check browser permissions.");
      }

      await ensurePeer();
      setStatus("Joining room...");
      socket.emit(
        "chat:call:join",
        {
          conversationId,
          roomId,
          callId,
          hasVideo,
        },
        async (ack) => {
          if (!active) return;
          if (!ack?.ok) {
            setError(ack?.message || "Failed to join call room.");
            setStatus("Call unavailable.");
            return;
          }
          setStatus(ack?.data?.isInitiator ? "Waiting for participant..." : "Connected");
        },
      );
    })();

    socket.on("chat:call:participant-joined", async () => {
      if (offerSentRef.current) return;
      offerSentRef.current = true;
      try {
        const peer = await ensurePeer();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("chat:call:signal", {
          conversationId,
          roomId,
          signalType: "offer",
          sdp: offer,
        });
        setStatus("Calling...");
      } catch (_error) {
        setError("Failed to create call offer.");
      }
    });

    socket.on("chat:call:signal", async (payload) => {
      try {
        if (
          String(payload?.conversationId || "") !== conversationId ||
          String(payload?.roomId || "") !== roomId
        ) {
          return;
        }
        const peer = await ensurePeer();
        const type = String(payload?.signalType || "");

        if (type === "offer" && payload?.sdp) {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("chat:call:signal", {
            conversationId,
            roomId,
            toUserId: payload.fromUserId,
            signalType: "answer",
            sdp: answer,
          });
          setStatus("Connected");
          return;
        }

        if (type === "answer" && payload?.sdp) {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          setStatus("Connected");
          return;
        }

        if (type === "ice" && payload?.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (_error) {
        setError("Call signaling error.");
      }
    });

    socket.on("chat:call:ended", () => {
      setStatus("Call ended.");
      setTimeout(() => window.close(), 600);
    });

    return () => {
      active = false;
      try {
        socket.emit("chat:call:end", { conversationId, roomId }, () => {});
      } catch (_error) {}
      socket.disconnect();
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) track.stop();
        localStreamRef.current = null;
      }
    };
  }, [callId, canStart, conversationId, hasVideo, initializeVideo, roomId]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !muted;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    setMuted(nextMuted);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextCameraOff = !cameraOff;
    for (const track of stream.getVideoTracks()) {
      track.enabled = !nextCameraOff;
    }
    setCameraOff(nextCameraOff);
  };

  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("chat:call:end", { conversationId, roomId }, () => {});
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Call Room: {roomId}</h1>
        <p className="mt-1 text-sm text-slate-300">{status}</p>
        {error ? <p className="mt-1 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-black/50 p-2">
            <p className="mb-2 text-xs text-slate-300">You</p>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-[320px] w-full rounded object-cover bg-black"
            />
          </div>
          <div className="rounded-lg bg-black/50 p-2">
            <p className="mb-2 text-xs text-slate-300">Remote</p>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-[320px] w-full rounded object-cover bg-black"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            {cameraOff ? "Turn Camera On" : "Turn Camera Off"}
          </button>
          <button
            type="button"
            onClick={endCall}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
