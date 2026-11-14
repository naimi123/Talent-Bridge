import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import './FolderCss/StagiaireCheckin.css';

const INITIAL_SESSIONS = [
  {
    id: 1,
    title: 'Algorithmique en direct',
    time: 'Aujourd’hui • 14:30 - 16:00',
    host: 'Formateur: M. El Amrani',
    status: 'En direct',
    xpReward: 15,
  },
  {
    id: 2,
    title: 'Atelier React & UI Web',
    time: 'Aujourd’hui • 16:30 - 17:30',
    host: 'Formateur: Mme. Benali',
    status: 'À venir',
    xpReward: 30,
  },
];

const AUTO_DETECT_DELAY_MS = 3000;

export default function StagiaireCheckin() {
  const { addXp } = useOutletContext();

  // QR scanner / webcam refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const scanHandledRef = useRef(false);
  const simulationTimeoutRef = useRef(null);

  // Scanner UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState(
    "Autorisez l'accès à la webcam puis scannez le QR code fourni par votre formateur/administration pour valider votre présence."
  );
  const [scannerError, setScannerError] = useState('');
  const [presenceValidated, setPresenceValidated] = useState(false);
  const [lastScanSource, setLastScanSource] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Teams hub state
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [sessionFeedback, setSessionFeedback] = useState('');

  const attendanceLabel = useMemo(
    () => (presenceValidated ? 'Validé / Présent' : 'Présence non validée'),
    [presenceValidated]
  );

  function clearSimulationTimer() {
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
      simulationTimeoutRef.current = null;
    }
  }

  function stopCameraStream() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    clearSimulationTimer();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
    setIsScanning(false);
  }

  function closeCameraUI(message) {
    stopCameraStream();
    setIsCameraOpen(false);
    if (message) {
      setScannerStatus(message);
    }
  }

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showSuccessBanner) return undefined;
    const timer = setTimeout(() => setShowSuccessBanner(false), 3500);
    return () => clearTimeout(timer);
  }, [showSuccessBanner]);

  function markPresenceSuccess(sourceLabel) {
    if (scanHandledRef.current) return;
    scanHandledRef.current = true;

    setPresenceValidated(true);
    setLastScanSource(sourceLabel);
    addXp(20);
    setScannerError('');
    setScannerStatus(`Présence validée : ${sourceLabel}. +20 XP ajoutés automatiquement à votre profil.`);
    setShowSuccessBanner(true);

    // Show success feedback/animation briefly, then close/stop camera
    setTimeout(() => {
      closeCameraUI(`Présence marquée comme "Validé / Présent". Caméra fermée automatiquement.`);
    }, 1200);
  }

  async function scanFrame() {
    if (!isCameraOpen || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    try {
      ctx.drawImage(video, 0, 0, width, height);

      // Real QR detection when supported
      if (detectorRef.current) {
        const barcodes = await detectorRef.current.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          markPresenceSuccess('QR code détecté par la caméra');
          return;
        }
      }
    } catch (err) {
      // Ignore transient frame errors and continue scanning
    }

    if (!scanHandledRef.current && isCameraOpen) {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }

  async function handleOpenCamera() {
    if (presenceValidated) return;

    setScannerError('');
    setShowSuccessBanner(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerError("L'accès à la webcam n'est pas disponible sur ce navigateur/appareil.");
      setScannerStatus("Impossible d'activer la caméra. Vérifiez la compatibilité du navigateur.");
      return;
    }

    try {
      scanHandledRef.current = false;
      setIsCameraOpen(true);
      setIsScanning(true);
      setScannerStatus('Activation de la caméra en cours... Autorisez l’accès si le navigateur le demande.');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use native QR detection when available; otherwise fallback to smart simulation after 3s
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore - BarcodeDetector may be unavailable in typings
          detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch (err) {
          detectorRef.current = null;
        }
      } else {
        detectorRef.current = null;
      }

      setScannerStatus(
        detectorRef.current
          ? 'Caméra active. Scannez le QR code fourni par votre formateur/administration (détection automatique en cours)...'
          : 'Caméra active. Scan en cours... (simulation automatique dans 3 secondes pour test si aucun QR n’est détecté)'
      );

      // Start detection loop (used for real detection and keeping canvas/video pipeline active)
      rafRef.current = requestAnimationFrame(scanFrame);

      // Smart simulation fallback/test: auto-detect after 3 seconds of camera opening if not already scanned
      clearSimulationTimer();
      simulationTimeoutRef.current = setTimeout(() => {
        if (!scanHandledRef.current) {
          markPresenceSuccess('QR code détecté automatiquement (simulation de test)');
        }
      }, AUTO_DETECT_DELAY_MS);
    } catch (err) {
      stopCameraStream();
      setIsCameraOpen(false);
      setIsScanning(false);

      const denied = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      const notFound = err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError');

      if (denied) {
        setScannerError("Permission caméra refusée. Veuillez autoriser l'accès à la webcam puis réessayer.");
        setScannerStatus('Caméra inactive : autorisation refusée.');
      } else if (notFound) {
        setScannerError("Aucune caméra détectée sur cet appareil.");
        setScannerStatus('Caméra inactive : aucun périphérique vidéo trouvé.');
      } else {
        setScannerError("Impossible d'ouvrir la caméra. Vérifiez les permissions du navigateur et réessayez.");
        setScannerStatus("Échec d'activation de la caméra.");
      }
    }
  }

  function handleCloseCamera() {
    if (presenceValidated) return;
    closeCameraUI('Caméra fermée. Cliquez sur "Ouvrir la caméra pour scanner le QR" pour réessayer.');
  }

  function handleJoinSession(sessionId) {
    setSessions((prev) => {
      let awarded = 0;
      let title = '';

      const next = prev.map((session) => {
        if (session.id !== sessionId) return session;
        if (session.attendanceStatus === 'Présent') {
          title = session.title;
          return session;
        }
        awarded = session.xpReward;
        title = session.title;
        return {
          ...session,
          attendanceStatus: 'Présent',
          joined: true,
        };
      });

      if (awarded > 0) {
        addXp(awarded);
        setSessionFeedback(`Présence confirmée pour "${title}" : +${awarded} XP ajoutés.`);
      } else {
        setSessionFeedback(`Présence déjà enregistrée pour "${title}".`);
      }

      return next;
    });
  }

  return (
    <section className="checkin-page">
      <div className="section-header-row checkin-header-row">
        <div>
          <h2 className="actions-section-title">QR Check-in & Teams</h2>
          <p className="section-subtitle">
            Activez la caméra pour scanner le QR code de présence fourni par votre formateur/administration.
          </p>
        </div>
        <Link to="/stagiaire/dashboard" className="back-link">
          ← Retour au dashboard
        </Link>
      </div>

      {showSuccessBanner && (
        <div className="success-alert success-pop" role="status" aria-live="polite">
          <span className="success-alert-icon" aria-hidden="true">✓</span>
          <div>
            <p className="success-alert-title">Présence validée (Validé / Présent)</p>
            <p className="success-alert-text">+20 XP ajoutés à votre profil. La caméra va se fermer automatiquement.</p>
          </div>
        </div>
      )}

      <div className="checkin-layout">
        <article className="glass-panel qr-panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Scanner de présence (QR Code)</h3>
              <p className="panel-subtitle">
                Flux webcam en direct + détection QR automatique (avec simulation de test après 3 secondes si nécessaire).
              </p>
            </div>
            <span className={`status-pill ${presenceValidated ? 'success' : 'pending'}`}>
              {attendanceLabel}
            </span>
          </div>

          <div className="scanner-instructions">
            <p>
              Cliquez sur le bouton ci-dessous pour ouvrir la caméra et scanner le QR code fourni par votre formateur/administration.
            </p>
            <ul>
              <li>Le flux vidéo s’affiche directement dans l’interface.</li>
              <li>Le scan se fait automatiquement (détection QR ou simulation intelligente après 3s pour test).</li>
              <li>À la validation : présence marquée, +20 XP ajoutés, caméra arrêtée.</li>
            </ul>
          </div>

          <div className="scanner-actions">
            {!isCameraOpen ? (
              <button
                type="button"
                className="primary-action-btn"
                onClick={handleOpenCamera}
                disabled={presenceValidated}
              >
                {presenceValidated ? 'Présence déjà validée' : '📷 Ouvrir la caméra pour scanner le QR'}
              </button>
            ) : (
              <button type="button" className="secondary-action-btn" onClick={handleCloseCamera}>
                Fermer la caméra
              </button>
            )}
          </div>

          <div className={`scanner-viewport ${isCameraOpen ? 'active' : ''}`}>
            {isCameraOpen ? (
              <>
                <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="scanner-canvas" aria-hidden="true" />
                <div className="scanner-overlay" aria-hidden="true">
                  <div className={`scanner-frame ${isScanning ? 'scanning' : ''}`} />
                  <div className="scan-line" />
                </div>
              </>
            ) : (
              <div className="scanner-placeholder">
                <div className="scanner-placeholder-icon" aria-hidden="true">📷</div>
                <p>Caméra inactive</p>
                <p className="muted">Cliquez sur “Ouvrir la caméra pour scanner le QR”.</p>
              </div>
            )}
          </div>

          <div className="scanner-feedback-wrap">
            <p className={`feedback-text ${presenceValidated ? 'success' : ''}`} aria-live="polite">
              {scannerStatus}
            </p>
            {scannerError ? <p className="feedback-text error">{scannerError}</p> : null}
            {presenceValidated && lastScanSource ? (
              <p className="feedback-text success subtle">Source de validation : {lastScanSource}</p>
            ) : null}
          </div>
        </article>

        <article className="glass-panel teams-panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Teams Hub</h3>
              <p className="panel-subtitle">Sessions live, présence et récompenses XP par session.</p>
            </div>
          </div>

          <div className="sessions-list">
            {sessions.map((session) => {
              const joined = session.attendanceStatus === 'Présent' || session.joined;
              return (
                <div key={session.id} className="session-card">
                  <div className="session-main">
                    <div className="session-title-row">
                      <h4>{session.title}</h4>
                      <span className={`session-status ${session.status === 'En direct' ? 'live' : 'upcoming'}`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="session-meta">{session.time}</p>
                    <p className="session-meta muted">{session.host}</p>

                    <div className="session-reward-row">
                      <span className="xp-reward-chip">+{session.xpReward} XP</span>
                      <span className="reward-hint">Récompense en rejoignant / validant la présence à la session</span>
                    </div>

                    <p className={`attendance-status ${joined ? 'present' : 'absent'}`}>
                      Statut de présence : <strong>{joined ? 'Présent' : 'Non marqué'}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="join-btn"
                    onClick={() => handleJoinSession(session.id)}
                    disabled={joined}
                  >
                    {joined ? 'Présence enregistrée' : 'Rejoindre'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="teams-note">
            <p aria-live="polite">
              {sessionFeedback || 'Cliquez sur "Rejoindre" pour une session live : votre présence sera mise à jour et les XP ajoutés.'}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
