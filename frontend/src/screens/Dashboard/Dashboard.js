import React, { useEffect, useState, useMemo } from "react";
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
  const summary = useMemo(() => {
    let inProcess = 0;
    let completed = 0;
    let cancelled = 0;
    let totalIncome = 0;
    let currentMonthIncome = 0;
    let lastMonthIncome = 0;
    let totalPresupuesto = 0;
    let thisWeekCount = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    for (const r of repairs) {
      const estado = r.servicio?.estado;
      const deposito = r.servicio?.deposito || 0;
      const presupuesto = r.servicio?.presupuesto || 0;
      
      if (estado === "en proceso") inProcess++;
      else if (estado === "lista") completed++;
      else if (estado === "cancelada") cancelled++;
      
      totalIncome += deposito;
      totalPresupuesto += presupuesto;
      
      const repairDate = new Date(r.fechaCreacion || r.createdAt || Date.now());
      const repairMonth = repairDate.getMonth();
      const repairYear = repairDate.getFullYear();
      
      if (repairMonth === currentMonth && repairYear === currentYear) {
        currentMonthIncome += deposito;
      }
      if (repairMonth === currentMonth - 1 && repairYear === currentYear) {
        lastMonthIncome += deposito;
      }
      if (repairMonth === currentMonth - 1 && repairYear === currentYear - 1 && currentMonth === 0) {
        lastMonthIncome += deposito;
      }
      
      if (new Date(r.fechaCreacion || r.createdAt) >= startOfWeek) {
        thisWeekCount++;
      }
    }
    
    const totalRepairs = completed + cancelled;
    const successRate = totalRepairs > 0 ? Math.round((completed / totalRepairs) * 100) : 0;
    const avgPerRepair = completed > 0 ? Math.round(totalIncome / completed) : 0;
    const monthChange = lastMonthIncome > 0 
      ? Math.round(((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
      : currentMonthIncome > 0 ? 100 : 0;
    
    return {
      totalUsers: users.length,
      repairsInProcess: inProcess,
      repairsCompleted: completed,
      repairsCancelled: cancelled,
      totalIncome: totalIncome,
      currentMonthIncome,
      lastMonthIncome,
      monthChange,
      successRate,
      avgPerRepair,
      thisWeekCount,
      totalPresupuesto,
    };
  }, [users, repairs]);

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
            <div className="card-icon">👥</div>
            <h3>Clientes</h3>
            <p className="big-number">{summary.totalUsers}</p>
            <span className="card-label">Registrados</span>
          </div>
          <div className="card card-in-process">
            <div className="card-icon">⏳</div>
            <h3>En Proceso</h3>
            <p className="big-number">{summary.repairsInProcess}</p>
            <span className="card-label">Reparaciones activas</span>
          </div>
          <div className="card card-completed">
            <div className="card-icon">✅</div>
            <h3>Completadas</h3>
            <p className="big-number">{summary.repairsCompleted}</p>
            <span className="card-label">{summary.thisWeekCount} esta semana</span>
          </div>
          <div className="card card-income">
            <div className="card-icon">💰</div>
            <h3>Ingresos Totales</h3>
            <p className="big-number">${summary.totalIncome.toLocaleString()}</p>
            <span className="card-label">Depósitos acumulados</span>
          </div>
        </section>

        {/* Sección de Ganancias */}
        <section className="stats-grid">
          <div className="stat-card income-card">
            <div className="stat-header">
              <span className="stat-icon">📈</span>
              <h4>Este Mes</h4>
            </div>
            <p className="stat-value">${summary.currentMonthIncome.toLocaleString()}</p>
            <span className={`stat-change ${summary.monthChange >= 0 ? 'positive' : 'negative'}`}>
              {summary.monthChange >= 0 ? '↑' : '↓'} {Math.abs(summary.monthChange)}% vs mes anterior
            </span>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">📊</span>
              <h4>Promedio</h4>
            </div>
            <p className="stat-value">${summary.avgPerRepair.toLocaleString()}</p>
            <span className="card-label">Por reparación completada</span>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">🎯</span>
              <h4>Tasa de Éxito</h4>
            </div>
            <p className="stat-value">{summary.successRate}%</p>
            <span className="card-label">{summary.repairsCompleted} de {summary.repairsCompleted + summary.repairsCancelled}</span>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">💵</span>
              <h4>Presupuesto Total</h4>
            </div>
            <p className="stat-value">${summary.totalPresupuesto.toLocaleString()}</p>
            <span className="card-label">En reparaciones</span>
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
