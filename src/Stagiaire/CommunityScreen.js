import React, { useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import GestureVideoRecorder from '../components/GestureVideoRecorder';
import './FolderCss/CommunityScreen.css';

const PUBLISH_XP_REWARD = 20;

const FEED_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Vidéos' },
  { key: 'projects', label: 'Projets' },
];

const INITIAL_POSTS = [
  {
    id: 1,
    author: 'Yassine Benali',
    group: 'DEV101',
    time: 'Il y a 2 h',
    type: 'projects',
    content:
      "J'ai terminé mon dashboard React pour le projet TalentBridge. Interface responsive, composants réutilisables et intégration API en cours. Vos retours sont les bienvenus !",
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    imageAlt: 'Espace de travail de développement web avec code sur écran',
    likes: 24,
    liked: false,
    comments: [
      { id: 11, author: 'Sara El Amrani', text: 'Super travail, le design est très propre !' },
    ],
  },
  {
    id: 2,
    author: 'Sara El Amrani',
    group: 'DEV102',
    time: 'Il y a 4 h',
    type: 'photos',
    content:
      'Prototype UI/UX finalisé pour notre application mobile de suivi pédagogique. Focus sur l’accessibilité et la cohérence visuelle.',
    imageUrl:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=80',
    imageAlt: 'Maquettes UI/UX et design d’interface sur écran',
    likes: 31,
    liked: false,
    comments: [],
  },
  {
    id: 3,
    author: 'Hamza Ait Lahcen',
    group: 'Mécanique Auto',
    time: 'Il y a 6 h',
    type: 'projects',
    content:
      'Atelier mécanique : diagnostic moteur et contrôle des systèmes de freinage sur véhicule pédagogique. Excellente séance pratique en équipe.',
    imageUrl:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1400&q=80',
    imageAlt: 'Atelier mécanique automobile avec techniciens en formation',
    likes: 18,
    liked: false,
    comments: [
      { id: 31, author: 'Yassine Benali', text: 'Bravo pour le travail pratique en atelier !' },
    ],
  },
  {
    id: 4,
    author: 'Imane Rachidi',
    group: 'Électricité',
    time: 'Hier',
    type: 'photos',
    content:
      'Séance pratique en électricité : câblage de tableau, tests de continuité et mesures de sécurité. Progression solide sur les normes.',
    imageUrl:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=80',
    imageAlt: 'Étudiante en atelier d’électricité industrielle travaillant sur un tableau',
    likes: 22,
    liked: false,
    comments: [],
  },
  {
    id: 5,
    author: 'Nadia Kabbaj',
    group: 'DEV103',
    time: 'Hier',
    type: 'videos',
    content:
      'Démo vidéo de notre module de gestion de projets (workflow, validation formateur, suivi XP). N’hésitez pas à commenter les améliorations possibles.',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    imageAlt: 'Session de collaboration et enregistrement de démonstration sur ordinateur',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    likes: 15,
    liked: false,
    comments: [],
  },
];

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CommunityScreen() {
  const { studentName, xp, addXp } = useOutletContext();
  const authorName = studentName || 'Yassine Benali';
  const authorGroup = 'DEV101';

  const [activeTab, setActiveTab] = useState('all');
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [composerMode, setComposerMode] = useState('none'); // none | photo | video
  const [attachedPhoto, setAttachedPhoto] = useState(null); // { url, name }
  const [attachedVideo, setAttachedVideo] = useState(null); // { url, name, mimeType }
  const [composerNotice, setComposerNotice] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});

  const photoInputRef = useRef(null);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return posts;
    return posts.filter((post) => post.type === activeTab);
  }, [posts, activeTab]);

  const revokeComposerMediaUrls = () => {
    if (attachedPhoto?.url && attachedPhoto.isLocal) URL.revokeObjectURL(attachedPhoto.url);
    if (attachedVideo?.url && attachedVideo.isLocal) URL.revokeObjectURL(attachedVideo.url);
  };

  const handlePickPhoto = () => {
    setComposerMode('photo');
    setComposerNotice('');
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (attachedPhoto?.url && attachedPhoto.isLocal) {
      URL.revokeObjectURL(attachedPhoto.url);
    }
    if (attachedVideo?.url && attachedVideo.isLocal) {
      URL.revokeObjectURL(attachedVideo.url);
      setAttachedVideo(null);
    }

    const url = URL.createObjectURL(file);
    setAttachedPhoto({ url, name: file.name, isLocal: true });
    setComposerMode('photo');
    setComposerNotice('Photo ajoutée au post. Vous pouvez publier.');
    event.target.value = '';
  };

  const handleVideoMode = () => {
    setComposerMode((prev) => (prev === 'video' ? 'none' : 'video'));
    setComposerNotice('Mode caméra IA activé : caméra prête automatiquement. ✌️ pour démarrer (REC 🔴), 👍 pour arrêter et attacher la vidéo.');
  };

  const handleRecordedVideo = ({ url, file, mimeType }) => {
    if (attachedPhoto?.url && attachedPhoto.isLocal) {
      URL.revokeObjectURL(attachedPhoto.url);
      setAttachedPhoto(null);
    }
    if (attachedVideo?.url && attachedVideo.isLocal) {
      URL.revokeObjectURL(attachedVideo.url);
    }

    setAttachedVideo({
      url,
      name: file?.name || 'video-community.webm',
      mimeType: mimeType || 'video/webm',
      isLocal: true,
    });
    setComposerMode('video');
    setComposerNotice('Vidéo capturée et attachée au post. Prête à publier.');
  };

  const handleRemoveAttachment = () => {
    revokeComposerMediaUrls();
    setAttachedPhoto(null);
    setAttachedVideo(null);
    setComposerNotice('Média retiré du brouillon.');
  };

  const handlePublish = () => {
    const text = postText.trim();
    if (!text && !attachedPhoto && !attachedVideo) {
      setComposerNotice('Ajoutez un texte, une photo ou une vidéo avant de publier.');
      return;
    }

    const type = attachedVideo ? 'videos' : attachedPhoto ? 'photos' : 'projects';
    const newPost = {
      id: Date.now(),
      author: authorName,
      group: authorGroup,
      time: 'À l’instant',
      type,
      content: text || (attachedVideo ? 'Nouvelle vidéo partagée avec la communauté.' : 'Nouvelle photo partagée avec la communauté.'),
      imageUrl: attachedPhoto ? attachedPhoto.url : (attachedVideo ? '' : ''),
      imageAlt: attachedPhoto ? 'Photo partagée par un stagiaire' : '',
      imageIsLocal: Boolean(attachedPhoto?.isLocal),
      videoUrl: attachedVideo ? attachedVideo.url : '',
      videoIsLocal: Boolean(attachedVideo?.isLocal),
      likes: 0,
      liked: false,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    addXp(PUBLISH_XP_REWARD);
    setPostText('');
    setAttachedPhoto(null);
    setAttachedVideo(null);
    setComposerMode('none');
    setComposerNotice(`Publication réussie ! +${PUBLISH_XP_REWARD} XP ajoutés à votre profil.`);
  };

  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      })
    );
  };

  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentDraftChange = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const submitComment = (postId) => {
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: Date.now() + Math.random(), author: authorName, text: draft },
          ],
        };
      })
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setOpenComments((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <section className="community-page">
      <div className="community-header-row">
        <div>
          <h2 className="actions-section-title">Communauté</h2>
          <p className="section-subtitle">
            Partagez vos photos, vidéos et projets avec les stagiaires TalentBridge.
          </p>
        </div>
        <div className="community-header-actions">
          <span className="reward-badge" title="Récompense de publication">+{PUBLISH_XP_REWARD} XP / publication</span>
          <Link to="/stagiaire/dashboard" className="back-link">← Retour au dashboard</Link>
        </div>
      </div>

      <div className="community-tabs" role="tablist" aria-label="Filtres de la communauté">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`community-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <article className="glass-panel composer-panel">
        <div className="composer-top">
          <div className="composer-avatar" aria-hidden="true">{getInitials(authorName)}</div>
          <div className="composer-input-wrap">
            <textarea
              className="composer-textarea"
              rows={3}
              placeholder="Partager une photo, vidéo ou un projet..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="composer-meta-line">
              <span>{authorName} · {authorGroup}</span>
              <span>XP actuel : {xp.toLocaleString('fr-FR')}</span>
            </div>
          </div>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handlePhotoChange}
        />

        {(attachedPhoto || attachedVideo) && (
          <div className="composer-attachment-preview">
            <div className="attachment-preview-head">
              <p className="attachment-preview-title">
                {attachedVideo ? 'Vidéo attachée au post' : 'Photo attachée au post'}
              </p>
              <button type="button" className="attachment-remove-btn" onClick={handleRemoveAttachment}>
                Retirer
              </button>
            </div>
            {attachedPhoto ? (
              <img src={attachedPhoto.url} alt="Aperçu de la photo à publier" className="attachment-photo-preview" />
            ) : null}
            {attachedVideo ? (
              <video src={attachedVideo.url} controls playsInline className="attachment-video-preview" />
            ) : null}
          </div>
        )}

        {composerMode === 'video' ? (
          <div className="composer-recorder-wrap">
            <GestureVideoRecorder
              title="Caméra IA mains libres (Communauté)"
              subtitle="Détection continue : la caméra s’active automatiquement pour enregistrer sans souris ni clavier."
              startGestures={['peace']}
              stopGestures={['thumbs_up']}
              continuous
              autoEnable
              showPreview={false}
              showDownload={false}
              onRecordingComplete={handleRecordedVideo}
            />
            <p className="gesture-mapping-note">
              Gestes configurés : <strong>✌️ Démarrer l’enregistrement (REC 🔴)</strong> · <strong>👍 Arrêter et attacher la vidéo</strong>
            </p>
          </div>
        ) : null}

        {composerNotice ? <p className="composer-notice">{composerNotice}</p> : null}

        <div className="composer-actions">
          <div className="composer-action-left">
            <button type="button" className="composer-action-btn" onClick={handlePickPhoto}>
              Photo
            </button>
            <button
              type="button"
              className={`composer-action-btn ${composerMode === 'video' ? 'active' : ''}`}
              onClick={handleVideoMode}
            >
              Vidéo / Caméra IA
            </button>
          </div>
          <button type="button" className="publish-btn" onClick={handlePublish}>
            Publier +{PUBLISH_XP_REWARD} XP
          </button>
        </div>
      </article>

      <div className="community-feed">
        {filteredPosts.length === 0 ? (
          <article className="glass-panel empty-feed">
            <p>Aucune publication dans cette catégorie pour le moment.</p>
          </article>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.id} className="glass-panel feed-post-card">
              <div className="post-header">
                <div className="post-avatar" aria-hidden="true">{getInitials(post.author)}</div>
                <div className="post-author-block">
                  <p className="post-author-name">{post.author}</p>
                  <p className="post-author-meta">{post.group} · {post.time}</p>
                </div>
                <span className={`post-type-badge type-${post.type}`}>
                  {post.type === 'photos' ? 'Photo' : post.type === 'videos' ? 'Vidéo' : 'Projet'}
                </span>
              </div>

              <p className="post-content">{post.content}</p>

              {post.imageUrl ? (
                <div className="post-media-wrap">
                  <img src={post.imageUrl} alt={post.imageAlt || 'Publication communauté'} className="post-media-image" loading="lazy" />
                </div>
              ) : null}

              {post.videoUrl ? (
                <div className="post-media-wrap">
                  <video src={post.videoUrl} controls playsInline className="post-media-video" preload="metadata" />
                </div>
              ) : null}

              <div className="post-actions">
                <button
                  type="button"
                  className={`post-action-btn like-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                  aria-pressed={post.liked}
                >
                  ♥ J’aime <span className="action-count">{post.likes}</span>
                </button>
                <button
                  type="button"
                  className="post-action-btn comment-btn"
                  onClick={() => toggleComments(post.id)}
                >
                  💬 Commenter <span className="action-count">{post.comments.length}</span>
                </button>
              </div>

              {openComments[post.id] ? (
                <div className="post-comments-section">
                  {post.comments.length > 0 ? (
                    <div className="comments-list">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <p className="comment-author">{comment.author}</p>
                          <p className="comment-text">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-comments-text">Aucun commentaire pour le moment. Soyez le premier à réagir.</p>
                  )}

                  <div className="comment-compose-row">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Écrire un commentaire..."
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) => handleCommentDraftChange(post.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitComment(post.id);
                        }
                      }}
                    />
                    <button type="button" className="comment-submit-btn" onClick={() => submitComment(post.id)}>
                      Envoyer
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
