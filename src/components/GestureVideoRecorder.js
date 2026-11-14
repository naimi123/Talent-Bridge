import React, { useCallback, useEffect, useRef, useState } from 'react';
import './GestureVideoRecorder.css';

/**
 * GestureVideoRecorder (Always-On)
 * --------------------------------
 * AI webcam hand-gesture control for recording videos/capturing media using MediaPipe Hands.
 *
 * Behavior:
 * - Auto-initializes webcam/permissions and starts MediaPipe on mount (no manual click required).
 * - Keeps gesture detection running continuously on the live video stream.
 * - Default gestures:
 *   - Start recording: Fist (✊) or Open Palm (✋)
 *   - Stop recording & attach video: Peace Sign (✌️) or Thumbs Up (👍)
 *
 * Callbacks:
 * - onRecordingComplete({ url, blob, mimeType, file, trigger })
 * - onRecordingStart({ trigger })
 * - onGestureDetected(gesture)
 */

const MEDIAPIPE_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

async function loadMediapipeFromCdn() {
  for (const src of MEDIAPIPE_SCRIPTS) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(src);
  }
}

function isFingerExtended(landmarks, tipId, pipId) {
  // In image coordinates, smaller y means higher on screen (extended for upright hand).
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
  const ringExtended = isFingerExtended(landmarks, 16, 14);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18);

  const indexFolded = isFingerFolded(landmarks, 8, 6);
  const middleFolded = isFingerFolded(landmarks, 12, 10);
  const ringFolded = isFingerFolded(landmarks, 16, 14);
  const pinkyFolded = isFingerFolded(landmarks, 20, 18);

  const thumbState = getThumbState(landmarks);
  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // Peace sign / victory: index + middle extended, ring + pinky folded
  if (indexExtended && middleExtended && ringFolded && pinkyFolded) {
    return 'peace';
  }

  // Thumbs up/down: thumb vertical, other fingers folded
  if ((thumbState === 'up' || thumbState === 'down') && indexFolded && middleFolded && ringFolded && pinkyFolded) {
    return thumbState === 'up' ? 'thumbs_up' : 'thumbs_down';
  }

  // Open palm: most fingers extended
  if (extendedCount >= 4 && (thumbState === 'up' || thumbState === 'side' || thumbState === 'neutral')) {
    return 'open_palm';
  }

  // Fist: fingers folded
  if (indexFolded && middleFolded && ringFolded && pinkyFolded && thumbState !== 'up') {
    return 'fist';
  }

  return 'none';
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function gestureToLabel(gesture) {
  if (gesture === 'thumbs_up') return 'Pouce levé 👍';
  if (gesture === 'thumbs_down') return 'Pouce vers le bas 👍';
  if (gesture === 'peace') return 'Signe de paix ✌️';
  if (gesture === 'open_palm') return 'Main ouverte ✋';
  if (gesture === 'fist') return 'Poing ✊';
  return 'Aucun';
}

function gestureHintIcons(gestures) {
  if (!gestures || gestures.length === 0) return '';
  return gestures
    .map((g) => {
      if (g === 'peace') return '✌️';
      if (g === 'thumbs_up' || g === 'thumbs_down') return '👍';
      if (g === 'open_palm') return '✋';
      if (g === 'fist') return '✊';
      return g;
    })
    .join(' / ');
}

function gestureHintText(gestures, action) {
  const icons = gestureHintIcons(gestures);
  if (!icons) return action;
  return `${action} (${icons})`;
}

