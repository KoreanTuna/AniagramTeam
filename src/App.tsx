import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { bgStyle, C } from "./data/design";
import { PixelAnimal } from "./components/PixelAnimal";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Start } from "./pages/Start";
import { About } from "./pages/About";
import { RoleSelect } from "./pages/RoleSelect";
import { Quiz } from "./pages/Quiz";
import { Result } from "./pages/Result";
import { TeamCreate } from "./pages/TeamCreate";
import { JoinByLink } from "./pages/JoinByLink";
import { TeamDashboard } from "./pages/TeamDashboard";
import { MyTeams } from "./pages/MyTeams";

function LoadingScreen() {
  return (
    <div style={bgStyle} className="flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-3 inline-block">
          <PixelAnimal type={7} size={64} />
        </div>
        <div
          className="text-[10px] tracking-[0.18em] font-bold"
          style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
        >
          LOADING...
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/about" element={<About />} />
        <Route path="/role" element={<RoleSelect />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="/team/create" element={<TeamCreate />} />
        <Route path="/team/:code" element={<TeamDashboard />} />
        <Route path="/my-teams" element={<MyTeams />} />
        <Route path="/join/:code" element={<JoinByLink />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
