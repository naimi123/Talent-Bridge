import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import './FolderCss/SkillMatch.css';

const MATCH_XP_REWARD = 50;
const ENDORSEMENT_XP_REWARD = 30;
const SOFT_SKILLS = ['Travail en équipe', 'Gestion du temps', 'Résolution de problèmes', 'Communication'];

const INITIAL_PEERS = [
  {
    id: 1,
    name: 'Omar Alami',
    group: 'DEV 101',
    strongSkills: ['UI/UX', 'Figma', 'React'],
    lookingFor: 'Recherche un partenaire backend pour intégrer une API',
    matchPercent: 95,
    softSkillBadges: [],
  },
  {
    id: 2,
    name: 'Sara Benali',
    group: 'DEV 102',
    strongSkills: ['Python', 'Django', 'SQL'],
    lookingFor: 'Cherche un profil frontend React pour un projet full-stack',
    matchPercent: 91,
    softSkillBadges: [],
  },
  {
    id: 3,
    name: 'Hiba Zahra',
    group: 'DEV 101',
    strongSkills: ['Node.js', 'Express', 'MongoDB'],
    lookingFor: 'À la recherche d’un designer UI/UX pour améliorer l’interface',
    matchPercent: 88,
    softSkillBadges: [],
  },
  {
    id: 4,
    name: 'Anas El Fassi',
    group: 'MKT 201',
    strongSkills: ['Marketing', 'Communication', 'Canva'],
    lookingFor: 'Recherche un développeur web pour créer une landing page',
    matchPercent: 84,
    softSkillBadges: [],
  },
  {
    id: 5,
    name: 'Imane Rami',
    group: 'DEV 103',
    strongSkills: ['React', 'TypeScript', 'UI/UX'],
    lookingFor: 'Souhaite collaborer avec un profil backend Node.js/Python',
    matchPercent: 93,
    softSkillBadges: [],
  },
];

const INITIAL_CONNECTIONS = [
  {
    id: 101,
    peerId: null,
    name: 'Nadia Kabbaj',
    group: 'DEV 102',
    status: 'Actif',
    skillFocus: 'React + Laravel',
    note: 'Binôme actif sur un projet de gestion scolaire',
    softSkillBadges: ['Travail en équipe'],
    endorsedByMe: false,
  },
  {
    id: 102,
    peerId: null,
    name: 'Youssef Amine',
    group: 'DEV 101',
    status: 'En attente',
    skillFocus: 'UI/UX + Frontend',
    note: 'Demande de collaboration envoyée hier',
    softSkillBadges: [],
    endorsedByMe: false,
  },
];

const INITIAL_CHALLENGES = [
  {
    id: 201,
    title: "Bug d'authentification API",
    specialty: 'DEV',
    authorName: 'Youssef Amine',
    authorGroup: 'DEV 101',
    rewardXp: 80,
    status: 'Ouvert',
    description: 'Le token JWT expire trop vite et cause des déconnexions sur le dashboard.',
    solution: '',
    solvedBy: '',
  },
  {
    id: 202,
    title: 'Problème de diagnostic moteur',
    specialty: 'Mécanique',
    authorName: 'M. El Idrissi',
    authorGroup: 'Formateur',
    rewardXp: 100,
    status: 'Ouvert',
    description: 'Vibrations anormales au ralenti après changement des bougies. Diagnostic recherché.',
    solution: '',
    solvedBy: '',
  },
  {
    id: 203,
    title: 'Court-circuit sur montage Arduino',
    specialty: 'Électronique',
    authorName: 'Salma Rachidi',
    authorGroup: 'ELEC 201',
    rewardXp: 70,
    status: 'Résolu',
    description: 'Le montage chauffe lors du branchement du capteur de température.',
    solution: 'Vérification du câblage et ajout d’une résistance adaptée sur l’entrée capteur.',
    solvedBy: 'Yassine',
  },
];

const CHALLENGE_SPECIALTIES = ['DEV', 'Mécanique', 'Électronique', 'Réseaux', 'UI/UX'];

