import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AIHandControl.css';

/**
 * AIHandControl
 * -------------
 * Webcam-based remote control using MediaPipe Hands.
 *
 * Features:
 * 1) Gesture-based scrolling: move your hand/cursor near the top or bottom of the screen to scroll.
 * 2) Gesture-based clicking: pinch (index finger + thumb) to click the element under the virtual cursor.
 *    (A closed fist is also detected and reported; pinch is used as the primary click gesture.)
 * 3) Visual cursor: a custom on-screen cursor tracks your index fingertip in real time.
 * 4) Toggle button: floating "AI Hand Control ✋" button to turn tracking ON/OFF.
 *
 * How it works:
 * - Loads MediaPipe Hands, Camera Utils, and Drawing Utils from CDN at runtime.
 * - Captures webcam frames and runs hand landmark detection.
 * - Maps the index fingertip (landmark 8) to viewport coordinates for the virtual cursor.
 * - Detects a pinch by measuring the normalized distance between thumb tip (4) and index tip (8).
 * - Uses edge-detection (pinch start) + cooldown to trigger a single click on document.elementFromPoint(x, y).
 * - Scrolls the window when the cursor stays in the top/bottom scroll zones.
 *
 * Package options:
 * - Default: CDN scripts (no install required), loaded dynamically when enabled.
 * - NPM alternative:
 *     npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
 *   Then replace the CDN loader with imports and configure locateFile for local assets as needed.
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
    // Sequential load to preserve global dependencies/order.
    // eslint-disable-next-line no-await-in-loop
    await loadScript(src);
  }
}

export default function AIHandControl() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState('Hand control is off.');
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, clicking: false });

  // DOM refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // MediaPipe instances
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  // Runtime refs to avoid stale closures in callbacks
  const enabledRef = useRef(false);
  const lastPinchRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Utility: count extended fingers (simple heuristic) to detect a fist gesture.
  const countExtendedFingers = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 21) return 0;

    let count = 0;
    const tipIds = [8, 12, 16, 20];
    const pipIds = [6, 10, 14, 18];

    // Fingers: tip above PIP in image coordinates means extended (for an upright hand).
    tipIds.forEach((tipId, i) => {
      if (landmarks[tipId].y < landmarks[pipIds[i]].y) count += 1;
    });

    // Thumb: compare horizontal position relative to IP joint based on hand orientation.
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];
    const rightOriented = indexMcp.x < pinkyMcp.x;
    const thumbExtended = rightOriented ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x;
    if (thumbExtended) count += 1;

    return count;
  }, []);

  // Trigger a click on the interactive element under the virtual cursor.
  const triggerClickAt = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    // Ignore clicks on the hand-control UI itself.
    if (el.closest('.ai-hand-control-root')) return;

    const target = el.closest('button, a, input, select, textarea, label, [role="button"], [onclick]') || el;

    try {
      if (typeof target.focus === 'function') target.focus({ preventScroll: true });
    } catch (_) {
      // Some elements may not be focusable; ignore.
    }

    // Dispatch pointer/mouse events for broad compatibility, then .click() if available.
    const eventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
    try { target.dispatchEvent(new PointerEvent('pointerdown', { ...eventInit, pointerType: 'mouse' })); } catch (_) {}
    try { target.dispatchEvent(new MouseEvent('mousedown', eventInit)); } catch (_) {}
    try { target.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, pointerType: 'mouse' })); } catch (_) {}
    try { target.dispatchEvent(new MouseEvent('mouseup', eventInit)); } catch (_) {}
    try { target.dispatchEvent(new MouseEvent('click', eventInit)); } catch (_) {}
    if (typeof target.click === 'function') target.click();
  }, []);

  // MediaPipe results callback: draw preview, update cursor, scroll, and detect click gestures.
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = video.videoWidth || 320;
    const height = video.videoHeight || 240;
    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Mirror preview for a natural, selfie-like interaction.
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, width, height);

    const hands = results.multiHandLandmarks || [];
    if (hands.length > 0) {
      const landmarks = hands[0];

      // Optional landmark overlay for feedback/debugging.
      if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00e5ff', lineWidth: 2 });
        window.drawLandmarks(ctx, landmarks, { color: '#22c55e', lineWidth: 1, radius: 3 });
      }

      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      // Convert normalized landmark coords to viewport coords (x mirrored to match preview).
      const viewportX = (1 - indexTip.x) * window.innerWidth;
      const viewportY = indexTip.y * window.innerHeight;

      // Pinch detection (thumb tip close to index tip).
      const dx = indexTip.x - thumbTip.x;
      const dy = indexTip.y - thumbTip.y;
      const pinchDistance = Math.sqrt(dx * dx + dy * dy);
      const isPinching = pinchDistance < 0.05;

      // Fist detection (reported in status; pinch is the primary click trigger).
      const fingersExtended = countExtendedFingers(landmarks);
      const isFist = fingersExtended <= 1;

      // Click on pinch start (edge) with cooldown to avoid repeated clicks.
      const now = Date.now();
      if (isPinching && !lastPinchRef.current && now - lastClickTimeRef.current > 700) {
        triggerClickAt(viewportX, viewportY);
        lastClickTimeRef.current = now;
        setStatus('Pinch detected: click triggered.');
      }
      lastPinchRef.current = isPinching;

      setCursor({ x: viewportX, y: viewportY, visible: true, clicking: isPinching });

      // Gesture-based scrolling when cursor is near top/bottom edges.
      if (now - lastScrollTimeRef.current > 40) {
        const topZone = window.innerHeight * 0.2;
        const bottomZone = window.innerHeight * 0.8;
        let scrollDelta = 0;

        if (viewportY < topZone) {
          const intensity = (topZone - viewportY) / Math.max(topZone, 1);
          scrollDelta = -Math.round(8 + intensity * 28);
        } else if (viewportY > bottomZone) {
          const intensity = (viewportY - bottomZone) / Math.max(window.innerHeight - bottomZone, 1);
          scrollDelta = Math.round(8 + intensity * 28);
        }

        if (scrollDelta !== 0) {
          window.scrollBy({ top: scrollDelta, behavior: 'auto' });
          if (!isPinching) {
            setStatus(scrollDelta < 0 ? 'Scrolling up...' : 'Scrolling down...');
          }
        } else if (!isPinching) {
          if (isFist) setStatus('Fist detected. Open your hand to move/scroll, pinch to click.');
          else setStatus('Hand detected. Move up/down to scroll, pinch to click.');
        }

        lastScrollTimeRef.current = now;
      }
    } else {
      setCursor((prev) => ({ ...prev, visible: false, clicking: false }));
      lastPinchRef.current = false;
      setStatus('Camera active. Show your hand to control the page.');
    }

    ctx.restore();
  }, [countExtendedFingers, triggerClickAt]);

  // Start/stop MediaPipe + webcam when toggled.
  useEffect(() => {
    let cancelled = false;

    const stop = () => {
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

      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
        try {
          const tracks = videoEl.srcObject.getTracks ? videoEl.srcObject.getTracks() : [];
          tracks.forEach((t) => t.stop());
        } catch (_) {}
        videoEl.srcObject = null;
      }

      setCursor({ x: 0, y: 0, visible: false, clicking: false });
      lastPinchRef.current = false;
    };

    const start = async () => {
      try {
        setError('');
        setStatus('Loading hand-tracking model...');

        await loadMediapipeFromCdn();
        if (cancelled || !enabledRef.current) return;

        if (!window.Hands) throw new Error('MediaPipe Hands is unavailable (window.Hands missing).');
        if (!window.Camera) throw new Error('MediaPipe Camera utils unavailable (window.Camera missing).');

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
        if (!videoEl) throw new Error('Webcam video element is not ready.');

        const camera = new window.Camera(videoEl, {
          onFrame: async () => {
            if (!enabledRef.current || !handsRef.current) return;
            try {
              await handsRef.current.send({ image: videoEl });
            } catch (_) {
              // Ignore transient frame errors during start/stop.
            }
          },
          width: 320,
          height: 240,
        });

        cameraRef.current = camera;
        await camera.start();

        if (!cancelled) {
          setStatus('Camera active. Move hand to scroll, pinch (index+thumb) to click.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to start hand control.');
          setStatus('Hand control unavailable.');
          setEnabled(false);
        }
      }
    };

    if (enabled) start();
    else {
      stop();
      setError('');
      setStatus('Hand control is off.');
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, onResults]);

  return (
    <div className="ai-hand-control-root" aria-live="polite">
      {/* Floating toggle button */}
      <button
        type="button"
        className={`ai-hand-toggle ${enabled ? 'on' : 'off'}`}
        onClick={() => setEnabled((v) => !v)}
        aria-pressed={enabled}
        title={enabled ? 'Disable AI hand control' : 'Enable AI hand control'}
      >
        <span className="ai-hand-toggle-icon" aria-hidden="true">✋</span>
        <span className="ai-hand-toggle-text">
          {enabled ? 'AI Hand Control: ON' : 'AI Hand Control: OFF'}
        </span>
      </button>

      {/* Status / preview panel (shown when enabled or on error) */}
      {(enabled || error) && (
        <div className="ai-hand-panel">
          <div className="ai-hand-status">{status}</div>
          {error ? <div className="ai-hand-error">{error}</div> : null}
          {enabled && (
            <div className="ai-hand-preview">
              <video ref={videoRef} className="ai-hand-video" playsInline muted />
              <canvas ref={canvasRef} className="ai-hand-canvas" />
            </div>
          )}
        </div>
      )}

      {/* Visual cursor that follows the user's hand */}
      {cursor.visible && (
        <div
          className={`ai-hand-cursor ${cursor.clicking ? 'clicking' : ''}`}
          style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
