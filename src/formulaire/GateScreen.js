import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CssFolder/GateScreen.css';

export default function GateScreen() {
  // État pour le code du centre
  const [centreCode, setCentreCode] = useState('');
  // État pour le rôle choisi (optionnel, simple)
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  // Code du centre requis (comportement actuel du projet)
  const isCodeEntered = centreCode.trim() === 'znata';

  const roles = [
    'Stagiaire',
    'Parent',
    'Formateur',
    'Administration',
    'Entreprise',
  ];

  function handleCodeChange(event) {
    setCentreCode(event.target.value);
  }

  function handleRoleClick(role) {
    // Déclencher uniquement si le code du centre est entré/valide
    if (!isCodeEntered) return;

    setSelectedRole(role);

    // Redirection vers le formulaire d'inscription Stagiaire
    if (role === 'Stagiaire' || role === 'Stagiraire') {
      navigate('/register/stagiaire');
    }
  }

  return (
    <div className="gate-page">
      <div className="gate-card">
        <header className="gate-header">
          <h1 className="gate-title">TalentBridge</h1>
          <p className="gate-subtitle">OFPPT • Plateforme éducative</p>
        </header>

        <div className="gate-field">
          <label className="gate-label" htmlFor="centreCode">
            Code du Centre
          </label>
          <input
            id="centreCode"
            className="gate-input"
            type="text"
            placeholder="ex. CASA-ISTA-2026"
            value={centreCode}
            onChange={handleCodeChange}
          />
          <p className="gate-hint">
            {isCodeEntered
              ? 'Vous pouvez maintenant choisir votre rôle.'
              : 'Saisissez le code du centre pour activer les rôles.'}
          </p>
        </div>

        <div className="gate-roles">
          <h2>Choisissez votre rôle</h2>

          {roles.map(function (role) {
            return (
              <button
                key={role}
                type="button"
                className={
                  'role-card' +
                  (!isCodeEntered ? ' disabled' : '') +
                  (selectedRole === role ? ' selected' : '')
                }
                onClick={function () {
                  handleRoleClick(role);
                }}
                
              >
                <span>{role}</span>
                <span aria-hidden="true">&gt;</span>
              </button>
            );
          })}
        </div>

        <footer className="gate-footer">
          Déjà inscrit ? <a href="#connexion">Se connecter</a>
        </footer>
      </div>
    </div>
  );
}
