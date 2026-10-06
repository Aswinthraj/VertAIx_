import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';
import { getPostureWebSocketUrl, processFrame } from '../services/api';
import './CameraViewport.css';

const CameraViewport = ({
  status = 'Good Posture',
  pcs = 85,
  landmarksDetected = true,
  onSimulateState,
  onPoseUpdate
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [transportMode, setTransportMode] = useState('idle'); // 'ws' | 'http' | 'idle'
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const sendLoopTimerRef = useRef(null);
  const isSendingHttpRef = useRef(false);
  const lastSendTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsCalcTimeRef = useRef(Date.now());

  // Stop all camera and network transport
  const stopWebcam = useCallback(() => {
    if (sendLoopTimerRef.current) {
      clearInterval(sendLoopTimerRef.current);
      sendLoopTimerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    isSendingHttpRef.current = false;
    setCameraActive(false);
    setTransportMode('idle');
    setFps(0);
    setLatencyMs(0);
  }, []);

  // Frame processing via HTTP fallback
  const sendFrameHttp = useCallback(async (canvas) => {
    if (isSendingHttpRef.current) return;
    isSendingHttpRef.current = true;

    try {
      const sendTime = Date.now();
      const b64 = canvas.toDataURL('image/jpeg', 0.65);
      const result = await processFrame(b64);
      const roundTrip = Date.now() - sendTime;
      setLatencyMs(roundTrip);

      frameCountRef.current += 1;
      const now = Date.now();
      if (now - lastFpsCalcTimeRef.current >= 1000) {
        const measuredFps = (frameCountRef.current * 1000) / (now - lastFpsCalcTimeRef.current);
        setFps(Number(measuredFps.toFixed(1)));
        frameCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
      }

      if (onPoseUpdate && result) {
        onPoseUpdate(result);
      }
    } catch (err) {
      console.warn('[CameraViewport] HTTP frame transport error:', err);
    } finally {
      isSendingHttpRef.current = false;
    }
  }, [onPoseUpdate]);

  // Start continuous frame extraction & transport loop (~10-12 FPS)
  const startFrameLoop = useCallback(() => {
    if (sendLoopTimerRef.current) {
      clearInterval(sendLoopTimerRef.current);
    }

    // Prepare offscreen canvas for resolution throttling (320x240 for optimal speed/accuracy)
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
    }

    sendLoopTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Try WebSocket transport if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        lastSendTimeRef.current = Date.now();
        canvas.toBlob(
          (blob) => {
            if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(blob);
            }
          },
          'image/jpeg',
          0.65
        );
      } else {
        // 2. Fallback to HTTP POST
        sendFrameHttp(canvas);
      }
    }, 90); // ~11 FPS
  }, [sendFrameHttp]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = getPostureWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setTransportMode('ws');
        setCameraError(null);
      };

      ws.onmessage = (event) => {
        try {
          const roundTrip = Date.now() - lastSendTimeRef.current;
          if (roundTrip > 0 && roundTrip < 2000) {
            setLatencyMs(roundTrip);
          }

          frameCountRef.current += 1;
          const now = Date.now();
          if (now - lastFpsCalcTimeRef.current >= 1000) {
            const measuredFps = (frameCountRef.current * 1000) / (now - lastFpsCalcTimeRef.current);
            setFps(Number(measuredFps.toFixed(1)));
            frameCountRef.current = 0;
            lastFpsCalcTimeRef.current = now;
          }

          const result = JSON.parse(event.data);
          if (onPoseUpdate && result && !result.error) {
            onPoseUpdate(result);
          }
        } catch (parseErr) {
          console.debug('[CameraViewport] Telemetry parse err:', parseErr);
        }
      };

      ws.onerror = (err) => {
        console.warn('[CameraViewport] WebSocket error, switching to HTTP transport fallback:', err);
        setTransportMode('http');
      };

      ws.onclose = () => {
        if (cameraActive) {
          setTransportMode('http');
        }
      };
    } catch (e) {
      console.warn('[CameraViewport] WebSocket initialization failed, using HTTP fallback:', e);
      setTransportMode('http');
    }
  }, [cameraActive, onPoseUpdate]);

  // Toggle local webcam preview and frame streaming
  const toggleCamera = async () => {
    if (cameraActive) {
      stopWebcam();
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 30 },
            facingMode: 'user',
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);

        // Connect frame transport
        connectWebSocket();
        startFrameLoop();
      } catch (err) {
        console.warn('Webcam acquisition error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Webcam permission denied. Please grant camera permissions in your browser address bar.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No webcam found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('Webcam is currently in use by another application.');
        } else {
          setCameraError(`Camera error: ${err.message || 'Unable to access webcam'}`);
        }
        setCameraActive(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return (
    <div className="camera-viewport-card">
      <div className="viewport-header">
        <div className="viewport-title-group">
          <span className="viewport-kicker">Browser Optical Telemetry</span>
          <h3 className="viewport-heading">Real-Time Pose Tracker</h3>
        </div>
        <div className="viewport-actions">
          <button
            className={`camera-toggle-btn ${cameraActive ? 'active' : ''}`}
            onClick={toggleCamera}
            title={cameraActive ? 'Disable webcam stream' : 'Enable live browser webcam stream'}
          >
            {cameraActive ? <CameraOff size={15} /> : <Camera size={15} />}
            <span>{cameraActive ? 'Camera Live' : 'Enable Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Window */}
      <div className="viewport-screen">
        {/* Actual Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`viewport-video ${cameraActive ? 'visible' : 'hidden'}`}
        />

        {/* Fallback Holographic Skeleton Screen when camera is off */}
        {!cameraActive && (
          <div className="hologram-screen">
            <div className="hologram-scanline" />
            <div className="hologram-content">
              <div className="hologram-target-circle">
                <div className="target-crosshair vertical" />
                <div className="target-crosshair horizontal" />
                <div className="target-head-silhouette" />
              </div>
              <p className="hologram-text">
                {landmarksDetected ? 'Spatial Primary User Locked' : 'MediaPipe Vision Pipeline Ready'}
              </p>

              <button className="hologram-start-btn" onClick={toggleCamera}>
                <Camera size={16} />
                <span>Start Live Webcam Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* HUD Tactical Overlays */}
        <div className="hud-overlay-layer">
          {/* Top Left Status */}
          <div className="hud-badge top-left">
            <span className="hud-pulse-light" />
            <span>
              {cameraActive
                ? `OPTICAL FEED ACTIVE (${transportMode.toUpperCase()})`
                : 'TELEMETRY STANDBY'}
            </span>
          </div>

          {/* Top Right Live Stats */}
          <div className="hud-badge top-right">
            <span>{fps > 0 ? `${fps} FPS` : cameraActive ? 'STREAMING...' : '0 FPS'}</span>
            <span className="hud-divider">|</span>
            <span>{latencyMs > 0 ? `${latencyMs}ms RTT` : 'ONLINE'}</span>
          </div>

          {/* Reticle Target Alignment Guides */}
          <div className="hud-corner-bracket top-l" />
          <div className="hud-corner-bracket top-r" />
          <div className="hud-corner-bracket bot-l" />
          <div className="hud-corner-bracket bot-r" />

          {/* Center Ergonomic Eye-Level Alignment Line */}
          <div className="hud-eye-guide">
            <span className="guide-label">OPTICAL EYE LEVEL AXIS</span>
          </div>

          {/* Live Classification Tag Banner on video */}
          <div
            className={`hud-state-banner ${
              status === 'Good Posture'
                ? 'good'
                : status === 'Posture Warning'
                ? 'warning'
                : 'bad'
            }`}
          >
            {status === 'Good Posture' ? (
              <CheckCircle2 size={14} />
            ) : (
              <ShieldAlert size={14} />
            )}
            <span>
              {status.toUpperCase()} (PCS {pcs.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="viewport-notice-bar">
          <small>{cameraError}</small>
        </div>
      )}

      {/* Interactive Telemetry Simulator Toolbar */}
      {onSimulateState && (
        <div className="simulator-toolbar">
          <div className="simulator-label">
            <Zap size={13} />
            <span>Interactive State Tester:</span>
          </div>
          <div className="simulator-buttons">
            <button
              className="sim-btn good"
              onClick={() => onSimulateState('good')}
              title="Test Good Posture State"
            >
              Good Alignment
            </button>
            <button
              className="sim-btn warning"
              onClick={() => onSimulateState('warning')}
              title="Test Text Neck / Forward Tilt State"
            >
              Text Neck
            </button>
            <button
              className="sim-btn bad"
              onClick={() => onSimulateState('bad')}
              title="Test Severe Slouch State"
            >
              Slouch Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraViewport;
