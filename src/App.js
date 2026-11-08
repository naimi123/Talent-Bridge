import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Stagiaire from './Stagiaire';
import Parent from './Parent';
import Formateur from './Formateur';
import Administration from './Administration';
import Entreprise from './Entreprise';
import Formulaire from './formulaire';
import './App.css';

function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Talent Bridge</h1>
      <p>Sélectionnez un espace pour commencer.</p>
      <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <Link to="/stagiaire">Stagiaire</Link>
        <Link to="/parent">Parent</Link>
        <Link to="/formateur">Formateur</Link>
        <Link to="/administration">Administration</Link>
        <Link to="/entreprise">Entreprise</Link>
        <Link to="/formulaire">Formulaire</Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stagiaire" element={<Stagiaire />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/formateur" element={<Formateur />} />
        <Route path="/administration" element={<Administration />} />
        <Route path="/entreprise" element={<Entreprise />} />
        <Route path="/formulaire" element={<Formulaire />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
