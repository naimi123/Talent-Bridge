import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FolderCss/Stagiaire.css';

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

  return (
    <div className="stagiaire-page">
      <div className="stagiaire-card">
        <h1 className="stagiaire-title">Espace Stagiaire</h1>
        <p className="stagiaire-subtitle">TalentBridge — Créer mon compte</p>

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
