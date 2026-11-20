import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import GateScreen from './formulaire/GateScreen';
import Stagire from './Stagiaire/Stagire';
import StagiaireLayout from './Stagiaire/StagiaireLayout';
import StagiaireHomeScreen from './Stagiaire/StagiaireHomeScreen';
import StagiaireCheckin from './Stagiaire/StagiaireCheckin';
import TalentHubScreen from './Stagiaire/TalentHubScreen';
import SkillMatchScreen from './Stagiaire/SkillMatchScreen';
import LeaderboardScreen from './Stagiaire/LeaderboardScreen';
import CommunityScreen from './Stagiaire/CommunityScreen';
import AIHandControl from './components/AIHandControl';


export default function App() {
  return (
    <BrowserRouter>
      {/* Global AI hand-gesture remote control overlay (webcam + virtual cursor) */}
      <AIHandControl />
      <Routes>
        <Route path="/" element={<GateScreen />} />
        <Route path="/register/stagiaire" element={<Stagire />} />

        <Route path="/stagiaire/dashboard" element={<StagiaireLayout />}>
          <Route index element={<StagiaireHomeScreen />} />
          <Route path="checkin" element={<StagiaireCheckin />} />
          <Route path="talent-hub" element={<TalentHubScreen />} />
          <Route path="skill-match" element={<SkillMatchScreen />} />
          <Route path="leaderboard" element={<LeaderboardScreen />} />
        </Route>

        <Route path="/stagiaire/community" element={<StagiaireLayout />}>
          <Route index element={<CommunityScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