function uniqueBadges(existing = [], incoming = []) {
  return Array.from(new Set([...(existing || []), ...(incoming || [])]));
}

export default function SkillMatchScreen() {
  const { addXp, studentName, xp } = useOutletContext();

  const [activeView, setActiveView] = useState('peers'); // peers | challenges

  // Peer finder & endorsements state
  const [searchTerm, setSearchTerm] = useState('');
  const [peers, setPeers] = useState(INITIAL_PEERS);
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [feedback, setFeedback] = useState('');

  const [endorsementTargetId, setEndorsementTargetId] = useState(null);
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([]);

  // Challenges state
  const [challenges, setChallenges] = useState(INITIAL_CHALLENGES);
  const [challengeFilter, setChallengeFilter] = useState('Tous');
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    specialty: 'DEV',
    rewardXp: 80,
    description: '',
  });
  const [challengeFormError, setChallengeFormError] = useState('');
  const [challengeFormSuccess, setChallengeFormSuccess] = useState('');

  const [solveTargetId, setSolveTargetId] = useState(null);
  const [solveProposal, setSolveProposal] = useState('');
  const [solveMode, setSolveMode] = useState('solution'); // solution | connect
  const [challengeFeedback, setChallengeFeedback] = useState('');

  const filteredPeers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return peers;

    return peers.filter((peer) => {
      const inName = peer.name.toLowerCase().includes(query);
      const inGroup = peer.group.toLowerCase().includes(query);
      const inLookingFor = peer.lookingFor.toLowerCase().includes(query);
      const inSkills = peer.strongSkills.some((skill) => skill.toLowerCase().includes(query));
      const inSoftSkills = (peer.softSkillBadges || []).some((skill) => skill.toLowerCase().includes(query));
      return inName || inGroup || inLookingFor || inSkills || inSoftSkills;
    });
  }, [peers, searchTerm]);

  const endorsementTarget = useMemo(
    () => connections.find((connection) => connection.id === endorsementTargetId) || null,
    [connections, endorsementTargetId]
  );

  const filteredChallenges = useMemo(() => {
    if (challengeFilter === 'Tous') return challenges;
    if (challengeFilter === 'Ouvert' || challengeFilter === 'Résolu') {
      return challenges.filter((challenge) => challenge.status === challengeFilter);
    }
    return challenges.filter((challenge) => challenge.specialty === challengeFilter);
  }, [challenges, challengeFilter]);

  const solveTarget = useMemo(
    () => challenges.find((challenge) => challenge.id === solveTargetId) || null,
    [challenges, solveTargetId]
  );

  function handleConnect(peerId) {
    let connectedPeer = null;

    setPeers((prev) =>
      prev.map((peer) => {
        if (peer.id !== peerId) return peer;
        if (peer.requestStatus === 'sent') return peer;
        connectedPeer = peer;
        return { ...peer, requestStatus: 'sent' };
      })
    );

    if (!connectedPeer) return;

    addXp(MATCH_XP_REWARD);
    setConnections((prev) => [
      {
        id: Date.now(),
        peerId: connectedPeer.id,
        name: connectedPeer.name,
        group: connectedPeer.group,
        status: 'En attente',
        skillFocus: connectedPeer.strongSkills.slice(0, 2).join(' + '),
        note: `Demande envoyée pour collaboration (${connectedPeer.lookingFor})`,
        softSkillBadges: [...(connectedPeer.softSkillBadges || [])],
        endorsedByMe: false,
      },
      ...prev,
    ]);
    setFeedback(`Demande envoyée à ${connectedPeer.name}. +${MATCH_XP_REWARD} XP ajoutés à votre profil.`);
  }

  function openEndorsementModal(connectionId) {
    setEndorsementTargetId(connectionId);
    setSelectedSoftSkills([]);
  }

  function closeEndorsementModal() {
    setEndorsementTargetId(null);
    setSelectedSoftSkills([]);
  }

  function toggleSoftSkill(skill) {
    setSelectedSoftSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((item) => item !== skill);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, skill];
    });
  }

  function handleSubmitEndorsement() {
    if (!endorsementTarget || selectedSoftSkills.length === 0) return;
    if (endorsementTarget.status !== 'Actif' || endorsementTarget.endorsedByMe) return;

    const skillsToAdd = [...selectedSoftSkills];

    setConnections((prev) =>
      prev.map((connection) => {
        if (connection.id !== endorsementTarget.id) return connection;
        return {
          ...connection,
          softSkillBadges: uniqueBadges(connection.softSkillBadges, skillsToAdd),
          endorsedByMe: true,
          note: `Soft skills endossés : ${uniqueBadges(connection.softSkillBadges, skillsToAdd).join(', ')}`,
        };
      })
    );

    setPeers((prev) =>
      prev.map((peer) => {
        const matchesById = endorsementTarget.peerId && peer.id === endorsementTarget.peerId;
        const matchesByNameGroup = peer.name === endorsementTarget.name && peer.group === endorsementTarget.group;
        if (!matchesById && !matchesByNameGroup) return peer;
        return {
          ...peer,
          softSkillBadges: uniqueBadges(peer.softSkillBadges, skillsToAdd),
        };
      })
    );

    addXp(ENDORSEMENT_XP_REWARD);
    setFeedback(
      `Badges de confiance attribués à ${endorsementTarget.name} (${skillsToAdd.join(', ')}). +${ENDORSEMENT_XP_REWARD} XP pour vous (bonus collaboration simulé pour les deux stagiaires).`
    );
    closeEndorsementModal();
  }

  function handleChallengeFormChange(field, value) {
    setChallengeForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreateChallenge(event) {
    event.preventDefault();
    setChallengeFormError('');
    setChallengeFormSuccess('');
    setChallengeFeedback('');

    const title = challengeForm.title.trim();
    const description = challengeForm.description.trim();
    const rewardXp = Math.max(10, Number(challengeForm.rewardXp) || 0);

    if (!title) {
      setChallengeFormError('Veuillez saisir un titre pour le défi/problème.');
      return;
    }
    if (!description) {
      setChallengeFormError('Veuillez décrire brièvement le défi ou le problème technique.');
      return;
    }

    // Escrow validation: creator must have enough XP to stake the bounty
    if (xp < rewardXp) {
      setChallengeFormError(
        `Points XP insuffisants pour publier ce défi avec cette récompense. Solde actuel : ${xp} XP, bounty demandé : ${rewardXp} XP.`
      );
      return;
    }

    // Deduct (escrow) bounty XP from creator immediately upon publication
    addXp(-rewardXp);

    const newChallenge = {
      id: Date.now(),
      title,
      specialty: challengeForm.specialty,
      authorName: studentName || 'Stagiaire',
      authorGroup: 'DEV 101',
      rewardXp,
      status: 'Ouvert',
      description,
      solution: '',
      solvedBy: '',
      escrowed: true,
    };

    setChallenges((prev) => [newChallenge, ...prev]);
    setChallengeForm({ title: '', specialty: 'DEV', rewardXp: 80, description: '' });
    setChallengeFormSuccess(
      `Défi publié avec succès. ${rewardXp} XP ont été déduits de votre solde et mis en escrow (récompense pour le solveur).`
    );
  }

  function openSolveModal(challengeId) {
    setSolveTargetId(challengeId);
    setSolveProposal('');
    setSolveMode('solution');
  }

  function closeSolveModal() {
    setSolveTargetId(null);
    setSolveProposal('');
    setSolveMode('solution');
  }

  function handleSubmitChallengeSolution() {
    if (!solveTarget || solveTarget.status === 'Résolu') return;

    const proposal = solveProposal.trim();
    if (!proposal) return;

    const solverName = studentName || 'Stagiaire';
    const bounty = Number(solveTarget.rewardXp) || 0;

    setChallenges((prev) =>
      prev.map((challenge) => {
        if (challenge.id !== solveTarget.id) return challenge;
        return {
          ...challenge,
          status: 'Résolu',
          solvedBy: solverName,
          solution:
            solveMode === 'connect'
              ? `Collaboration proposée avec l’auteur puis solution validée : ${proposal}`
              : proposal,
        };
      })
    );

    // Transfer escrowed bounty to solver
    if (bounty > 0) {
      addXp(bounty);
    }

    setChallengeFeedback(
      `Défi "${solveTarget.title}" marqué comme résolu. +${bounty} XP transférés au solveur (${solverName}) depuis l'escrow du défi.`
    );
    closeSolveModal();
  }

  return (
    <section className="skill-match-page">
      <div className="skill-match-header-row">
        <div>
          <h2 className="actions-section-title">Skill Match</h2>
          <p className="section-subtitle">
            Trouvez des paires complémentaires, valorisez les soft skills et relevez des défis techniques du centre.
          </p>
        </div>
        <div className="skill-match-header-actions">
          <span className="reward-badge" title="Récompenses collaboration et défis">+50 XP / +30 XP / Bounty</span>
          <Link to="/stagiaire/dashboard" className="back-link">
            ← Retour au dashboard
          </Link>
        </div>
      </div>

      <div className="page-view-tabs" role="tablist" aria-label="Sections Skill Match">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'peers'}
          className={`page-view-tab ${activeView === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveView('peers')}
        >
          Paires complémentaires
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'challenges'}
          className={`page-view-tab ${activeView === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveView('challenges')}
        >
          Défis & Résolution de problèmes
        </button>
      </div>

      {activeView === 'peers' ? (
        <>
          <article className="glass-panel skill-search-panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Peer Finder (Paires complémentaires)</h3>
                <p className="panel-subtitle">
                  Recherchez des profils par compétence technique ou soft skill (React, Python, UI/UX, Communication...).
                </p>
              </div>
            </div>

            <div className="skill-search-bar-wrap">
              <label htmlFor="skill-search" className="skill-search-label">Filtrer par compétence / profil</label>
              <input
                id="skill-search"
                type="text"
                className="skill-search-input"
                placeholder="Ex. React, Python, UI/UX, Marketing, Communication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {feedback ? <p className="feedback-text success skill-feedback">{feedback}</p> : null}
          </article>

          <section className="peers-section">
            <div className="section-inline-head">
              <h3 className="panel-title">Profils recommandés</h3>
              <p className="panel-subtitle">{filteredPeers.length} profil(s) trouvé(s)</p>
            </div>

            {filteredPeers.length === 0 ? (
              <div className="glass-panel empty-state-card">
                <p>Aucun profil ne correspond à votre recherche pour le moment.</p>
              </div>
            ) : (
              <div className="peers-grid">
                {filteredPeers.map((peer) => {
                  const isSent = peer.requestStatus === 'sent';
                  const peerSoftSkills = peer.softSkillBadges || [];
                  return (
                    <article key={peer.id} className="peer-card">
                      <div className="peer-card-top">
                        <div className="peer-avatar" aria-hidden="true">
                          {peer.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="peer-identity">
                          <h4 className="peer-name">{peer.name}</h4>
                          <p className="peer-group">{peer.group}</p>
                        </div>
                        <div className="match-indicator" aria-label={`Compatibilité ${peer.matchPercent}%`}>
                          <span className="match-value">{peer.matchPercent}%</span>
                          <span className="match-label">Match</span>
                        </div>
                      </div>

                      <div className="match-bar" aria-hidden="true">
                        <div className="match-bar-fill" style={{ width: `${peer.matchPercent}%` }} />
                      </div>

                      <div className="peer-section-block">
                        <p className="peer-block-label">Compétences fortes</p>
                        <div className="skill-tags">
                          {peer.strongSkills.map((skill) => (
                            <span key={skill} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="peer-section-block">
                        <p className="peer-block-label">Recherche / compétence complémentaire</p>
                        <p className="peer-looking-for">{peer.lookingFor}</p>
                      </div>

                      <div className="peer-section-block">
                        <p className="peer-block-label">Soft skills endossés (Badges de confiance)</p>
                        {peerSoftSkills.length > 0 ? (
                          <div className="soft-skill-badges">
                            {peerSoftSkills.map((skill) => (
                              <span key={skill} className="soft-skill-badge">🌟 {skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-inline-text">Aucun badge de confiance pour le moment.</p>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`connect-btn ${isSent ? 'sent' : ''}`}
                        onClick={() => handleConnect(peer.id)}
                        disabled={isSent}
                      >
                        {isSent ? 'Demande envoyée ⏳' : 'Se connecter / Proposer un binôme'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="connections-section glass-panel">
            <div className="panel-head connections-head">
              <div>
                <h3 className="panel-title">Mes connexions / Binômes</h3>
                <p className="panel-subtitle">Suivez vos collaborations actives/en attente et endossez les soft skills après collaboration.</p>
              </div>
            </div>

            <div className="soft-skills-info-box">
              <p className="soft-skills-info-title">Soft Skills & Badges de Confiance</p>
              <p className="soft-skills-info-text">
                Exemples : Travail en équipe, Gestion du temps, Résolution de problèmes, Communication. Endossez 1 à 2 soft skills
                pour un binôme actif après une collaboration réussie.
              </p>
            </div>

            {connections.length === 0 ? (
              <div className="empty-state-inline">
                <p>Aucune connexion pour le moment. Envoyez une demande depuis les profils recommandés.</p>
              </div>
            ) : (
              <div className="connections-list">
                {connections.map((connection) => {
                  const isActive = connection.status === 'Actif';
                  const badges = connection.softSkillBadges || [];

                  return (
                    <div key={connection.id} className="connection-item">
                      <div className="connection-main">
                        <div className="connection-title-row">
                          <h4 className="connection-name">
                            {connection.name} <span className="connection-group">• {connection.group}</span>
                          </h4>
                          <span className={`connection-status ${isActive ? 'active' : 'pending'}`}>
                            {connection.status}
                          </span>
                        </div>

                        <p className="connection-focus">Focus compétences : {connection.skillFocus}</p>
                        <p className="connection-note">{connection.note}</p>

                        <div className="connection-soft-skills-block">
                          <p className="peer-block-label">Soft skills endossés</p>
                          {badges.length > 0 ? (
                            <div className="soft-skill-badges">
                              {badges.map((skill) => (
                                <span key={skill} className="soft-skill-badge">🌟 {skill}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="empty-inline-text">Aucun badge de confiance attribué pour le moment.</p>
                          )}
                        </div>

                        <div className="connection-actions">
                          {isActive ? (
                            <button
                              type="button"
                              className={`endorse-btn ${connection.endorsedByMe ? 'done' : ''}`}
                              onClick={() => openEndorsementModal(connection.id)}
                              disabled={connection.endorsedByMe}
                            >
                              {connection.endorsedByMe ? 'Soft skills endossés ✓' : '🌟 Endosser les Soft Skills'}
                            </button>
                          ) : (
                            <p className="endorsement-hint">L’endossement sera disponible après activation du binôme (collaboration complétée).</p>
                          )}
                          {connection.endorsedByMe ? (
                            <span className="endorsement-reward-note">+{ENDORSEMENT_XP_REWARD} XP attribués (bonus collaboration)</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="challenges-board">
          <div className="challenges-layout">
            <article className="glass-panel challenge-form-panel">
              <div className="panel-head">
                <div>
                  <h3 className="panel-title">Publier un défi technique</h3>
                  <p className="panel-subtitle">
                    Stagiaires et formateurs peuvent partager des problèmes réels (DEV, mécanique, électronique, etc.) pour obtenir de l’aide.
                  </p>
                </div>
              </div>

              <div className="escrow-info-box">
                <p><strong>Solde actuel :</strong> {xp.toLocaleString('fr-FR')} XP</p>
                <p>Le bounty XP choisi sera <strong>déduit immédiatement</strong> de votre solde à la publication (escrow) puis transféré au solveur quand le défi sera marqué résolu.</p>
              </div>

              <form className="challenge-form" onSubmit={handleCreateChallenge}>
                <div className="form-field">
                  <label htmlFor="challenge-title">Titre du défi</label>
                  <input
                    id="challenge-title"
                    type="text"
                    placeholder="ex. Bug d'authentification API"
                    value={challengeForm.title}
                    onChange={(e) => handleChallengeFormChange('title', e.target.value)}
                  />
                </div>

                <div className="form-field-grid challenge-form-grid">
                  <div className="form-field">
                    <label htmlFor="challenge-specialty">Catégorie / Spécialité</label>
                    <select
                      id="challenge-specialty"
                      value={challengeForm.specialty}
                      onChange={(e) => handleChallengeFormChange('specialty', e.target.value)}
                    >
                      {CHALLENGE_SPECIALTIES.map((specialty) => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="challenge-reward">Récompense XP (bounty)</label>
                    <input
                      id="challenge-reward"
                      type="number"
                      min="10"
                      step="10"
                      value={challengeForm.rewardXp}
                      onChange={(e) => handleChallengeFormChange('rewardXp', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="challenge-description">Description du problème</label>
                  <textarea
                    id="challenge-description"
                    rows={4}
                    placeholder="Décrivez le problème technique, le contexte, et ce que vous avez déjà essayé..."
                    value={challengeForm.description}
                    onChange={(e) => handleChallengeFormChange('description', e.target.value)}
                  />
                </div>

                {challengeFormError ? <p className="feedback-text error">{challengeFormError}</p> : null}
                {challengeFormSuccess ? <p className="feedback-text success">{challengeFormSuccess}</p> : null}

                <button type="submit" className="primary-action-btn">Publier le défi (escrow XP)</button>
              </form>
            </article>

            <article className="glass-panel challenges-list-panel">
              <div className="panel-head">
                <div>
                  <h3 className="panel-title">Center Challenges & Problem Solving Board</h3>
                  <p className="panel-subtitle">Aidez vos pairs à résoudre des défis techniques et gagnez des XP bounty (transférés depuis l'escrow).</p>
                </div>
              </div>

              {challengeFeedback ? <p className="feedback-text success challenge-feedback">{challengeFeedback}</p> : null}

              <div className="challenge-filters">
                {['Tous', 'Ouvert', 'Résolu', ...CHALLENGE_SPECIALTIES].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`challenge-filter-chip ${challengeFilter === filter ? 'active' : ''}`}
                    onClick={() => setChallengeFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="empty-state-inline">
                  <p>Aucun défi ne correspond à ce filtre pour le moment.</p>
                </div>
              ) : (
                <div className="challenges-list">
                  {filteredChallenges.map((challenge) => {
                    const solved = challenge.status === 'Résolu';
                    return (
                      <div key={challenge.id} className={`challenge-card ${solved ? 'solved' : ''}`}>
                        <div className="challenge-card-top">
                          <div className="challenge-title-wrap">
                            <h4 className="challenge-title">{challenge.title}</h4>
                            <div className="challenge-tags">
                              <span className="challenge-tag specialty">Tag: {challenge.specialty}</span>
                              <span className="challenge-tag bounty">+{challenge.rewardXp} XP</span>
                              <span className={`challenge-status ${solved ? 'solved' : 'open'}`}>
                                {solved ? 'Résolu 🟢' : 'Ouvert'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="challenge-meta">Publié par {challenge.authorName} • {challenge.authorGroup}</p>
                        <p className="challenge-description">{challenge.description}</p>

                        {solved ? (
                          <div className="challenge-solution-box">
                            <p className="challenge-solution-title">
                              Solution validée {challenge.solvedBy ? `par ${challenge.solvedBy}` : ''} — bounty transféré
                            </p>
                            <p className="challenge-solution-text">{challenge.solution || 'Défi marqué comme résolu.'}</p>
                          </div>
                        ) : (
                          <div className="challenge-actions">
                            <button type="button" className="connect-btn" onClick={() => openSolveModal(challenge.id)}>
                              Relever le défi 💡
                            </button>
                            <span className="challenge-hint">
                              Proposez une solution ou collaborez avec l’auteur. À la résolution, le bounty XP escrow sera transféré au solveur.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      {endorsementTarget ? (
        <div className="modal-overlay" role="presentation" onClick={closeEndorsementModal}>
          <div
            className="endorsement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="endorsement-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="endorsement-modal-title" className="modal-title">Endosser les Soft Skills</h3>
                <p className="modal-subtitle">
                  Sélectionnez 1 ou 2 soft skills pour <strong>{endorsementTarget.name}</strong>.
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeEndorsementModal} aria-label="Fermer">
                ×
              </button>
            </div>

            <div className="soft-skill-options">
              {SOFT_SKILLS.map((skill) => {
                const selected = selectedSoftSkills.includes(skill);
                const limitReached = !selected && selectedSoftSkills.length >= 2;
                return (
                  <button
                    key={skill}
                    type="button"
                    className={`soft-skill-option ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSoftSkill(skill)}
                    disabled={limitReached}
                    aria-pressed={selected}
                  >
                    <span>{skill}</span>
                    <span className="option-check" aria-hidden="true">{selected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <p className="modal-helper-text">
              Vous pouvez choisir 1 à 2 compétences. Récompense : <strong>+{ENDORSEMENT_XP_REWARD} XP</strong> (bonus collaboration pour les deux stagiaires).
            </p>

            <div className="modal-actions">
              <button type="button" className="secondary-action-btn" onClick={closeEndorsementModal}>
                Annuler
              </button>
              <button
                type="button"
                className="primary-action-btn"
                onClick={handleSubmitEndorsement}
                disabled={selectedSoftSkills.length === 0}
              >
                Valider l’endossement
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {solveTarget ? (
        <div className="modal-overlay" role="presentation" onClick={closeSolveModal}>
          <div
            className="endorsement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solve-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="solve-modal-title" className="modal-title">Relever le défi</h3>
                <p className="modal-subtitle">
                  {solveTarget.title} — <strong>+{solveTarget.rewardXp} XP</strong> bounty (escrow)
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeSolveModal} aria-label="Fermer">
                ×
              </button>
            </div>

            <div className="solve-mode-switch" role="group" aria-label="Mode de contribution">
              <button
                type="button"
                className={`solve-mode-btn ${solveMode === 'solution' ? 'active' : ''}`}
                onClick={() => setSolveMode('solution')}
              >
                Proposer une solution
              </button>
              <button
                type="button"
                className={`solve-mode-btn ${solveMode === 'connect' ? 'active' : ''}`}
                onClick={() => setSolveMode('connect')}
              >
                Collaborer avec l’auteur
              </button>
            </div>

            <div className="form-field modal-form-field">
              <label htmlFor="solve-proposal">
                {solveMode === 'connect' ? 'Message de collaboration / plan de résolution' : 'Votre solution proposée'}
              </label>
              <textarea
                id="solve-proposal"
                rows={5}
                placeholder={
                  solveMode === 'connect'
                    ? "Expliquez comment vous souhaitez collaborer avec l’auteur pour résoudre le défi..."
                    : "Décrivez votre solution, les étapes ou la correction proposée..."
                }
                value={solveProposal}
                onChange={(e) => setSolveProposal(e.target.value)}
              />
            </div>

            <p className="modal-helper-text">
              Une fois la proposition validée/acceptée, le défi sera marqué <strong>Résolu 🟢</strong> et le bounty XP escrow sera transféré dynamiquement au solveur.
            </p>

            <div className="modal-actions">
              <button type="button" className="secondary-action-btn" onClick={closeSolveModal}>
                Annuler
              </button>
              <button
                type="button"
                className="primary-action-btn"
                onClick={handleSubmitChallengeSolution}
                disabled={!solveProposal.trim()}
              >
                Valider & marquer résolu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
