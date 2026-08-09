"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import {
  ArrowLeft,
  Camera,
  Mic,
  MoreHorizontal,
  PhoneOff,
  Smile,
  Sparkles,
  UserPlus,
  Video,
  X,
} from "lucide-react";

const CAMERA_FILTER_OPTIONS = [
  { value: "none", label: "None" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "bw", label: "Black & White" },
  { value: "cinema", label: "Cinema" },
  { value: "vivid", label: "Vivid" },
];

const CAMERA_EFFECT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "vignette", label: "Vignette" },
  { value: "scanlines", label: "Scanlines" },
  { value: "glow", label: "Soft Glow" },
];

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

function resolveCanvasFilter(filterName) {
  switch (String(filterName || "")) {
    case "warm":
      return "saturate(1.15) sepia(0.2) hue-rotate(-8deg) brightness(1.03)";
    case "cool":
      return "saturate(1.05) hue-rotate(12deg) contrast(1.04)";
    case "bw":
      return "grayscale(1) contrast(1.08)";
    case "cinema":
      return "contrast(1.2) saturate(0.9) brightness(0.92)";
    case "vivid":
      return "saturate(1.4) contrast(1.1)";
    default:
      return "none";
  }
}

function resolveThumbnailOverlayClass(effectName) {
  switch (String(effectName || "")) {
    case "vignette":
      return "before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.45)_100%)]";
    case "scanlines":
      return "before:absolute before:inset-0 before:content-[''] before:bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.22)_0,rgba(0,0,0,0.22)_1px,transparent_1px,transparent_4px)]";
    case "glow":
      return "before:absolute before:inset-0 before:content-[''] before:bg-amber-200/25";
    default:
      return "";
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
  const rawLocalStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const processedStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const processingVideoRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const processingRafRef = useRef(null);
  const filterThumbRefs = useRef({});
  const effectThumbRefs = useRef({});
  const joinedRef = useRef(false);
  const offerSentRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const heartbeatIntervalRef = useRef(null);
  const activeFilterRef = useRef("none");
  const activeEffectRef = useRef("none");

  const [status, setStatus] = useState("Preparing call...");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(!hasVideo);
  const [cameraFilter, setCameraFilter] = useState("none");
  const [cameraEffect, setCameraEffect] = useState("none");
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  const callTitle = useMemo(() => {
    const fromQuery = String(router.query?.peer_name || "").trim();
    return fromQuery || "Video Call";
  }, [router.query?.peer_name]);

  const canStart = useMemo(
    () => Boolean(router.isReady && roomId && conversationId && callId),
    [router.isReady, roomId, conversationId, callId],
  );

  useEffect(() => {
    activeFilterRef.current = cameraFilter;
  }, [cameraFilter]);

  useEffect(() => {
    activeEffectRef.current = cameraEffect;
  }, [cameraEffect]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [hasRemoteVideo]);

  const stopVideoProcessing = () => {
    if (processingRafRef.current) {
      cancelAnimationFrame(processingRafRef.current);
      processingRafRef.current = null;
    }
    if (processingVideoRef.current) {
      processingVideoRef.current.pause();
      processingVideoRef.current.srcObject = null;
      processingVideoRef.current = null;
    }
    if (processedStreamRef.current) {
      for (const track of processedStreamRef.current.getTracks()) {
        track.stop();
      }
      processedStreamRef.current = null;
    }
    processingCanvasRef.current = null;
  };

  const drawEffectOverlay = (ctx, width, height, effectName) => {
    const effect = String(effectName || "");
    if (effect === "vignette") {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    if (effect === "scanlines") {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "#000000";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
      return;
    }

    if (effect === "glow") {
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  };

  const createOutgoingStream = async (rawStream) => {
    const hasRawVideo = rawStream.getVideoTracks().length > 0;
    if (!hasRawVideo) return rawStream;

    stopVideoProcessing();

    const sourceVideo = document.createElement("video");
    sourceVideo.autoplay = true;
    sourceVideo.muted = true;
    sourceVideo.playsInline = true;
    sourceVideo.srcObject = rawStream;
    try {
      await sourceVideo.play();
    } catch (_error) {}

    const rawVideoTrack = rawStream.getVideoTracks()[0];
    const settings = rawVideoTrack.getSettings ? rawVideoTrack.getSettings() : {};
    const width = Number(settings.width || 640);
    const height = Number(settings.height || 360);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return rawStream;

    const render = () => {
      if (!processingVideoRef.current || !processingCanvasRef.current) return;
      if (sourceVideo.readyState < 2) {
        processingRafRef.current = requestAnimationFrame(render);
        return;
      }
      const currentFilter = resolveCanvasFilter(activeFilterRef.current);
      try {
        ctx.filter = currentFilter;
        ctx.drawImage(sourceVideo, 0, 0, width, height);
        drawEffectOverlay(ctx, width, height, activeEffectRef.current);
      } catch (_error) {
        // Keep trying while source stream is initializing.
      }
      processingRafRef.current = requestAnimationFrame(render);
    };

    processingVideoRef.current = sourceVideo;
    processingCanvasRef.current = canvas;
    render();

    const processedCanvasStream = canvas.captureStream(30);
    const processedVideoTrack = processedCanvasStream.getVideoTracks()[0];
    if (!processedVideoTrack) return rawStream;

    const outgoingStream = new MediaStream([
      processedVideoTrack,
      ...rawStream.getAudioTracks(),
    ]);
    processedStreamRef.current = outgoingStream;
    return outgoingStream;
  };

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
      if (!stream) return;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setHasRemoteVideo(stream.getVideoTracks().length > 0);
    };

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        peer.addTrack(track, localStreamRef.current);
      }
    }

    peerRef.current = peer;
    return peer;
  };

  const flushPendingIceCandidates = async (peer) => {
    if (!peer?.remoteDescription) return;
    if (!pendingIceCandidatesRef.current.length) return;
    const queue = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queue) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_error) {
        // Ignore stale candidates from replaced/rolled-back descriptions.
      }
    }
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
        const rawStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: initializeVideo,
        });
        rawLocalStreamRef.current = rawStream;
        const outgoingStream = await createOutgoingStream(rawStream);
        localStreamRef.current = outgoingStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = outgoingStream;
        }
        for (const video of Object.values(filterThumbRefs.current)) {
          if (!video) continue;
          if (video.srcObject !== outgoingStream) {
            video.srcObject = outgoingStream;
          }
        }
        for (const video of Object.values(effectThumbRefs.current)) {
          if (!video) continue;
          if (video.srcObject !== outgoingStream) {
            video.srcObject = outgoingStream;
          }
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
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          heartbeatIntervalRef.current = setInterval(() => {
            if (!socketRef.current) return;
            socketRef.current.emit(
              "chat:call:heartbeat",
              {
                conversationId,
                roomId,
                callId,
              },
              () => {},
            );
          }, 20000);
          setStatus(
            ack?.data?.isInitiator ? "Waiting for participant..." : "Joining call...",
          );
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
          if (peer.signalingState !== "stable") {
            await peer.setLocalDescription({ type: "rollback" });
          }
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushPendingIceCandidates(peer);
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
          if (peer.signalingState !== "have-local-offer") return;
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushPendingIceCandidates(peer);
          setStatus("Connected");
          return;
        }

        if (type === "ice" && payload?.candidate) {
          if (!peer.remoteDescription) {
            pendingIceCandidatesRef.current.push(payload.candidate);
            return;
          }
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (_error) {
        setError("Call signaling error.");
      }
    });

    socket.on("chat:call:ended", () => {
      setStatus("Call ended.");
      setHasRemoteVideo(false);
      setTimeout(() => window.close(), 600);
    });

    return () => {
      active = false;
      pendingIceCandidatesRef.current = [];
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      try {
        socket.emit("chat:call:end", { conversationId, roomId, callId }, () => {});
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
      if (rawLocalStreamRef.current) {
        for (const track of rawLocalStreamRef.current.getTracks()) track.stop();
        rawLocalStreamRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      remoteStreamRef.current = null;
      setHasRemoteVideo(false);
      stopVideoProcessing();
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
    const rawStream = rawLocalStreamRef.current;
    const stream = localStreamRef.current;
    if (!rawStream && !stream) return;
    const nextCameraOff = !cameraOff;
    for (const track of rawStream?.getVideoTracks?.() || []) {
      track.enabled = !nextCameraOff;
    }
    for (const track of stream?.getVideoTracks?.() || []) {
      track.enabled = !nextCameraOff;
    }
    setCameraOff(nextCameraOff);
  };

  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.emit(
        "chat:call:end",
        { conversationId, roomId, callId },
        () => {},
      );
    }
    window.close();
  };

  const renderFilterThumbnail = (option) => {
    const isSelected = cameraFilter === option.value;
    return (
      <button
        key={option.value}
        type="button"
        disabled={cameraOff}
        onClick={() => setCameraFilter(option.value)}
        className={`rounded-lg border p-1 text-left transition-all disabled:opacity-60 ${
          isSelected
            ? "border-blue-400 ring-2 ring-blue-500/40"
            : "border-slate-600 hover:border-slate-400"
        }`}
      >
        <div className="relative h-16 w-24 overflow-hidden rounded bg-black">
          <video
            ref={(node) => {
              filterThumbRefs.current[option.value] = node;
              if (node && localStreamRef.current && node.srcObject !== localStreamRef.current) {
                node.srcObject = localStreamRef.current;
              }
            }}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ filter: resolveCanvasFilter(option.value) }}
          />
        </div>
        <p className="mt-1 text-[11px] font-medium text-slate-200">{option.label}</p>
      </button>
    );
  };

  const renderEffectThumbnail = (option) => {
    const isSelected = cameraEffect === option.value;
    const overlayClass = resolveThumbnailOverlayClass(option.value);
    return (
      <button
        key={option.value}
        type="button"
        disabled={cameraOff}
        onClick={() => setCameraEffect(option.value)}
        className={`rounded-lg border p-1 text-left transition-all disabled:opacity-60 ${
          isSelected
            ? "border-blue-400 ring-2 ring-blue-500/40"
            : "border-slate-600 hover:border-slate-400"
        }`}
      >
        <div className={`relative h-16 w-24 overflow-hidden rounded bg-black ${overlayClass}`}>
          <video
            ref={(node) => {
              effectThumbRefs.current[option.value] = node;
              if (node && localStreamRef.current && node.srcObject !== localStreamRef.current) {
                node.srcObject = localStreamRef.current;
              }
            }}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-1 text-[11px] font-medium text-slate-200">{option.label}</p>
      </button>
    );
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <video
        ref={hasRemoteVideo ? remoteVideoRef : localVideoRef}
        autoPlay
        playsInline
        muted={!hasRemoteVideo}
        className="absolute inset-0 h-full w-full object-cover bg-black"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/60" />

      {status === "Connected" || hasRemoteVideo ? (
        <>
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={endCall}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-white"
                aria-label="Exit call"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="text-lg font-semibold drop-shadow-md">{callTitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-white"
                aria-label="Add participant"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-white"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="absolute left-3 top-1/3 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-white"
              aria-label="Emoji reactions"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowEffects((prev) => !prev)}
              className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur ${
                showEffects ? "bg-blue-500 text-white" : "bg-black/30 text-white"
              }`}
              aria-label="Effects"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={endCall}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur text-white"
            aria-label="Close call"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowEffects((prev) => !prev)}
            className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur ${
              showEffects ? "bg-blue-500 text-white" : "bg-black/35 text-white"
            }`}
            aria-label="Toggle camera effects"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      )}

      {!hasRemoteVideo ? (
        <div className="absolute inset-x-0 top-[20%] z-10 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full border border-white/50 bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl font-semibold">
            {callTitle.slice(0, 1).toUpperCase() || "C"}
          </div>
          <p className="mt-4 text-4xl font-semibold drop-shadow-md">{callTitle}</p>
          <p className="mt-1 text-lg text-slate-200">{status}</p>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </div>
      ) : (
        <div className="absolute left-4 top-16 z-20 rounded-2xl border border-white/20 bg-black/30 px-3 py-2 backdrop-blur">
          <p className="text-sm font-semibold">{callTitle}</p>
          <p className="text-xs text-slate-200">{status}</p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6">
        {status === "Connected" || hasRemoteVideo ? (
          <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-full bg-black/45 px-4 py-3 backdrop-blur-xl">
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onClick={toggleCamera}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/12 hover:bg-white/20"
                aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {cameraOff ? (
                  <Camera className="h-5 w-5 text-red-200" />
                ) : (
                  <Video className="h-5 w-5 text-white" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/12 hover:bg-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                <Mic className={`h-5 w-5 ${muted ? "text-red-200" : "text-white"}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowEffects((prev) => !prev)}
                className={`grid h-11 w-11 place-items-center rounded-full ${
                  showEffects ? "bg-blue-500 text-white" : "bg-white/12 text-white"
                }`}
                aria-label="Open effects"
              >
                <Sparkles className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/12 hover:bg-white/20"
                aria-label="Switch camera"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <button
                type="button"
                onClick={endCall}
                className="grid h-11 w-11 place-items-center rounded-full bg-red-600 hover:bg-red-700"
                aria-label="End call"
              >
                <PhoneOff className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-5">
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <Mic className={`h-6 w-6 ${muted ? "text-red-200" : "text-white"}`} />
            </button>
            <button
              type="button"
              onClick={endCall}
              className="grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-[0_8px_30px_rgba(239,68,68,0.45)] hover:bg-red-700"
              aria-label="End call"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
              aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
            >
              {cameraOff ? (
                <Camera className="h-6 w-6 text-red-200" />
              ) : (
                <Video className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        )}

        {showEffects ? (
          <div className="mx-auto mt-4 w-full max-w-xl rounded-3xl border border-white/20 bg-black/45 p-3 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Filters
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {CAMERA_FILTER_OPTIONS.map(renderFilterThumbnail)}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-200">
              Effects
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {CAMERA_EFFECT_OPTIONS.map(renderEffectThumbnail)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
