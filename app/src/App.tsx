import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Bestiary } from './pages/Bestiary';
import { CreatureDetail } from './pages/CreatureDetail';
import { CampaignDetail } from './pages/CampaignDetail';
import { Campaign } from './pages/Campaign';
import { Tools } from './pages/Tools';
import { CombatTracker } from './pages/CombatTracker';
import { Races } from './pages/Races';
import { RaceDetail } from './pages/RaceDetail';
import { Classes } from './pages/Classes';
import { ClassDetail } from './pages/ClassDetail';
import { Voies } from './pages/Voies';
import { VoieDetail } from './pages/VoieDetail';
import { Capacites } from './pages/Capacites';
import { CapaciteDetail } from './pages/CapaciteDetail';
import { Equipment } from './pages/Equipment';
import { Mounts } from './pages/Mounts';
import { Provisions } from './pages/Provisions';
import { States } from './pages/States';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bestiary" element={<Bestiary />} />
          <Route path="bestiary/:id" element={<CreatureDetail />} />
          <Route path="campaign" element={<Campaign />} />
          <Route path="campaign/:id" element={<CampaignDetail />} />
          <Route path="tools" element={<Tools />} />
          <Route path="tools/tracker" element={<CombatTracker />} />
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
          <Route path="states" element={<States />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
