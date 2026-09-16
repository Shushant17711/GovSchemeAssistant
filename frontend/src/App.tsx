import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ProfileForm } from "./pages/ProfileForm";
import { Results } from "./pages/Results";
import { SchemeDetail } from "./pages/SchemeDetail";
import { Browse } from "./pages/Browse";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileForm />} />
        <Route path="/results" element={<Results />} />
        <Route path="/scheme/:id" element={<SchemeDetail />} />
        <Route path="/browse" element={<Browse />} />
      </Route>
    </Routes>
  );
}
