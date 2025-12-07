import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Bestiary } from './pages/Bestiary';
import { CreatureDetail } from './pages/CreatureDetail';
import { CampaignDetail } from './pages/CampaignDetail';
import { Campaign } from './pages/Campaign';
import { Tools } from './pages/Tools';
import { CombatTracker } from './pages/CombatTracker';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
