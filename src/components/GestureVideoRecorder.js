import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import './GestureVideoRecorder.css';

const STATUS_LINE = '📹 Caméra active | ✌️ Démarrer (REC 🔴) | 👍 Arrêter et attacher';

function isFingerExtended(landmarks, tipId, pipId) {
  return landmarks[tipId].y < landmarks[pipId].y - 0.02;
}

function isFingerFolded(landmarks, tipId, pipId) {
  return landmarks[tipId].y > landmarks[pipId].y - 0.01;
}

function getThumbState(landmarks) {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  const rightOriented = indexMcp.x < pinkyMcp.x;
  const horizontalExtended = rightOriented ? thumbTip.x < thumbIp.x - 0.03 : thumbTip.x > thumbIp.x + 0.03;
  const verticalUp = thumbTip.y < thumbIp.y - 0.04 && thumbTip.y < thumbMcp.y - 0.03;
  const verticalDown = thumbTip.y > thumbIp.y + 0.04 && thumbTip.y > thumbMcp.y + 0.03;

  if (!horizontalExtended && !verticalUp && !verticalDown) return 'neutral';
  if (verticalUp) return 'up';
  if (verticalDown) return 'down';
  return 'side';
}

function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'none';

  const indexExtended = isFingerExtended(landmarks, 8, 6);
  const middleExtended = isFingerExtended(landmarks, 12, 10);
  const ringFolded = isFingerFolded(landmarks, 16, 14);
  const pinkyFolded = isFingerFolded(landmarks, 20, 18);
  const indexFolded = isFingerFolded(landmarks, 8, 6);
  const middleFolded = isFingerFolded(landmarks, 12, 10);
  const thumbState = getThumbState(landmarks);

  if (indexExtended && middleExtended && ringFolded && pinkyFolded) {
    return 'peace';
  }

  if (thumbState === 'up' && indexFolded && middleFolded && ringFolded && pinkyFolded) {
    return 'thumbs_up';
  }

  return 'none';
}

