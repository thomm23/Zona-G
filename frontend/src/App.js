import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./screens/Login/Login";
import Dashboard from "./screens/Dashboard/Dashboard";
import AddUser from "./screens/AddUser/AddUser";
import AddRepair from "./screens/AddRepair/AddRepair";
import ManageRepairs from "./screens/ManageRepairs/ManageRepairs";
import ManageClients from "./screens/ManageClients/ManageClients";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token guardado
    const savedToken = localStorage.getItem("token");
    const savedUsuario = localStorage.getItem("usuario");
    const rememberMe = localStorage.getItem("rememberMe");

    // Solo restaurar sesión si fue marcado "Mantener sesión" (localStorage)
    if (savedToken && rememberMe === "true") {
      setToken(savedToken);
      setUsuario(savedUsuario);
      
      // Agregar token al header de axios por defecto
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (newToken, newUsuario) => {
    setToken(newToken);
    setUsuario(newUsuario);
    
    // Agregar token al header de axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rememberMe");
    delete axios.defaults.headers.common["Authorization"];
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Si no hay token, mostrar login
  if (!token) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // Si hay token, mostrar aplicación
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard usuario={usuario} onLogout={handleLogout} />} />
          <Route path="/adduser" element={<AddUser usuario={usuario} onLogout={handleLogout} />} />
          <Route path="/addrepair" element={<AddRepair usuario={usuario} onLogout={handleLogout} />} />
          <Route path="/managerepairs" element={<ManageRepairs usuario={usuario} onLogout={handleLogout} />} />
          <Route path="/manageclients" element={<ManageClients usuario={usuario} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
