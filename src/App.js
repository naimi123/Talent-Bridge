import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import GateScreen from './Formulaire/GateScreen';
import Stagire from './Stagiaire/Stagire';
import StagiaireHomeScreen from './Stagiaire/StagiaireHomeScreen';
import AIHandControl from './components/AIHandControl';

export default function App() {
  return (
    <BrowserRouter>
      {/* Global AI hand-gesture remote control overlay (webcam + virtual cursor) */}
      <AIHandControl />
      <Routes>
        <Route path="/" element={<GateScreen />} />
        <Route path="/register/stagiaire" element={<Stagire />} />
        <Route path="/stagiaire/dashboard" element={<StagiaireHomeScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
