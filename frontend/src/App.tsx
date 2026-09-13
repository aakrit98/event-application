import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FooterPage from "./pages/FooterPage";
import NavbarPage from "./pages/NavbarPage";
import EventFormPage from "./pages/EventFormPage"; 
import EventDetailPage from "./pages/EventDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import EventListPage from "./pages/EventListPage";
function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    > 
      <NavbarPage />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
           <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />

      {/* Protected routes — must be logged in */}
      <Route element={<ProtectedRoute />}>
        <Route path="/my-events" element={<EventListPage />} />
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/edit/:id" element={<EventFormPage />} />
      </Route>
    </Routes>
      </div>
      <FooterPage />
    </div>
  );
}

export default App;