export default function GestureVideoRecorder({
  title = 'Caméra IA mains libres',
  subtitle = 'Détection continue des gestes : la caméra reste active et prête à enregistrer.',
  startGestures = ['fist', 'open_palm'],
  stopGestures = ['peace', 'thumbs_up'],
  continuous = true,
  autoEnable = true,
  onRecordingComplete,
  onRecordingStart,
  onGestureDetected,
  showPreview = true,
  showDownload = true,
  className = '',
}) {
  const [enabled, setEnabled] = useState(autoEnable);
  const [status, setStatus] = useState(autoEnable ? 'Initialisation de la caméra...' : 'AI Hand Control désactivé.');
  const [error, setError] = useState('');
  const [detectedGesture, setDetectedGesture] = useState('none');
  const [gestureFeedback, setGestureFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [recordedMimeType, setRecordedMimeType] = useState('video/webm');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const enabledRef = useRef(autoEnable);
  const isRecordingRef = useRef(false);
  const lastGestureRef = useRef('none');
  const lastGestureTimeRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const recordedUrlRef = useRef('');

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    recordedUrlRef.current = recordedUrl;
  }, [recordedUrl]);

  // Ensure camera starts on mount for always-on behavior (no manual click required)
  useEffect(() => {
    if (autoEnable) {
      setEnabled(true);
      enabledRef.current = true;
    }
  }, [autoEnable]);

  const showGestureFeedback = useCallback((message) => {
    setGestureFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setGestureFeedback('');
    }, 2500);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecordingTimer = useCallback(() => {
    stopRecordingTimer();
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  }, [stopRecordingTimer]);

  const stopCameraStream = useCallback(() => {
    try {
      if (cameraRef.current && typeof cameraRef.current.stop === 'function') {
        cameraRef.current.stop();
      }
    } catch (_) {}
    cameraRef.current = null;

    try {
      if (handsRef.current && typeof handsRef.current.close === 'function') {
        handsRef.current.close();
      }
    } catch (_) {}
    handsRef.current = null;

    const stream = streamRef.current || (videoRef.current ? videoRef.current.srcObject : null);
    if (stream && stream.getTracks) {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (_) {}
    }
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    stopRecordingTimer();
  }, [stopRecordingTimer]);

  const startRecording = useCallback((trigger = 'manual') => {
    if (isRecordingRef.current) return;

    const stream = streamRef.current || (videoRef.current ? videoRef.current.srcObject : null);
    if (!stream) {
      setError('Flux caméra indisponible. Initialisation en cours...');
      return;
    }

    if (typeof window.MediaRecorder === 'undefined') {
      setError('MediaRecorder n’est pas supporté par ce navigateur.');
      return;
    }

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

      recorder.onerror = () => {
        setError('Erreur pendant l’enregistrement vidéo.');
        setIsRecording(false);
        isRecordingRef.current = false;
        stopRecordingTimer();
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        const finalMime = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        let url = '';

        if (blob.size > 0) {
          url = URL.createObjectURL(blob);
          recordedUrlRef.current = url;
          setRecordedUrl(url);
        }

        setIsRecording(false);
        isRecordingRef.current = false;
        mediaRecorderRef.current = null;

        if (blob.size > 0 && typeof onRecordingComplete === 'function') {
          const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `community-recording-${Date.now()}.${ext}`, { type: finalMime });
          onRecordingComplete({ url, blob, mimeType: finalMime, file, trigger });
        }

        if (continuous && enabledRef.current) {
          setStatus('Vidéo capturée et attachée. Caméra prête - Montrez votre main pour commencer ✋ / ✊');
          showGestureFeedback('Vidéo arrêtée et attachée au post. Détection toujours active.');
        } else {
          stopCameraStream();
          setEnabled(false);
          enabledRef.current = false;
          setStatus('Vidéo capturée. Caméra fermée.');
        }
      };

      recorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      startRecordingTimer();
      setError('');
      setStatus(`Enregistrement en cours... ${gestureHintText(stopGestures, 'Montrez le geste pour arrêter et attacher')}`);
      showGestureFeedback(trigger === 'gesture' ? 'Geste détecté : Démarrage de l’enregistrement 🎥' : 'Démarrage de l’enregistrement 🎥');
      if (typeof onRecordingStart === 'function') onRecordingStart({ trigger });
    } catch (e) {
      setError(e?.message || 'Impossible de démarrer l’enregistrement.');
    }
  }, [continuous, onRecordingComplete, onRecordingStart, showGestureFeedback, startRecordingTimer, stopCameraStream, stopGestures, stopRecordingTimer]);

  const stopRecording = useCallback((reason = 'manual') => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    try {
      setStatus('Arrêt de l’enregistrement et attachement de la vidéo...');
      showGestureFeedback(reason === 'gesture' ? 'Geste détecté : Arrêt de l’enregistrement / attachement vidéo' : 'Arrêt de l’enregistrement...');
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    } catch (e) {
      setError(e?.message || 'Impossible d’arrêter l’enregistrement.');
      setIsRecording(false);
      isRecordingRef.current = false;
      stopRecordingTimer();
    }
  }, [showGestureFeedback, stopRecordingTimer]);

  const onResults = useCallback((results) => {
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

    // Mirror preview for natural interaction
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, width, height);
    }

    const hands = results.multiHandLandmarks || [];
    let gesture = 'none';

    if (hands.length > 0) {
      const landmarks = hands[0];
      if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#22d3ee', lineWidth: 2 });
        window.drawLandmarks(ctx, landmarks, { color: '#34d399', lineWidth: 1, radius: 3 });
      }
      gesture = detectGesture(landmarks);
    }

    ctx.restore();

    setDetectedGesture(gesture);
    if (gesture !== 'none' && typeof onGestureDetected === 'function') {
      onGestureDetected(gesture);
    }

    if (gesture === 'none') {
      lastGestureRef.current = 'none';
      return;
    }

    const now = Date.now();
    const isNewGesture = gesture !== lastGestureRef.current;
    const cooldownPassed = now - lastGestureTimeRef.current > 1200;

    if (isNewGesture || cooldownPassed) {
      const shouldStart = startGestures.includes(gesture) && !isRecordingRef.current;
      const shouldStop = stopGestures.includes(gesture) && isRecordingRef.current;

      if (shouldStart) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        startRecording('gesture');
        return;
      }

      if (shouldStop) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        stopRecording('gesture');
        return;
      }

      if (stopGestures.includes(gesture) && !isRecordingRef.current) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        showGestureFeedback(`Geste détecté : ${gestureToLabel(gesture)} (aucun enregistrement en cours)`);
        return;
      }

      if (startGestures.includes(gesture) && isRecordingRef.current) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;
        showGestureFeedback(`Geste détecté : ${gestureToLabel(gesture)} (enregistrement déjà en cours)`);
      }
    }
  }, [onGestureDetected, showGestureFeedback, startGestures, startRecording, stopGestures, stopRecording]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        setError('');
        setCameraReady(false);
        setStatus('Initialisation de la caméra et du modèle IA...');

        await loadMediapipeFromCdn();
        if (cancelled || !enabledRef.current) return;

        if (!window.Hands) throw new Error('MediaPipe Hands indisponible (window.Hands manquant).');
        if (!window.Camera) throw new Error('MediaPipe Camera utils indisponible (window.Camera manquant).');

        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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
        if (!videoEl) throw new Error('Élément vidéo introuvable.');

        const camera = new window.Camera(videoEl, {
          onFrame: async () => {
            if (!enabledRef.current || !handsRef.current) return;
            try {
              await handsRef.current.send({ image: videoEl });
            } catch (_) {
              // Ignore transient frame errors
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        await camera.start();

        if (cancelled) return;

        streamRef.current = videoEl.srcObject || null;
        setCameraReady(true);
        setStatus('Caméra prête - Montrez votre main pour commencer ✋ / ✊');
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Impossible de démarrer la caméra / la détection des gestes.');
          setStatus('AI Hand Control indisponible. Vérifiez les permissions caméra.');
          setCameraReady(false);
          setEnabled(false);
          enabledRef.current = false;
          stopCameraStream();
        }
      }
    };

    if (enabled) {
      start();
    } else {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (_) {}
      }
      stopCameraStream();
      setDetectedGesture('none');
      setGestureFeedback('');
      if (!error) setStatus('AI Hand Control désactivé.');
      if (!isRecordingRef.current) setRecordingSeconds(0);
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, onResults, stopCameraStream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      stopRecordingTimer();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (_) {}
      }
      stopCameraStream();
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gestureLabel = gestureToLabel(detectedGesture);
  const startHint = gestureHintText(startGestures, 'Démarrer');
  const stopHint = gestureHintText(stopGestures, 'Arrêter & attacher');
  const liveBannerText = isRecording
    ? `Enregistrement en cours... ${stopHint}`
    : (cameraReady ? 'Caméra prête - Montrez votre main pour commencer ✋ / ✊' : status);

  return (
    <section className={`gesture-recorder-card ${className}`.trim()}>
      <div className="gesture-recorder-header">
        <div>
          <h4 className="gesture-recorder-title">{title}</h4>
          <p className="gesture-recorder-subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className={`ai-hand-badge-toggle ${enabled ? 'on' : 'off'}`}
          onClick={() => {
            setEnabled((v) => {
              const next = !v;
              enabledRef.current = next;
              return next;
            });
          }}
          aria-pressed={enabled}
          title={enabled ? 'Désactiver AI Hand Control' : 'Activer AI Hand Control'}
        >
          <span className="ai-hand-badge-dot" aria-hidden="true" />
          <span>{enabled ? 'AI Hand Control: ON' : 'AI Hand Control: OFF'}</span>
        </button>
      </div>

      <div className="gesture-live-banner" role="status" aria-live="polite">
        <span className={`gesture-live-dot ${cameraReady ? 'ready' : ''} ${isRecording ? 'recording' : ''}`} aria-hidden="true" />
        <span>{liveBannerText}</span>
      </div>

      <div className="gesture-recorder-status-row">
        <div className={`recording-indicator ${isRecording ? 'live' : ''}`} aria-live="polite">
          <span className="recording-dot" aria-hidden="true" />
          <span>{isRecording ? `REC ${formatTime(recordingSeconds)}` : 'Prêt'}</span>
        </div>
        <div className="gesture-chip">Geste détecté: <strong>{gestureLabel}</strong></div>
      </div>

      {gestureFeedback ? <div className="gesture-feedback-banner">{gestureFeedback}</div> : null}
      {error ? <div className="gesture-error-banner">{error}</div> : null}

      <div className="gesture-recorder-body">
        <div className="gesture-preview-panel">
          <div className="gesture-preview-frame">
            <video ref={videoRef} className="gesture-video-source" playsInline muted />
            {enabled ? (
              <canvas ref={canvasRef} className="gesture-canvas-preview" />
            ) : (
              <div className="gesture-preview-placeholder">
                <p>AI Hand Control est désactivé.</p>
                <p>Réactivez-le pour démarrer automatiquement la caméra et la détection des gestes.</p>
              </div>
            )}
            {isRecording ? <div className="live-recording-badge">● Enregistrement en cours</div> : null}
          </div>
          <p className="gesture-status-text">{status}</p>

          <div className="gesture-manual-actions">
            <button
              type="button"
              className="gesture-action-btn start"
              onClick={() => startRecording('manual')}
              disabled={!enabled || !cameraReady || isRecording}
              title={`${startHint} (manuel ou geste)`}
            >
              {startHint}
            </button>
            <button
              type="button"
              className="gesture-action-btn stop"
              onClick={() => stopRecording('manual')}
              disabled={!enabled || !isRecording}
              title={`${stopHint} (manuel ou geste)`}
            >
              {stopHint}
            </button>
          </div>

          <div className="gesture-mapping-hints">
            <span><strong>Démarrer :</strong> ✋ Main ouverte / ✊ Poing</span>
            <span><strong>Arrêter & attacher :</strong> ✌️ Peace / 👍 Pouce</span>
          </div>
        </div>

        {showPreview ? (
          <div className="gesture-output-panel">
            <h5 className="gesture-output-title">Aperçu / média enregistré</h5>
            {recordedUrl ? (
              <div className="gesture-recorded-output">
                <video className="gesture-recorded-video" src={recordedUrl} controls playsInline />
                <div className="gesture-output-actions">
                  {showDownload ? (
                    <a
                      className="gesture-download-link"
                      href={recordedUrl}
                      download={`talentbridge-recording-${Date.now()}.webm`}
                    >
                      Télécharger la vidéo
                    </a>
                  ) : <span />}
                  <span className="gesture-mime-note">{recordedMimeType}</span>
                </div>
              </div>
            ) : (
              <div className="gesture-output-empty">
                <p>Aucune vidéo enregistrée pour le moment.</p>
                <p className="gesture-output-hint">La caméra reste prête : faites un geste pour démarrer, puis un geste d’arrêt pour attacher la vidéo.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
