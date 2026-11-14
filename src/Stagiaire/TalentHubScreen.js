import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import './FolderCss/TalentHub.css';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUBMISSION_XP_REWARD = 100;

const STATUS_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Validé' },
  { key: 'rejected', label: 'Refusé' },
];

function formatTodayLabel() {
  return "Soumis aujourd'hui";
}

function getStatusMeta(status) {
  switch (status) {
    case 'Validé':
      return { key: 'approved', label: 'Validé', className: 'validated' };
    case 'Refusé':
      return { key: 'rejected', label: 'Refusé', className: 'rejected' };
    case 'En attente':
    default:
      return { key: 'pending', label: 'En attente', className: 'pending' };
  }
}

export default function TalentHubScreen() {
  const { addXp } = useOutletContext();

  const [title, setTitle] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [description, setDescription] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [activeStatusTab, setActiveStatusTab] = useState('all');

  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Gestion de stock',
      link: 'https://github.com/example/gestion-stock',
      description:
        'Application web pour gérer les entrées/sorties de stock, les alertes de seuil et le suivi des produits.',
      instructorName: 'M. El Amrani',
      groupMembers: 'Yassine Naimi, Omar Alami',
      status: 'En attente',
      submittedLabel: "Soumis aujourd'hui",
    },
    {
      id: 2,
      title: 'Portfolio personnel',
      link: 'https://demo.example.com/portfolio',
      description:
        'Site portfolio responsive présentant mes projets, compétences et expériences avec un design moderne.',
      instructorName: 'Mme. Benali',
      groupMembers: '',
      status: 'Validé',
      submittedLabel: 'Soumis hier',
      xpReward: 100,
    },
    {
      id: 3,
      title: 'API de réservation',
      link: 'https://github.com/example/booking-api',
      description:
        'API REST pour la gestion des réservations, disponibilités et authentification des utilisateurs.',
      instructorName: 'M. El Amrani',
      groupMembers: 'Yassine Naimi, Sara Idrissi',
      status: 'Validé',
      submittedLabel: 'Soumis cette semaine',
      xpReward: 100,
    },
    {
      id: 4,
      title: 'Plateforme e-learning',
      link: 'https://github.com/example/elearning-platform',
      description:
        'Plateforme d’apprentissage en ligne avec gestion de cours, progression des stagiaires et quiz interactifs.',
      instructorName: 'M. El Amrani',
      groupMembers: 'Yassine Naimi, Omar Alami, Hiba Zahra',
      status: 'Refusé',
      submittedLabel: 'Soumis cette semaine',
      feedback: "Merci de revoir la documentation et l'authentification.",
      reviewer: 'M. El Amrani',
    },
  ]);

  const stats = useMemo(() => {
    const total = projects.length;
    const validated = projects.filter((project) => project.status === 'Validé').length;
    const pending = projects.filter((project) => project.status === 'En attente').length;
    const rejected = projects.filter((project) => project.status === 'Refusé').length;
    const views = 128 + Math.max(0, total - 4) * 12;
    return { total, views, validated, pending, rejected };
  }, [projects]);

  const statusCounts = useMemo(
    () => ({
      all: projects.length,
      pending: stats.pending,
      approved: stats.validated,
      rejected: stats.rejected,
    }),
    [projects.length, stats.pending, stats.validated, stats.rejected]
  );

  const filteredProjects = useMemo(() => {
    if (activeStatusTab === 'all') return projects;
    return projects.filter((project) => getStatusMeta(project.status).key === activeStatusTab);
  }, [projects, activeStatusTab]);

  function applySelectedFiles(fileList) {
    const files = Array.from(fileList || []);
    const allowed = [];
    let rejectedCount = 0;

    files.forEach((file) => {
      if (file.size <= MAX_FILE_SIZE_BYTES) {
        allowed.push(file);
      } else {
        rejectedCount += 1;
      }
    });

    setSelectedFiles(allowed);
    if (rejectedCount > 0) {
      setFormError(`Certains fichiers dépassent ${MAX_FILE_SIZE_MB} Mo et ont été ignorés.`);
    } else {
      setFormError('');
    }
  }

  function handleFileInputChange(event) {
    applySelectedFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    applySelectedFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const trimmedTitle = title.trim();
    const trimmedLink = projectLink.trim();
    const trimmedDescription = description.trim();
    const trimmedInstructorName = instructorName.trim();
    const trimmedGroupMembers = groupMembers.trim();

    if (!trimmedTitle || !trimmedLink) {
      setFormError('Veuillez renseigner le titre du projet et le lien GitHub / démo.');
      return;
    }

    if (!isValidUrl(trimmedLink)) {
      setFormError('Veuillez fournir un lien valide (ex. https://github.com/...).');
      return;
    }

    const newProject = {
      id: Date.now(),
      title: trimmedTitle,
      link: trimmedLink,
      description: trimmedDescription,
      instructorName: trimmedInstructorName,
      groupMembers: trimmedGroupMembers,
      files: selectedFiles.map((file) => file.name),
      status: 'En attente',
      submittedLabel: formatTodayLabel(),
    };

    setProjects((prev) => [newProject, ...prev]);
    addXp(SUBMISSION_XP_REWARD);
    setActiveStatusTab('pending');

    setFormSuccess(`Projet soumis avec succès ! +${SUBMISSION_XP_REWARD} XP ajoutés à votre profil.`);
    setTitle('');
    setProjectLink('');
    setDescription('');
    setInstructorName('');
    setGroupMembers('');
    setSelectedFiles([]);
    setFileInputKey((prev) => prev + 1);
  }

  return (
    <section className="talent-hub-page">
      <div className="talent-hub-header-row">
        <div>
          <h2 className="actions-section-title">Talent Hub & Projects</h2>
          <p className="section-subtitle">
            Publiez vos projets, suivez leur validation et gagnez des XP.
          </p>
        </div>
        <div className="talent-hub-header-actions">
          <span className="reward-badge" title="Récompense de soumission">+100 XP</span>
          <Link to="/stagiaire/dashboard" className="back-link">
            ← Retour au dashboard
          </Link>
        </div>
      </div>

      <div className="talent-stats-grid">
        <article className="talent-stat-card">
          <p className="stat-label">Projets</p>
          <p className="stat-value">{stats.total}</p>
          <p className="stat-note">Total soumis</p>
        </article>
        <article className="talent-stat-card">
          <p className="stat-label">Vues</p>
          <p className="stat-value">{stats.views}</p>
          <p className="stat-note">Visibilité des projets</p>
        </article>
        <article className="talent-stat-card">
          <p className="stat-label">Validés</p>
          <p className="stat-value">{stats.validated}</p>
          <p className="stat-note">Approuvés par l’équipe</p>
        </article>
      </div>

      <div className="talent-hub-content-grid">
        <article className="glass-panel talent-form-panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Soumettre un projet</h3>
              <p className="panel-subtitle">Renseignez les informations et envoyez votre projet pour validation.</p>
            </div>
          </div>

          <form className="talent-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="project-title">Titre du projet</label>
              <input
                id="project-title"
                type="text"
                placeholder="ex. Application de gestion de stock"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-link">Lien GitHub / démo</label>
              <input
                id="project-link"
                type="url"
                placeholder="https://github.com/..."
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-description">Description du projet</label>
              <textarea
                id="project-description"
                rows={5}
                placeholder="Donnez une brève description de votre projet, ses fonctionnalités principales..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-field-grid">
              <div className="form-field">
                <label htmlFor="instructor-name">Nom du formateur / Professeur</label>
                <input
                  id="instructor-name"
                  type="text"
                  placeholder="ex. M. El Amrani ou Mme. Benali"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="group-members">Membres du groupe (optionnel)</label>
                <input
                  id="group-members"
                  type="text"
                  placeholder="ex. Yassine Naimi, Omar Alami, Sara Idrissi"
                  value={groupMembers}
                  onChange={(e) => setGroupMembers(e.target.value)}
                />
                <p className="field-hint">Si le projet est individuel, vous pouvez laisser ce champ vide.</p>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="project-files">Captures / fichiers</label>
              <label
                htmlFor="project-files"
                className="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  key={fileInputKey}
                  id="project-files"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.zip"
                  onChange={handleFileInputChange}
                  className="file-input-hidden"
                />
                <div className="upload-dropzone-content">
                  <p className="upload-title">Ajouter captures / fichiers</p>
                  <p className="upload-subtitle">PNG, PDF, ZIP - 10 Mo max</p>
                  <p className="upload-hint">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
                </div>
              </label>
              {selectedFiles.length > 0 ? (
                <ul className="selected-files-list">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {formError ? <p className="feedback-text error">{formError}</p> : null}
            {formSuccess ? <p className="feedback-text success">{formSuccess}</p> : null}

            <button type="submit" className="primary-action-btn submit-project-btn">
              Soumettre pour validation
            </button>
          </form>
        </article>

        <article className="glass-panel talent-projects-panel">
          <div className="panel-head projects-panel-head">
            <div>
              <h3 className="panel-title">Mes projets soumis</h3>
              <p className="panel-subtitle">Suivez vos projets par statut (en attente, validés, refusés).</p>
            </div>
          </div>

          <div className="status-tabs" role="tablist" aria-label="Filtrer les projets par statut">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeStatusTab === tab.key}
                className={`status-tab ${activeStatusTab === tab.key ? 'active' : ''} tab-${tab.key}`}
                onClick={() => setActiveStatusTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{statusCounts[tab.key] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="projects-list" role="tabpanel">
            {filteredProjects.length === 0 ? (
              <div className="empty-projects-state">
                <p>Aucun projet dans cette catégorie pour le moment.</p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const statusMeta = getStatusMeta(project.status);
                return (
                  <div key={project.id} className={`project-item project-${statusMeta.className}`}>
                    <div className="project-item-main">
                      <div className="project-item-top">
                        <h4 className="project-title">{project.title}</h4>
                        <div className="project-badges">
                          {project.status === 'Validé' ? (
                            <span className="project-xp-badge">+{project.xpReward || SUBMISSION_XP_REWARD} XP</span>
                          ) : null}
                          <span className={`project-status ${statusMeta.className}`}>{project.status}</span>
                        </div>
                      </div>

                      <p className="project-meta">{project.submittedLabel}</p>

                      {project.description ? (
                        <p className="project-description">{project.description}</p>
                      ) : null}

                      <div className="project-assignment-info">
                        <p className="project-assignment-line">
                          <span className="assignment-label">Envoyé à :</span>{' '}
                          <span className="assignment-value">
                            {project.instructorName || 'Formateur non spécifié'}
                          </span>
                        </p>
                        {project.groupMembers ? (
                          <p className="project-assignment-line">
                            <span className="assignment-label">Membres du groupe :</span>{' '}
                            <span className="assignment-value">{project.groupMembers}</span>
                          </p>
                        ) : null}
                      </div>

                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noreferrer" className="project-link">
                          {project.link}
                        </a>
                      ) : null}

                      {project.status === 'Refusé' ? (
                        <div className="project-feedback rejected-feedback" role="note">
                          <p className="feedback-message">
                            <span className="feedback-icon" aria-hidden="true">⚠️</span>
                            <span>{project.feedback || 'Des révisions sont nécessaires pour ce projet.'}</span>
                          </p>
                          <p className="feedback-author">— {project.reviewer || project.instructorName || 'Formateur'}</p>
                        </div>
                      ) : null}

                      {project.status === 'Validé' ? (
                        <p className="project-approved-note">Projet approuvé par un formateur. Récompense XP attribuée.</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
