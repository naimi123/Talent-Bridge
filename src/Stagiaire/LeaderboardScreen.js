import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import './FolderCss/Leaderboard.css';

const QUEST_XP_REWARD = 300;

const INITIAL_BADGES = [
  { id: 1, name: 'Premier pas', description: 'Première connexion et profil complété', status: 'Débloqué' },
  { id: 2, name: 'Collaborateur', description: '3 collaborations ou binômes actifs', status: 'Débloqué' },
  { id: 3, name: 'Portfolio Pro', description: 'Terminer la quête Portfolio complet', status: 'En cours' },
  { id: 4, name: 'Résolveur', description: 'Résoudre 5 défis du centre', status: 'Verrouillé' },
];

export default function LeaderboardScreen() {
  const { xp, studentName } = useOutletContext();
  const [activeTab, setActiveTab] = useState('classement'); // classement | quetes | badges
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [restrictedNotice, setRestrictedNotice] = useState('');

  const currentStudentName = studentName || 'Yassine';
  const currentUserSpecialty = 'Développement Digital';

  const individualLeaderboard = useMemo(() => {
    const users = [
      { name: currentStudentName, group: 'DEV101', xp, isCurrentUser: true },
      { name: 'Sara Benali', group: 'DEV102', xp: 2415, isCurrentUser: false },
      { name: 'Omar Alami', group: 'DEV101', xp: 2390, isCurrentUser: false },
      { name: 'Lina Berrada', group: 'DEV103', xp: 2380, isCurrentUser: false },
      { name: 'Omar Chraibi', group: 'DEV101', xp: 2250, isCurrentUser: false },
      { name: 'Nadia Kabbaj', group: 'DEV102', xp: 2180, isCurrentUser: false },
      { name: 'Hiba Zahra', group: 'DEV101', xp: 2120, isCurrentUser: false },
    ];

    return users
      .slice()
      .sort((a, b) => b.xp - a.xp)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  }, [xp, currentStudentName]);

  const topThree = individualLeaderboard.slice(0, 3);

  const ownGroupMembers = useMemo(() => {
    const members = [
      { name: currentStudentName, classGroup: 'DEV101', xp, isCurrentUser: true },
      { name: 'Omar Alami', classGroup: 'DEV101', xp: 2390, isCurrentUser: false },
      { name: 'Omar Chraibi', classGroup: 'DEV101', xp: 2250, isCurrentUser: false },
      { name: 'Hiba Zahra', classGroup: 'DEV101', xp: 2120, isCurrentUser: false },
      { name: 'Salma Idrissi', classGroup: 'DEV102', xp: 2060, isCurrentUser: false },
      { name: 'Ayoub Tazi', classGroup: 'DEV103', xp: 1985, isCurrentUser: false },
      { name: 'Imane Fassi', classGroup: 'DEV102', xp: 1910, isCurrentUser: false },
      { name: 'Mehdi Rami', classGroup: 'DEV103', xp: 1875, isCurrentUser: false },
    ];

    return members
      .slice()
      .sort((a, b) => b.xp - a.xp)
      .map((member, index) => ({ ...member, rank: index + 1 }));
  }, [xp, currentStudentName]);

  const groupLeaderboard = useMemo(() => {
    // Specialty/group ranking based on average XP per student (moyenne par groupe)
    // Current user's XP is included dynamically to keep scores synced.
    const ownGroupTotalXp = 55200 + xp;

    const groups = [
      {
        name: 'Développement Digital',
        studentsCount: 24,
        totalXp: ownGroupTotalXp,
        isUserGroup: true,
        members: ownGroupMembers,
      },
      {
        name: 'Réseaux & Systèmes',
        studentsCount: 22,
        totalXp: 50380,
        isUserGroup: false,
        members: null,
      },
      {
        name: 'Électricité Industrielle',
        studentsCount: 20,
        totalXp: 45200,
        isUserGroup: false,
        members: null,
      },
      {
        name: 'Mécanique Auto',
        studentsCount: 18,
        totalXp: 39240,
        isUserGroup: false,
        members: null,
      },
      {
        name: 'Techniques Électromécaniques',
        studentsCount: 21,
        totalXp: 44520,
        isUserGroup: false,
        members: null,
      },
    ];

    return groups
      .map((group) => ({
        ...group,
        averageXp: Math.round(group.totalXp / group.studentsCount),
      }))
      .sort((a, b) => b.averageXp - a.averageXp)
      .map((group, index) => ({ ...group, rank: index + 1 }));
  }, [xp, ownGroupMembers]);

  const activeQuest = {
    title: 'Quête active · Portfolio complet',
    description: 'Complétez les étapes clés pour publier un portfolio professionnel et attirer plus d’opportunités.',
    stepsDone: 3,
    stepsTotal: 5,
    rewardXp: QUEST_XP_REWARD,
  };

  const questProgressPercent = Math.round((activeQuest.stepsDone / activeQuest.stepsTotal) * 100);
  const currentUserRank = individualLeaderboard.find((u) => u.isCurrentUser)?.rank || 1;

  const handleGroupClick = (group) => {
    if (group.isUserGroup && group.name === currentUserSpecialty) {
      setRestrictedNotice('');
      setSelectedGroup(group);
      return;
    }

    setSelectedGroup(null);
    setRestrictedNotice(`Accès restreint à votre propre filière. Vous ne pouvez consulter que "${currentUserSpecialty}".`);
  };

  const closeModal = () => setSelectedGroup(null);

  return (
    <section className="leaderboard-page">
      <div className="leaderboard-header-row">
        <div>
          <h2 className="actions-section-title">Classement & Career Quest</h2>
          <p className="section-subtitle">
            Suivez votre progression, vos quêtes et vos badges dans l’écosystème TalentBridge.
          </p>
        </div>
        <div className="leaderboard-header-actions">
          <span className="reward-badge" title="Récompense de quête">+{QUEST_XP_REWARD} XP</span>
          <Link to="/stagiaire/dashboard" className="back-link">
            ← Retour au dashboard
          </Link>
        </div>
      </div>

      <div className="subtabs" role="tablist" aria-label="Sections classement et quêtes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'classement'}
          className={`subtab ${activeTab === 'classement' ? 'active' : ''}`}
          onClick={() => setActiveTab('classement')}
        >
          Classement
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quetes'}
          className={`subtab ${activeTab === 'quetes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quetes')}
        >
          Career Quest
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'badges'}
          className={`subtab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </button>
      </div>

      {activeTab === 'classement' ? (
        <div className="leaderboard-content">
          <article className="glass-panel podium-panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Top 3 Podium</h3>
                <p className="panel-subtitle">Les stagiaires les plus performants (reconnaissance individuelle, XP synchronisé pour votre profil).</p>
              </div>
            </div>

            <div className="podium-grid">
              {topThree.map((user) => (
                <div
                  key={`${user.rank}-${user.name}`}
                  className={`podium-card rank-${user.rank} ${user.isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="podium-rank">#{user.rank}</div>
                  <div className="podium-avatar" aria-hidden="true">
                    {user.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <h4 className="podium-name">{user.name}</h4>
                  <p className="podium-group">{user.group}</p>
                  <p className="podium-xp">{user.xp.toLocaleString('fr-FR')} XP</p>
                  {user.isCurrentUser ? <span className="you-pill">Vous</span> : null}
                </div>
              ))}
            </div>
          </article>

          <article className="glass-panel rankings-panel">
            <div className="panel-head panel-head-groups">
              <div>
                <h3 className="panel-title">Classement général</h3>
                <p className="panel-subtitle">
                  Classement basé sur la moyenne des points XP de chaque groupe pour garantir l'équité entre les filières.
                </p>
              </div>
              <p className="privacy-note">🔒 Consultation détaillée limitée à votre propre filière.</p>
            </div>

            {restrictedNotice ? (
              <div className="restricted-notice" role="status" aria-live="polite">
                <span className="restricted-lock" aria-hidden="true">🔒</span>
                <span>{restrictedNotice}</span>
              </div>
            ) : null}

            <div className="rankings-list">
              {groupLeaderboard.map((group) => {
                const canInspect = group.isUserGroup && group.name === currentUserSpecialty;
                return (
                  <button
                    key={group.name}
                    type="button"
                    className={`ranking-row ranking-row-group ranking-row-button ${canInspect ? 'current-user-group clickable' : 'restricted-group'}`}
                    onClick={() => handleGroupClick(group)}
                    aria-label={canInspect ? `Voir les membres de ${group.name}` : `Accès restreint pour ${group.name}`}
                    title={canInspect ? 'Cliquer pour voir le classement interne de votre filière' : 'Accès restreint à votre propre filière'}
                  >
                    <div className="ranking-left">
                      <span className="ranking-position">#{group.rank}</span>
                      <div className="ranking-text">
                        <p className="ranking-name">
                          {group.name}
                          {!canInspect ? <span className="lock-inline" aria-hidden="true"> 🔒</span> : null}
                        </p>
                        <p className="ranking-meta">
                          {group.studentsCount} stagiaires · Moyenne par groupe
                          {canInspect ? ' · Votre filière' : ' · Accès restreint'}
                        </p>
                      </div>
                    </div>
                    <div className="ranking-right ranking-right-group">
                      <span className="ranking-xp">{group.averageXp.toLocaleString('fr-FR')} XP / stagiaire</span>
                      <span className="ranking-total-xp">Total: {group.totalXp.toLocaleString('fr-FR')} XP</span>
                      <span className={`group-access-pill ${canInspect ? 'allowed' : 'denied'}`}>
                        {canInspect ? 'Voir ma filière' : 'Accès restreint'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === 'quetes' ? (
        <div className="quests-content">
          <article className="glass-panel quest-active-panel">
            <div className="panel-head quest-panel-head">
              <div>
                <p className="quest-kicker">Quête active</p>
                <h3 className="panel-title">{activeQuest.title.replace('Quête active · ', '')}</h3>
                <p className="panel-subtitle">{activeQuest.description}</p>
              </div>
              <span className="quest-reward-badge">+{activeQuest.rewardXp} XP</span>
            </div>

            <div className="quest-progress-block">
              <div className="quest-progress-top">
                <span className="quest-progress-label">Progression</span>
                <span className="quest-progress-value">{activeQuest.stepsDone} / {activeQuest.stepsTotal} étapes</span>
              </div>
              <div className="quest-progress-track" aria-label="Progression de la quête">
                <div className="quest-progress-fill" style={{ width: `${questProgressPercent}%` }} />
              </div>
              <p className="quest-progress-note">{questProgressPercent}% complété — continuez pour débloquer la récompense.</p>
            </div>

            <div className="quest-steps-list">
              <div className="quest-step done"><span>1.</span><p>Créer et compléter le profil TalentBridge</p></div>
              <div className="quest-step done"><span>2.</span><p>Soumettre un premier projet au Talent Hub</p></div>
              <div className="quest-step done"><span>3.</span><p>Ajouter une description et un lien de démo</p></div>
              <div className="quest-step"><span>4.</span><p>Recevoir une validation formateur</p></div>
              <div className="quest-step"><span>5.</span><p>Publier le portfolio final</p></div>
            </div>
          </article>

          <article className="glass-panel quest-side-panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Votre progression</h3>
                <p className="panel-subtitle">Synchronisée avec votre score XP actuel.</p>
              </div>
            </div>
            <div className="quest-stat-cards">
              <div className="mini-stat-card">
                <p className="mini-stat-label">Stagiaire</p>
                <p className="mini-stat-value">{currentStudentName}</p>
              </div>
              <div className="mini-stat-card">
                <p className="mini-stat-label">XP total</p>
                <p className="mini-stat-value accent">{xp.toLocaleString('fr-FR')} XP</p>
              </div>
              <div className="mini-stat-card">
                <p className="mini-stat-label">Rang individuel</p>
                <p className="mini-stat-value">#{currentUserRank}</p>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === 'badges' ? (
        <article className="glass-panel badges-panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Badges</h3>
              <p className="panel-subtitle">Vos accomplissements et objectifs à débloquer.</p>
            </div>
          </div>

          <div className="badges-grid">
            {INITIAL_BADGES.map((badge) => (
              <div key={badge.id} className={`badge-card status-${badge.status.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="badge-icon" aria-hidden="true">🏅</div>
                <div className="badge-main">
                  <div className="badge-top">
                    <h4 className="badge-name">{badge.name}</h4>
                    <span className={`badge-status ${badge.status === 'Débloqué' ? 'unlocked' : badge.status === 'En cours' ? 'progress' : 'locked'}`}>
                      {badge.status}
                    </span>
                  </div>
                  <p className="badge-description">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {selectedGroup ? (
        <div className="group-modal-overlay" role="dialog" aria-modal="true" aria-label={`Classement interne ${selectedGroup.name}`} onClick={closeModal}>
          <div className="group-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">
              <div>
                <p className="quest-kicker">Filière autorisée</p>
                <h3 className="panel-title">Classement interne · {selectedGroup.name}</h3>
                <p className="panel-subtitle">
                  Classement individuel des membres de votre filière (données visibles uniquement pour votre groupe).
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="group-modal-summary">
              <div className="mini-stat-card">
                <p className="mini-stat-label">Moyenne du groupe</p>
                <p className="mini-stat-value accent">{selectedGroup.averageXp.toLocaleString('fr-FR')} XP</p>
              </div>
              <div className="mini-stat-card">
                <p className="mini-stat-label">Stagiaires</p>
                <p className="mini-stat-value">{selectedGroup.studentsCount}</p>
              </div>
              <div className="mini-stat-card">
                <p className="mini-stat-label">Rang du groupe</p>
                <p className="mini-stat-value">#{selectedGroup.rank}</p>
              </div>
            </div>

            <div className="group-members-list">
              {selectedGroup.members.map((member) => (
                <div key={`${member.rank}-${member.name}`} className={`group-member-row ${member.isCurrentUser ? 'current-user' : ''}`}>
                  <div className="ranking-left">
                    <span className="ranking-position">#{member.rank}</span>
                    <div className="ranking-text">
                      <p className="ranking-name">
                        {member.name} {member.isCurrentUser ? <span className="you-inline">(Vous)</span> : null}
                      </p>
                      <p className="ranking-meta">{member.classGroup}</p>
                    </div>
                  </div>
                  <div className="ranking-right">
                    <span className="ranking-xp">{member.xp.toLocaleString('fr-FR')} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
