import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import "./Dashboard.css";

function Dashboard({ usuario, onLogout }) {
  const [users, setUsers] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [summary, setSummary] = useState({
    totalUsers: 0,
    repairsInProcess: 0,
    repairsCompleted: 0,
    repairsCancelled: 0,
    totalIncome: 0,
  });

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      onLogout();
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, repairsRes] = await Promise.all([
          axios.get("http://localhost:4000/clientes"),
          axios.get("http://localhost:4000/reparaciones"),
        ]);

        const usersData = usersRes.data;
        const repairsData = repairsRes.data;

        setUsers(usersData);
        setRepairs(repairsData);

        // Calcular estadísticas
        const inProcess = repairsData.filter(
          (r) => r.servicio?.estado === "en proceso"
        ).length;
        const completed = repairsData.filter(
          (r) => r.servicio?.estado === "lista"
        ).length;
        const cancelled = repairsData.filter(
          (r) => r.servicio?.estado === "cancelada"
        ).length;
        const totalIncome = repairsData.reduce(
          (sum, r) => sum + (r.servicio?.deposito || 0),
          0
        );

        setSummary({
          totalUsers: usersData.length,
          repairsInProcess: inProcess,
          repairsCompleted: completed,
          repairsCancelled: cancelled,
          totalIncome: totalIncome,
        });
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="loading">Cargando dashboard...</div>;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Zona-G</h2>
        <ul>
          <li>🏠 Inicio</li>
          <li onClick={() => navigate("/adduser")}>👥 Usuarios</li>
          <li onClick={() => navigate("/manageclients")}>📋 Gestionar Clientes</li>
          <li onClick={() => navigate("/addrepair")}>📦 Nueva Reparación</li>
          <li onClick={() => navigate("/managerepairs")}>⚙️ Administrar Reparaciones</li>
        </ul>
        <div className="sidebar-footer">
          <p className="user-info">👤 {usuario}</p>
          <button className="btn-theme" onClick={toggleTheme} title="Cambiar tema">
            {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <h1>Panel de Control</h1>
          <div className="user-info">👤 Admin</div>
        </header>

        {/* Cards con estadísticas reales */}
        <section className="cards">
          <div className="card card-users">
            <h3>👥 Usuarios</h3>
            <p className="big-number">{summary.totalUsers}</p>
            <span className="card-label">Clientes registrados</span>
          </div>
          <div className="card card-in-process">
            <h3>⏳ En Proceso</h3>
            <p className="big-number">{summary.repairsInProcess}</p>
            <span className="card-label">Reparaciones activas</span>
          </div>
          <div className="card card-completed">
            <h3>✅ Completadas</h3>
            <p className="big-number">{summary.repairsCompleted}</p>
            <span className="card-label">Reparaciones listas</span>
          </div>
          <div className="card card-cancelled">
            <h3>❌ Canceladas</h3>
            <p className="big-number">{summary.repairsCancelled}</p>
            <span className="card-label">Reparaciones canceladas</span>
          </div>
          <div className="card card-income">
            <h3>💰 Ingresos</h3>
            <p className="big-number">${summary.totalIncome.toLocaleString()}</p>
            <span className="card-label">Total en depósitos</span>
          </div>
        </section>

        {/* Acciones Rápidas */}
        <section className="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div className="actions-grid">
            <button
              className="action-btn btn-add-user"
              onClick={() => navigate("/adduser")}
            >
              ➕ Agregar Cliente
            </button>
            <button
              className="action-btn btn-add-repair"
              onClick={() => navigate("/addrepair")}
            >
              📦 Nueva Reparación
            </button>
            <button
              className="action-btn btn-manage"
              onClick={() => navigate("/managerepairs")}
            >
              ⚙️ Gestionar Reparaciones
            </button>
            <button
              className="action-btn btn-export"
              onClick={() => alert("Exportar reporte (próximamente)")}
            >
              📊 Exportar Reporte
            </button>
          </div>
        </section>

        {/* Resumen por estado */}
        <section className="status-summary">
          <h2>Resumen de Estados</h2>
          <div className="status-grid">
            <div className="status-card status-in-process">
              <h4>En Proceso</h4>
              <div className="status-bar">
                <div className="status-fill in-process"></div>
              </div>
              <p>{summary.repairsInProcess} reparaciones</p>
            </div>
            <div className="status-card status-completed">
              <h4>Completadas</h4>
              <div className="status-bar">
                <div className="status-fill completed"></div>
              </div>
              <p>{summary.repairsCompleted} reparaciones</p>
            </div>
            <div className="status-card status-cancelled">
              <h4>Canceladas</h4>
              <div className="status-bar">
                <div className="status-fill cancelled"></div>
              </div>
              <p>{summary.repairsCancelled} reparaciones</p>
            </div>
          </div>
        </section>

        {/* Tabla con últimas reparaciones */}
        <section className="table-section">
          <h2>Últimas Reparaciones</h2>
          {repairs.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Dispositivo</th>
                  <th>Estado</th>
                  <th>Depósito</th>
                  <th>Fecha Estimada</th>
                </tr>
              </thead>
              <tbody>
                {repairs.slice(0, 8).map((repair) => (
                  <tr key={repair.id}>
                    <td>{repair.cliente?.nombre}</td>
                    <td>
                      {repair.dispositivo?.marca} {repair.dispositivo?.modelo}
                    </td>
                    <td>
                      <span className={`status-badge ${repair.servicio?.estado}`}>
                        {repair.servicio?.estado?.toUpperCase()}
                      </span>
                    </td>
                    <td>${repair.servicio?.deposito || 0}</td>
                    <td>
                      {repair.servicio?.fechaEntregaEstimada
                        ? new Date(
                            repair.servicio.fechaEntregaEstimada
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No hay reparaciones registradas</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
