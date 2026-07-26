import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Loader } from './components/common';

// Pages publiques (entrée / auth) : chargées d'emblée, légères et affichées en premier.
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Pages protégées : code-splitting (React.lazy) → un chunk par page, chargé à la demande.
// Les exports nommés sont remappés en `default` (contrat attendu par React.lazy).
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Bestiary = lazy(() => import('./pages/Bestiary').then(m => ({ default: m.Bestiary })));
const CreatureDetail = lazy(() => import('./pages/CreatureDetail').then(m => ({ default: m.CreatureDetail })));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail').then(m => ({ default: m.CampaignDetail })));
const Campaign = lazy(() => import('./pages/Campaign').then(m => ({ default: m.Campaign })));
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })));
const CombatTracker = lazy(() => import('./pages/CombatTracker').then(m => ({ default: m.CombatTracker })));
const CustomMonsters = lazy(() => import('./pages/CustomMonsters').then(m => ({ default: m.CustomMonsters })));
const Races = lazy(() => import('./pages/Races').then(m => ({ default: m.Races })));
const RaceDetail = lazy(() => import('./pages/RaceDetail').then(m => ({ default: m.RaceDetail })));
const Classes = lazy(() => import('./pages/Classes').then(m => ({ default: m.Classes })));
const ClassDetail = lazy(() => import('./pages/ClassDetail'));
const Voies = lazy(() => import('./pages/Voies').then(m => ({ default: m.Voies })));
const VoieDetail = lazy(() => import('./pages/VoieDetail').then(m => ({ default: m.VoieDetail })));
const Capacites = lazy(() => import('./pages/Capacites').then(m => ({ default: m.Capacites })));
const CapaciteDetail = lazy(() => import('./pages/CapaciteDetail').then(m => ({ default: m.CapaciteDetail })));
const Equipment = lazy(() => import('./pages/Equipment').then(m => ({ default: m.Equipment })));
const Mounts = lazy(() => import('./pages/Mounts').then(m => ({ default: m.Mounts })));
const Provisions = lazy(() => import('./pages/Provisions').then(m => ({ default: m.Provisions })));
const Dice = lazy(() => import('./pages/Dice').then(m => ({ default: m.Dice })));
const States = lazy(() => import('./pages/States').then(m => ({ default: m.States })));
const Poisons = lazy(() => import('./pages/Poisons').then(m => ({ default: m.Poisons })));
const Traps = lazy(() => import('./pages/Traps').then(m => ({ default: m.Traps })));
const Rules = lazy(() => import('./pages/Rules').then(m => ({ default: m.Rules })));
const Bibliotheque = lazy(() => import('./pages/Bibliotheque').then(m => ({ default: m.Bibliotheque })));
const SoundboardPage = lazy(() => import('./pages/SoundboardPage').then(m => ({ default: m.SoundboardPage })));
const MagicItems = lazy(() => import('./pages/MagicItems').then(m => ({ default: m.MagicItems })));
const CharacterList = lazy(() => import('./pages/CharacterList').then(m => ({ default: m.CharacterList })));
const CharacterSheet = lazy(() => import('./pages/CharacterSheet').then(m => ({ default: m.CharacterSheet })));
const PrintableCharacterSheet = lazy(() => import('./pages/PrintableCharacterSheet').then(m => ({ default: m.PrintableCharacterSheet })));
const PlayMode = lazy(() => import('./pages/PlayMode/PlayMode').then(m => ({ default: m.PlayMode })));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Vue d'impression : protégée mais hors Layout (pas de sidebar) */}
              <Route path="/characters/:id/print" element={<PrintableCharacterSheet />} />
              {/* Mode session joueur : plein écran mobile, hors Layout */}
              <Route path="/play/:id" element={<PlayMode />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="bestiary" element={<Bestiary />} />
                <Route path="bestiary/:id" element={<CreatureDetail />} />
                <Route path="campaign" element={<Campaign />} />
                <Route path="campaign/:id" element={<CampaignDetail />} />
                <Route path="tools" element={<Tools />} />
                <Route path="tools/tracker" element={<CombatTracker />} />
                <Route path="tools/monsters" element={<CustomMonsters />} />
                <Route path="tools/soundboard" element={<SoundboardPage />} />
                <Route path="tools/magic-items" element={<MagicItems />} />
                <Route path="races" element={<Races />} />
                <Route path="races/:id" element={<RaceDetail />} />
                <Route path="classes" element={<Classes />} />
                <Route path="classes/:id" element={<ClassDetail />} />
                <Route path="voies" element={<Voies />} />
                <Route path="voies/:id" element={<VoieDetail />} />
                <Route path="capacites" element={<Capacites />} />
                <Route path="capacites/:id" element={<CapaciteDetail />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="mounts" element={<Mounts />} />
                <Route path="provisions" element={<Provisions />} />
                <Route path="tools/dice" element={<Dice />} />
                <Route path="states" element={<States />} />
                <Route path="poisons" element={<Poisons />} />
                <Route path="traps" element={<Traps />} />
                <Route path="rules" element={<Rules />} />
                <Route path="bibliotheque" element={<Bibliotheque />} />
                <Route path="characters" element={<CharacterList />} />
                <Route path="characters/new" element={<CharacterSheet />} />
                <Route path="characters/:id" element={<CharacterSheet />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
