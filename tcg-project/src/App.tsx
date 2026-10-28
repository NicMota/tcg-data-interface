import { FavoritesProvider } from "./context/FavoritesContext";
import { Favorites } from "./pages/Favorites";
import { Profile } from "./pages/Profile";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import Home from "./pages/Home";
import { Charts } from "./pages/Charts";
import { CardInfo } from "./pages/CardInfo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import { Admin } from "./pages/adm/Admin";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { Insights } from "./pages/Insights";
import { Inventory } from "./pages/adm/Inventory";
import { AdminRoute } from "./components/AdminRoute";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/insights" element={<Insights />} />
                <Route
                  path="/inventory"
                  element={
                    <AdminRoute>
                      <Inventory />
                    </AdminRoute>
                  }
                />
                <Route path="/cards" element={<Home />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/card/:card_id" element={<CardInfo />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route
                path="*"
                element={
                  <main className="app-page">
                    <h1>404</h1>
                    <Link to="/">Magic TCG Tracker</Link>
                  </main>
                }
              />
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
