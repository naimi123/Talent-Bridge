import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './FolderCss/StagiaireHome.css';

export default function StagiaireHomeScreen() {
  const navigate = useNavigate();
  const { xp } = useOutletContext();

  const actionCards = [
    {
      id: 'checkin',
      icon: 'QR',
      title: 'QR Check-in & Teams',
      description: 'Présence & séances à distance',
      to: '/stagiaire/dashboard/checkin',
    },
    {
      id: 'talent-hub',
      icon: '★',
      title: 'Talent Hub & Projects',
      description: 'Publier & soumettre des projets',
      to: '/stagiaire/dashboard/talent-hub',
    },
    {
      id: 'skill-match',
      icon: '⇄',
      title: 'Skill Match',
      description: 'Paires complémentaires',
      to: '/stagiaire/dashboard/skill-match',
    },
    {
      id: 'career-quest',
      icon: '🏆',
      title: 'Classement & Career Quest',
      description: 'Leaderboard & badges',
      to: '/stagiaire/dashboard/leaderboard',
    },
    {
      id: 'community',
      icon: '◉',
      title: 'Communauté',
      description: 'Photos, vidéos & projets',
      to: '/stagiaire/community',
    },
  ];

  function handleCardClick(card) {
    if (card.to) {
      navigate(card.to);
    }
  }

  return (
    <section className="dashboard-home">
      <div className="section-header-row">
        <div>
          <h2 className="actions-section-title">Tableau de bord</h2>
          <p className="section-subtitle">
            Accédez rapidement à vos actions principales. Total actuel : {xp.toLocaleString('fr-FR')} XP
          </p>
        </div>
      </div>

      <div className="actions-grid web-grid">
        {actionCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`action-card ${card.to ? 'action-card-clickable' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="action-icon" aria-hidden="true">
              {card.icon}
            </div>
            <div className="action-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            {card.to ? <span className="card-arrow" aria-hidden="true">→</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
