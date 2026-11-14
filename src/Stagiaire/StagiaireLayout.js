import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './FolderCss/StagiaireHome.css';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    category: 'Administration / Emploi du temps',
    message: 'Nouvel emploi du temps publié pour le groupe DEV101',
    time: 'Il y a 10 min',
    actionLabel: 'Voir',
    unread: true,
  },
  {
    id: 2,
    category: 'Annonces du Centre',
    message: 'Annonce OFPPT : Hackathon & Journée Portes Ouvertes ce vendredi',
    time: 'Il y a 1 h',
    actionLabel: 'Consulter',
    unread: true,
  },
  {
    id: 3,
    category: 'Classement & XP',
    message: 'Félicitations ! Votre groupe Développement Digital est passé #1 au classement général (+2402 XP moyenne)',
    time: 'Aujourd’hui',
    actionLabel: 'Voir le classement',
    unread: true,
  },
  {
    id: 4,
    category: 'Annonces du Centre',
    message: 'Rappel : session de coaching carrière demain à 14h00 en salle B2.',
    time: 'Hier',
    actionLabel: 'Détails',
    unread: false,
  },
];

const NOTIFICATION_SECTIONS = [
  'Administration / Emploi du temps',
  'Annonces du Centre',
  'Classement & XP',
];

export default function StagiaireLayout() {
  const [studentName] = useState('Yassine');
  const [group] = useState('DEV101');
  const [xp, setXp] = useState(2450);
  const [maxXp] = useState(3000);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notificationsRef = useRef(null);

  const progressPercent = useMemo(() => {
    if (maxXp <= 0) return 0;
    return Math.min(100, Math.round((xp / maxXp) * 100));
  }, [xp, maxXp]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  function addXp(amount) {
    setXp((prev) => Math.max(0, prev + amount));
  }

  function toggleNotifications() {
    setNotificationsOpen((prev) => !prev);
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markOneAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setNotificationsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const groupedNotifications = useMemo(() => {
    return NOTIFICATION_SECTIONS.map((section) => ({
      section,
      items: notifications.filter((n) => n.category === section),
    })).filter((grouped) => grouped.items.length > 0);
  }, [notifications]);

  return (
    <div className="stagiaire-home premium-dark">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-inner">
          <div className="home-brand">TalentBridge</div>

          <nav className="dashboard-nav" aria-label="Stagiaire navigation">
            <NavLink
              to="/stagiaire/dashboard"
              end
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/stagiaire/dashboard/talent-hub"
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              Talent Hub & Projects
            </NavLink>
            <NavLink
              to="/stagiaire/dashboard/skill-match"
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              Skill Match
            </NavLink>
            <NavLink
              to="/stagiaire/dashboard/leaderboard"
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              Classement & Quêtes
            </NavLink>
            <NavLink
              to="/stagiaire/dashboard/checkin"
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              QR Check-In & Teams
            </NavLink>
            <NavLink
              to="/stagiaire/community"
              className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
            >
              Communauté
            </NavLink>
          </nav>

          <div className="topbar-actions" ref={notificationsRef}>
            <button
              type="button"
              className={`notification-bell-btn ${notificationsOpen ? 'open' : ''}`}
              onClick={toggleNotifications}
              aria-label="Ouvrir les notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              title="Notifications"
            >
              <span className="bell-icon" aria-hidden="true">🔔</span>
              {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
            </button>

            {notificationsOpen ? (
              <div className="notifications-dropdown" role="dialog" aria-label="Centre de notifications">
                <div className="notifications-header">
                  <div>
                    <h3 className="notifications-title">Notifications</h3>
                    <p className="notifications-subtitle">Centre de notifications stagiaire</p>
                  </div>
                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Marquer tout comme lu
                  </button>
                </div>

                <div className="notifications-body">
                  {groupedNotifications.map(({ section, items }) => (
                    <div key={section} className="notification-section">
                      <p className="notification-section-title">{section}</p>
                      <div className="notification-items">
                        {items.map((item) => (
                          <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
                            <div className="notification-item-main">
                              <p className="notification-message">{item.message}</p>
                              <p className="notification-time">{item.time}</p>
                            </div>
                            <div className="notification-item-actions">
                              {item.unread ? <span className="unread-dot" aria-label="Non lu" /> : null}
                              <button
                                type="button"
                                className="notification-action-btn"
                                onClick={() => markOneAsRead(item.id)}
                              >
                                {item.actionLabel}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 ? (
                    <p className="notifications-empty">Aucune notification pour le moment.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="home-container">
        <section className="profile-card dashboard-hero">
          <div className="profile-avatar" aria-label={`Avatar ${studentName}`}>
            {studentName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="profile-info">
            <div className="profile-top">
              <div>
                <p className="hero-kicker">Espace Stagiaire</p>
                <h1 className="profile-name">Bonjour, {studentName}</h1>
              </div>
              <div className="hero-meta">
                <span className="profile-group">{group}</span>
                <span className="xp-badge">{xp.toLocaleString('fr-FR')} XP</span>
              </div>
            </div>

            <div className="profile-level-row">
              <span>Progression vers le prochain niveau</span>
              <span className="profile-xp">
                {xp.toLocaleString('fr-FR')} / {maxXp.toLocaleString('fr-FR')} XP
              </span>
            </div>

            <div className="progress-track" aria-label="Progression XP">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="progress-caption">{progressPercent}% complété</p>
          </div>
        </section>

        <Outlet
          context={{
            studentName,
            xp,
            maxXp,
            progressPercent,
            addXp,
          }}
        />
      </main>
    </div>
  );
}
