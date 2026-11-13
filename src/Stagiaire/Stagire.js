import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FolderCss/Stagiaire.css';

/**
 * Gesture Control (AI Hand Tracking)
 * ----------------------------------
 * This screen includes an optional webcam-based hand gesture control for scrolling.
 *
 * Default implementation: loads MediaPipe Hands from CDN at runtime (no npm install required).
 * - https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js
 * - https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js
 * - https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js
 *
 * Optional (if you prefer npm packages instead of CDN), install:
 *   npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
 * and replace the CDN loader with imports from those packages.
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
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
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

async function loadMediapipeScripts() {
  // Load sequentially to respect dependencies (hands relies on globals in some builds).
  for (const src of MEDIAPIPE_SCRIPTS) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(src);
  }
}

function Stagiaire() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    cef: '',
    filiere: '',
    groupe: '',
    motDePasse: '',
  });

  const [touched, setTouched] = useState({
    nom: false,
    prenom: false,
    cef: false,
    filiere: false,
    groupe: false,
    motDePasse: false,
  });

  // --- Gesture control state ---
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('Gesture control is off.');
  const [gestureError, setGestureError] = useState('');

  // Refs for webcam, canvas, and MediaPipe instances
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureEnabledRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  // Keep a ref in sync so async callbacks see the latest toggle state.
  useEffect(() => {
    gestureEnabledRef.current = gestureEnabled;
  }, [gestureEnabled]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(function (prev) {
      return { ...prev, [name]: value };
    });
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(function (prev) {
      return { ...prev, [name]: true };
    });
  }

  // Mot de passe : minimum 8 caractères avec lettres et chiffres
  function isValidPassword(password) {
    if (password.length < 8) return false;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  }

  const nomValid = formData.nom.trim() !== '';
  const prenomValid = formData.prenom.trim() !== '';
  const cefValid = formData.cef.trim() !== '';
  const filiereValid = formData.filiere.trim() !== '';
  const groupeValid = formData.groupe.trim() !== '';
  const passwordValid = isValidPassword(formData.motDePasse);

  // Bouton désactivé tant que tous les champs requis ne sont pas correctement remplis
  const isFormValid =
    nomValid && prenomValid && cefValid && filiereValid && groupeValid && passwordValid;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;
    // Redirection instantanée vers le dashboard stagiaire après inscription réussie
    navigate('/stagiaire/dashboard');
  }

  /**
   * Count extended fingers from MediaPipe hand landmarks.
   * Uses a simple heuristic:
   * - Index/Middle/Ring/Pinky: tip above PIP joint (smaller y in image coords).
   * - Thumb: tip to the side of IP joint depending on hand orientation.
   */
  function countExtendedFingers(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0;

    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    let count = 0;

    tips.forEach((tipIdx, i) => {
      if (landmarks[tipIdx].y < landmarks[pips[i]].y) count += 1;
    });

    // Thumb: compare x distance from wrist side (rough heuristic, works for most orientations).
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexMcp = landmarks[5];
    const isRightOriented = indexMcp.x < landmarks[17].x;
    const thumbExtended = isRightOriented
      ? thumbTip.x < thumbIp.x
      : thumbTip.x > thumbIp.x;
    if (thumbExtended) count += 1;

    return count;
  }

  /**
   * Handle MediaPipe results:
   * - Draw landmarks on the preview canvas.
   * - Detect gesture (open hand vs fist).
   * - Scroll the page based on hand vertical position when an open hand is detected.
   */
  function onHandsResults(results) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw landmarks/connectors if drawing utils are available.
      if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00e5ff',
          lineWidth: 2,
        });
        window.drawLandmarks(ctx, landmarks, { color: '#22c55e', lineWidth: 1, radius: 3 });
      }

      const fingers = countExtendedFingers(landmarks);
      const wrist = landmarks[0];
      const y = wrist.y; // 0 = top, 1 = bottom (normalized)

      // Open hand (>= 4 fingers): enable position-based scrolling.
      // Fist (<= 1 finger): pause/stop scrolling action.
      if (fingers >= 4) {
        const now = Date.now();
        // Throttle scroll updates to keep motion smooth and avoid excessive calls.
        if (now - lastScrollTimeRef.current > 50) {
          const deadZoneTop = 0.4;
          const deadZoneBottom = 0.6;
          let delta = 0;

          if (y < deadZoneTop) {
            // Hand in upper area -> scroll up (speed increases closer to top).
            const intensity = (deadZoneTop - y) / deadZoneTop;
            delta = -Math.round(10 + intensity * 35);
          } else if (y > deadZoneBottom) {
            // Hand in lower area -> scroll down (speed increases closer to bottom).
            const intensity = (y - deadZoneBottom) / (1 - deadZoneBottom);
            delta = Math.round(10 + intensity * 35);
          }

          if (delta !== 0) {
            window.scrollBy({ top: delta, behavior: 'auto' });
            setGestureStatus(delta < 0 ? 'Open hand detected: scrolling up...' : 'Open hand detected: scrolling down...');
          } else {
            setGestureStatus('Open hand detected: hold steady (neutral zone).');
          }

          lastScrollTimeRef.current = now;
        }
      } else if (fingers <= 1) {
        setGestureStatus('Fist detected: scrolling paused.');
      } else {
        setGestureStatus('Hand detected. Use an open hand to scroll, fist to pause.');
      }
    } else {
      setGestureStatus('Camera active. Show your hand to control scrolling.');
    }

    ctx.restore();
  }

  // Start MediaPipe Hands + webcam when gesture control is enabled.
  useEffect(() => {
    let cancelled = false;

    async function startGestureControl() {
      try {
        setGestureError('');
        setGestureStatus('Loading hand-tracking model...');

        await loadMediapipeScripts();
        if (cancelled || !gestureEnabledRef.current) return;

        if (!window.Hands) {
          throw new Error('MediaPipe Hands failed to initialize (window.Hands unavailable).');
        }

        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        });
        hands.onResults(onHandsResults);
        handsRef.current = hands;

        const videoEl = videoRef.current;
        if (!videoEl) throw new Error('Video element not available.');

        if (!window.Camera) {
          throw new Error('MediaPipe Camera utility unavailable (window.Camera missing).');
        }

        const camera = new window.Camera(videoEl, {
          onFrame: async () => {
            if (!gestureEnabledRef.current || !handsRef.current) return;
            try {
              await handsRef.current.send({ image: videoEl });
            } catch (err) {
              // Ignore transient frame errors while stopping/starting.
            }
          },
          width: 320,
          height: 240,
        });

        cameraRef.current = camera;
        await camera.start();

        if (!cancelled) {
          setGestureStatus('Camera active. Open hand to scroll (up/down), fist to pause.');
        }
      } catch (err) {
        if (!cancelled) {
          setGestureError(err?.message || 'Unable to start gesture control.');
          setGestureStatus('Gesture control unavailable.');
          setGestureEnabled(false);
        }
      }
    }

    function stopGestureControl() {
      try {
        if (cameraRef.current && typeof cameraRef.current.stop === 'function') {
          cameraRef.current.stop();
        }
      } catch (_) {
        // noop
      }
      cameraRef.current = null;

      try {
        if (handsRef.current && typeof handsRef.current.close === 'function') {
          handsRef.current.close();
        }
      } catch (_) {
        // noop
      }
      handsRef.current = null;

      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getTracks ? videoEl.srcObject.getTracks() : [];
        tracks.forEach((t) => t.stop());
        videoEl.srcObject = null;
      }
    }

    if (gestureEnabled) {
      startGestureControl();
    } else {
      stopGestureControl();
      setGestureError('');
      setGestureStatus('Gesture control is off.');
    }

    return () => {
      cancelled = true;
      stopGestureControl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestureEnabled]);

  function toggleGestureControl() {
    setGestureEnabled((prev) => !prev);
  }

  return (
    <div className="stagiaire-page">
      <div className="stagiaire-card">
        <h1 className="stagiaire-title">Espace Stagiaire</h1>
        <p className="stagiaire-subtitle">TalentBridge — Créer mon compte</p>

        {/* AI Gesture Control toggle and webcam preview */}
        <section className="gesture-control-panel" aria-label="AI Gesture Control">
          <div className="gesture-control-header">
            <button
              type="button"
              className={`gesture-toggle-btn ${gestureEnabled ? 'active' : ''}`}
              onClick={toggleGestureControl}
            >
              AI Gesture Control ✋ {gestureEnabled ? '(On)' : '(Off)'}
            </button>
          </div>

          <p className="gesture-status">{gestureStatus}</p>
          {gestureError ? <p className="gesture-error">{gestureError}</p> : null}

          {gestureEnabled && (
            <div className="gesture-preview">
              {/* Hidden video source for MediaPipe Camera; canvas shows the preview/output */}
              <video ref={videoRef} className="gesture-video" playsInline muted />
              <canvas ref={canvasRef} className="gesture-canvas" />
              <p className="gesture-hint">
                Open hand: scroll by moving hand up/down. Fist: pause scrolling.
              </p>
            </div>
          )}
        </section>

        <form className="stagiaire-form" onSubmit={handleSubmit} noValidate>
          {/* 1. Nom */}
          <div className="stagiaire-field">
            <label htmlFor="nom">Nom *</label>
            <input
              id="nom"
              name="nom"
              type="text"
              placeholder="Votre nom"
              value={formData.nom}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.nom && !nomValid ? 'input-error' : ''}
              required
            />
            {touched.nom && !nomValid && (
              <p className="field-helper error">Le nom est requis.</p>
            )}
          </div>

          {/* 2. Prénom */}
          <div className="stagiaire-field">
            <label htmlFor="prenom">Prénom *</label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              placeholder="Votre prénom"
              value={formData.prenom}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.prenom && !prenomValid ? 'input-error' : ''}
              required
            />
            {touched.prenom && !prenomValid && (
              <p className="field-helper error">Le prénom est requis.</p>
            )}
          </div>

          {/* 3. CEF */}
          <div className="stagiaire-field">
            <label htmlFor="cef">CEF *</label>
            <input
              id="cef"
              name="cef"
              type="text"
              placeholder="ex: 2024XXXXXXXX"
              value={formData.cef}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.cef && !cefValid ? 'input-error' : ''}
              required
            />
            {touched.cef && !cefValid && (
              <p className="field-helper error">Le CEF est requis.</p>
            )}
          </div>

          {/* 4. Filière */}
          <div className="stagiaire-field">
            <label htmlFor="filiere">Filière *</label>
            <select
              id="filiere"
              name="filiere"
              value={formData.filiere}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.filiere && !filiereValid ? 'input-error' : ''}
              required
            >
              <option value="">-- Sélectionner une filière --</option>
              <option value="Développement Digital">Développement Digital</option>
              <option value="Infrastructure Digitale">Infrastructure Digitale</option>
              <option value="Infographie">Infographie</option>
              <option value="Gestion des Entreprises">Gestion des Entreprises</option>
            </select>
            {touched.filiere && !filiereValid && (
              <p className="field-helper error">La filière est requise.</p>
            )}
          </div>

          {/* 5. Groupe */}
          <div className="stagiaire-field">
            <label htmlFor="groupe">Groupe *</label>
            <input
              id="groupe"
              name="groupe"
              type="text"
              placeholder="DEV101"
              value={formData.groupe}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.groupe && !groupeValid ? 'input-error' : ''}
              required
            />
            {touched.groupe && !groupeValid && (
              <p className="field-helper error">Le groupe est requis.</p>
            )}
          </div>

          {/* 6. Mot de passe */}
          <div className="stagiaire-field">
            <label htmlFor="motDePasse">Mot de passe *</label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              placeholder="Votre mot de passe"
              value={formData.motDePasse}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.motDePasse && !passwordValid ? 'input-error' : ''}
              required
            />
            {touched.motDePasse && formData.motDePasse === '' && (
              <p className="field-helper error">Le mot de passe est requis.</p>
            )}
            {touched.motDePasse && formData.motDePasse !== '' && !passwordValid && (
              <p className="field-helper error">
                Minimum 8 caractères, avec des lettres et des chiffres.
              </p>
            )}
            {!touched.motDePasse || (touched.motDePasse && passwordValid) ? (
              <p className={passwordValid ? 'field-helper success' : 'field-helper'}>
                Min. 8 caractères, avec lettres et chiffres.
              </p>
            ) : null}
          </div>

          <button type="submit" className="stagiaire-submit" disabled={!isFormValid}>
            Créer mon compte
          </button>
        </form>
      </div>
    </div>
  );
}

export default Stagiaire;
