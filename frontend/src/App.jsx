import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import Calibration from "./pages/Calibration.jsx";
import CandidateIntelligence from "./pages/CandidateIntelligence.jsx";
import ClientPortal from "./pages/ClientPortal.jsx";
import ClientRole from "./pages/ClientRole.jsx";
import CommandCenter from "./pages/CommandCenter.jsx";
import Delivery from "./pages/Delivery.jsx";
import DesignSystem from "./pages/DesignSystem.jsx";
import Integrations from "./pages/Integrations.jsx";
import Kanban from "./pages/Kanban.jsx";
import Landing from "./pages/Landing.jsx";
import Market from "./pages/Market.jsx";
import Matching from "./pages/Matching.jsx";
import Notifications from "./pages/Notifications.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import Report from "./pages/Report.jsx";
import RoleHealth from "./pages/RoleHealth.jsx";
import RoleIntake from "./pages/RoleIntake.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/intake" element={<AppShell />}>
        <Route index element={<RoleIntake />} />
      </Route>
      <Route path="/app" element={<AppShell perspective="recruiter" />}>
        <Route index element={<CommandCenter />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="pipeline/:roleId" element={<Kanban />} />
        <Route path="pipeline/:roleId/calibration" element={<Calibration />} />
        <Route path="pipeline/:roleId/matching" element={<Matching />} />
        <Route path="pipeline/:roleId/health" element={<RoleHealth />} />
        <Route path="pipeline/:roleId/market" element={<Market />} />
        <Route path="pipeline/:roleId/report" element={<Report />} />
        <Route path="candidates/:candidateId" element={<CandidateIntelligence />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="delivery" element={<Delivery />} />
      </Route>
      <Route path="/client" element={<AppShell perspective="client" />}>
        <Route index element={<ClientPortal />} />
        <Route path="roles/:roleId" element={<ClientRole />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
