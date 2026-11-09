import React, { useMemo, useState } from 'react';
import './FolderCss/StagiaireHome.css';

function StagiaireHomeScreen() {
  const [activeTab, setActiveTab] = useState('Accueil');

  const tabs = ['Accueil', 'Projets', 'Match', 'Classement'];

  const actionCards = [
    {
      id: 1,
      icon: 'QR',
      title: 'QR Check-In & Teams',
      description: 'Présence + séances à distance',
    },
    {
      id: 2,
      icon: '★',
      title: 'Talent Hub & Projets',
      description: 'Publier et soumettre un projet',
    },
    {
      id: 3,
      icon: '⇄',
      title: 'Skill Match',
      description: 'Trouver des paires complémentaires',
    },
    {
      id: 4,
      icon: '🏆',
      title: 'Classement & Career Quest',
      description: 'Leaderboard, quêtes, badges',
    },
    {
      id: 5,
      icon: '◉',
      title: 'Communauté',
      description: 'Photos, vidéos & projets',
    },
  ];

  // Données d'exemple (Stage 3 Flow Map)
  const studentName = 'Yassine';
  const currentXP = 2450;
  const maxXP = 3000;
  const progressPercent = Math.round((currentXP / maxXP) * 100);
  const employabilityTrend = 14;
  const stepsToReady = Math.max(1, Math.ceil((maxXP - currentXP) / 180));
  const milestonePercent = 78;

  const motivationalMessage = useMemo(function () {
    if (progressPercent >= 80) {
      return `🚀 Great consistency, ${studentName}! Your employability curve is trending upward by +${employabilityTrend}%.`;
    }
    return `🔥 You're ${stepsToReady} steps away from industry-ready level this week!`;
  }, [progressPercent, studentName, employabilityTrend, stepsToReady]);

  function renderContent() {
    if (activeTab === 'Classement') {
      return (
        <section className="career-section">
          <div className="career-header-row">
            <div>
              <h2 className="actions-section-title">Classement & Career Quest</h2>
              <p className="section-subtitle">Leaderboard, quêtes, badges et progression employabilité</p>
            </div>
            <span className="rank-pill">Top 12%</span>
          </div>

          <div className="glass-card employability-card">
            <div className="employability-top">
              <div>
                <h3 className="card-title">Employability Curve</h3>
                <p className="card-muted">Momentum hebdomadaire basé sur XP, projets et régularité</p>
              </div>
              <div className="trend-badge">+{employabilityTrend}%</div>
            </div>

            {/* Sparkline animée (gradient cyan -> indigo) */}
            <div className="sparkline-wrap" aria-label="Courbe d'employabilité">
              <svg viewBox="0 0 600 140" className="sparkline-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="sparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(6,182,212,0.28)" />
                    <stop offset="100%" stopColor="rgba(99,102,241,0.02)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M0,110 C60,95 90,100 140,78 C190,56 220,70 270,52 C320,34 360,48 410,38 C460,28 510,22 600,14 L600,140 L0,140 Z"
                  fill="url(#sparkFill)"
                />
                <path
                  d="M0,110 C60,95 90,100 140,78 C190,56 220,70 270,52 C320,34 360,48 410,38 C460,28 510,22 600,14"
                  fill="none"
                  stroke="url(#sparkStroke)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="sparkline-path"
                />
                <circle cx="600" cy="14" r="6" fill="#6366f1" className="sparkline-pulse" />
              </svg>
              <div className="sparkline-pulse-ring" />
            </div>

            {/* Milestone tracker */}
            <div className="milestone-card">
              <div className="milestone-row">
                <span className="milestone-label">Next Milestone</span>
                <span className="milestone-value">Junior Full-Stack Readiness — {milestonePercent}% achieved</span>
              </div>
              <div className="milestone-track">
                <div className="milestone-fill" style={{ width: milestonePercent + '%' }} />
              </div>
            </div>

            {/* Motivational Dynamic Badge / Daily Quote */}
            <div className="motivation-banner" role="status" aria-live="polite">
              <span className="motivation-dot" aria-hidden="true" />
              <p className="motivation-text">{motivationalMessage}</p>
            </div>
          </div>

          <div className="quest-grid">
            <div className="glass-card mini-quest">
              <h4>Leaderboard</h4>
              <p>#8 sur 64 stagiaires — <span className="accent-cyan">+2 places</span> cette semaine</p>
            </div>
            <div className="glass-card mini-quest">
              <h4>Quêtes actives</h4>
              <p>3/5 complétées — badge <span className="accent-emerald">Consistency</span> en cours</p>
            </div>
          </div>
        </section>
      );
    }

    // Accueil (par défaut) + autres onglets
    return (
      <section>
        <h2 className="actions-section-title">
          {activeTab === 'Accueil' ? 'Actions principales' : activeTab}
        </h2>
        {activeTab !== 'Accueil' && (
          <p className="section-subtitle">Section {activeTab} — contenu à venir.</p>
        )}
        <div className="actions-grid">
          {actionCards.map(function (card) {
            return (
              <button key={card.id} type="button" className="action-card">
                <div className="action-icon" aria-hidden="true">
                  {card.icon}
                </div>
                <div className="action-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="stagiaire-home premium-dark">
      {/* Barre de navigation fixe (sticky) */}
      <nav className="home-navbar">
        <div className="home-brand">TalentBridge</div>
        <div className="home-tabs">
          {tabs.map(function (tab) {
            return (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'home-tab active' : 'home-tab'}
                onClick={function () {
                  setActiveTab(tab);
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="home-container">
        {/* Header : profil stagiaire */}
        <section className="profile-card">
          <div className="profile-avatar" aria-label="Avatar YB">
            YB
          </div>
          <div className="profile-info">
            <div className="profile-top">
              <h1 className="profile-name">Bonjour, {studentName}</h1>
              <span className="profile-group">DEV101</span>
            </div>
            <div className="profile-level-row">
              <span>Niveau & progression</span>
              <span className="profile-xp">
                {currentXP.toLocaleString('fr-FR')} / {maxXP.toLocaleString('fr-FR')} XP
              </span>
            </div>
            <div className="progress-track" aria-label="Progression XP">
              <div className="progress-fill" style={{ width: progressPercent + '%' }} />
            </div>
          </div>
        </section>

        {renderContent()}
      </main>
    </div>
  );
}

export default StagiaireHomeScreen;
