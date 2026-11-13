import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CssFolder/GateScreen.css';

/**
 * GateScreen
 * - Password input at the top: typing a role name (case-insensitive) unlocks that role.
 * - Each role has its own secret access code matching its name.
 * - When a role is unlocked, its button shows an open lock, uses an unlocked style, and becomes clickable.
 */
export default function GateScreen() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Roles with their secret access codes (matching the role name) and navigation paths.
  const roles = [
    { name: 'Stagiaire', code: 'Stagiaire', path: '/register/stagiaire' },
    { name: 'Parent', code: 'Parent', path: '/register/parent' },
    { name: 'Formateur', code: 'Formateur', path: '/register/formateur' },
    { name: 'Administration', code: 'Administration', path: '/register/administration' },
    { name: 'Entreprise', code: 'Entreprise', path: '/register/entreprise' },
  ];

  // Normalize user input for case-insensitive comparison.
  const normalizedPassword = password.trim().toLowerCase();

  // Check if the entered password matches a role's secret code.
  const isRoleUnlocked = (role) => normalizedPassword === role.code.toLowerCase();

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRoleClick = (role) => {
    // Only allow navigation when this specific role is unlocked.
    if (!isRoleUnlocked(role)) return;
    navigate(role.path);
  };

  // Whether any role is currently unlocked (for helper text).
  const anyUnlocked = roles.some(isRoleUnlocked);

  return (
    <div className="gate-page">
      <div className="gate-card">
        <header className="gate-header">
          <h1 className="gate-title">TalentBridge</h1>
          <p className="gate-subtitle">OFPPT – Plateforme éducative</p>
        </header>

        {/* Password / access code field with lock icon */}
        <div className="gate-field">
          <label className="gate-label" htmlFor="accessCode">
            <span className="gate-label-icon" aria-hidden="true">🔒</span>{' '}
            Code d&apos;accès
          </label>
          <div className="gate-input-wrapper">
            <span className="gate-input-icon" aria-hidden="true">🔒</span>
            <input
              id="accessCode"
              className="gate-input gate-input-with-icon"
              type="password"
              placeholder="Entrez le code du rôle (ex. Stagiaire, Formateur...)"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="off"
            />
          </div>
          <p className="gate-hint">
            {anyUnlocked
              ? 'Accès accordé : vous pouvez cliquer sur le rôle déverrouillé.'
              : 'Saisissez le nom du rôle pour le déverrouiller (insensible à la casse).'}
          </p>
        </div>

        {/* Role buttons: each unlocks only when its own code matches */}
        <div className="gate-roles">
          <h2>Choisissez votre rôle</h2>

          {roles.map((role) => {
            const unlocked = isRoleUnlocked(role);

            return (
              <button
                key={role.name}
                type="button"
                className={[
                  'role-card',
                  unlocked ? 'unlocked' : 'locked',
                ].join(' ')}
                onClick={() => handleRoleClick(role)}
                disabled={!unlocked}
                aria-label={`${role.name} ${unlocked ? 'déverrouillé' : 'verrouillé'}`}
              >
                <span className="role-left">
                  <span className="role-lock-icon" aria-hidden="true">
                    {unlocked ? '🔓' : '🔒'}
                  </span>
                  <span className="role-name">{role.name}</span>
                </span>
                <span className="role-arrow" aria-hidden="true">&gt;</span>
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