export default function GestureVideoRecorder({
  startGestures = ['peace'],
  stopGestures = ['thumbs_up'],
  onRecordingComplete,
  onRecordingStart,
  showPreview = false,
  showDownload = false,
  className = '',
}) {
  const [recordedUrl, setRecordedUrl] = useState('');
  const [recordedMimeType, setRecordedMimeType] = useState('video/webm');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const isRecordingRef = useRef(false);
  const isCameraOffRef = useRef(false);
  const lastGestureRef = useRef('none');
  const lastGestureTimeRef = useRef(0);
  const recordedUrlRef = useRef('');

  useEffect(() => {
    recordedUrlRef.current = recordedUrl;
  }, [recordedUrl]);

  const shutdownCamera = useCallback(() => {
    isCameraOffRef.current = true;
    setIsCameraOff(true);
    try { if (cameraRef.current && cameraRef.current.stop) cameraRef.current.stop(); } catch (_) {}
    try { if (handsRef.current && handsRef.current.close) handsRef.current.close(); } catch (_) {}
    cameraRef.current = null;
    handsRef.current = null;
    const stream = streamRef.current || (videoRef.current ? videoRef.current.srcObject : null);
    if (stream && stream.getTracks) {
      try { stream.getTracks().forEach((track) => track.stop()); } catch (_) {}
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startRecording = useCallback((trigger = 'gesture') => {
    if (isRecordingRef.current || isCameraOffRef.current) return;
    const stream = streamRef.current || (videoRef.current ? videoRef.current.srcObject : null);
    if (!stream || typeof window.MediaRecorder === 'undefined') return;

    try {
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = '';
        setRecordedUrl('');
      }

      recordedChunksRef.current = [];
      let options;
      if (window.MediaRecorder.isTypeSupported) {
        if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          options = { mimeType: 'video/webm;codecs=vp9,opus' };
        } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options = { mimeType: 'video/webm;codecs=vp8,opus' };
        } else if (window.MediaRecorder.isTypeSupported('video/webm')) {
          options = { mimeType: 'video/webm' };
        }
      }

      const recorder = options ? new window.MediaRecorder(stream, options) : new window.MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const mimeType = recorder.mimeType || (options && options.mimeType) || 'video/webm';
      setRecordedMimeType(mimeType);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        let url = '';
        if (blob.size > 0) {
          url = URL.createObjectURL(blob);
          recordedUrlRef.current = url;
          setRecordedUrl(url);
        }
        isRecordingRef.current = false;
        setIsRecording(false);
        mediaRecorderRef.current = null;
        shutdownCamera();
        if (blob.size > 0 && typeof onRecordingComplete === 'function') {
          const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `community-recording-${Date.now()}.${ext}`, { type: finalMime });
          onRecordingComplete({ url, blob, mimeType: finalMime, file, trigger });
        }
      };

      recorder.start(250);
      isRecordingRef.current = true;
      setIsRecording(true);
      if (typeof onRecordingStart === 'function') onRecordingStart({ trigger });
    } catch (_) {}
  }, [onRecordingComplete, onRecordingStart, shutdownCamera]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    try {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    } catch (_) {}
  }, []);

  const onResults = useCallback((results) => {
    if (isCameraOffRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, width, height);
    }

    const hands = results.multiHandLandmarks || [];
    let gesture = 'none';
    if (hands.length > 0) {
      const landmarks = hands[0];
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#22d3ee', lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: '#34d399', lineWidth: 1, radius: 3 });
      gesture = detectGesture(landmarks);
    }
    ctx.restore();

    if (gesture === 'none') {
      lastGestureRef.current = 'none';
      return;
    }

    const now = Date.now();
    const isNewGesture = gesture !== lastGestureRef.current;
    const cooldownPassed = now - lastGestureTimeRef.current > 1200;

    if (isNewGesture || cooldownPassed) {
      if (startGestures.includes(gesture) && !isRecordingRef.current) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        startRecording('gesture');
        return;
      }
      if (stopGestures.includes(gesture) && isRecordingRef.current) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        stopRecording();
        return;
      }
      lastGestureRef.current = gesture;
      lastGestureTimeRef.current = now;
    }
  }, [startGestures, stopGestures, startRecording, stopRecording]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        });
        hands.onResults(onResults);
        handsRef.current = hands;

        const videoEl = videoRef.current;
        if (!videoEl) return;

        const camera = new Camera(videoEl, {
          onFrame: async () => {
            if (cancelled || !handsRef.current || isCameraOffRef.current) return;
            try {
              await handsRef.current.send({ image: videoEl });
            } catch (_) {}
          },
          width: 640,
          height: 480,
        });
        cameraRef.current = camera;
        await camera.start();
        if (!cancelled) {
          streamRef.current = videoEl.srcObject || null;
        }
      } catch (_) {}
    };

    start();

    return () => {
      cancelled = true;
      try { if (cameraRef.current && cameraRef.current.stop) cameraRef.current.stop(); } catch (_) {}
      try { if (handsRef.current && handsRef.current.close) handsRef.current.close(); } catch (_) {}
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (_) {}
      }
      const stream = streamRef.current || (videoRef.current ? videoRef.current.srcObject : null);
      if (stream && stream.getTracks) {
        try { stream.getTracks().forEach((track) => track.stop()); } catch (_) {}
      }
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
    };
  }, [onResults]);

  return (
    <section className={`gesture-recorder-card ${className}`.trim()}>
      <div className="gesture-recorder-body">
        <div className="gesture-preview-panel">
          <div className="gesture-preview-frame">
            <video ref={videoRef} className="gesture-video-source" playsInline muted />
            <canvas ref={canvasRef} className="gesture-canvas-preview" />
            {isRecording ? <div className="gesture-rec-indicator" aria-label="Recording">🔴 REC</div> : null}
          </div>
          <p className="gesture-status-text" role="status" aria-live="polite">{STATUS_LINE}</p>
        </div>

        {showPreview ? (
          <div className="gesture-output-panel">
            {recordedUrl ? (
              <div className="gesture-recorded-output">
                <video className="gesture-recorded-video" src={recordedUrl} controls playsInline />
                {showDownload ? (
                  <div className="gesture-output-actions">
                    <a
                      className="gesture-download-link"
                      href={recordedUrl}
                      download={`talentbridge-recording-${Date.now()}.webm`}
                    >
                      Télécharger la vidéo
                    </a>
                    <span className="gesture-mime-note">{recordedMimeType}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
