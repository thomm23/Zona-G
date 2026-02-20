import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ClientSelector.css";

export default function ClientSelector({ onSelect }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:4000/clientes");
        if (!mounted) return;
        setClients(res.data || []);
        
        // Cargar clientes recientes del localStorage
        const stored = localStorage.getItem("recentClients");
        const recent = stored ? JSON.parse(stored) : [];
        setRecentClients(recent);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Filtrar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients([]);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = clients.filter((c) => {
      const nombre = (c.nombre || "").toLowerCase();
      const telefono = (c.telefono || "").toLowerCase();
      const dni = (c.dni || "").toLowerCase();
      return nombre.includes(term) || telefono.includes(term) || dni.includes(term);
    });
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleSelectClient = (client) => {
    // Guardar en clientes recientes
    const id = client._id || client.id || client.insertId || "";
    const stored = localStorage.getItem("recentClients");
    let recent = stored ? JSON.parse(stored) : [];
    
    // Remover si ya existe y agregar al inicio
    recent = recent.filter((c) => (c._id || c.id) !== id);
    recent.unshift(client);
    
    // Guardar solo últimos 10
    recent = recent.slice(0, 10);
    localStorage.setItem("recentClients", JSON.stringify(recent));
    
    if (onSelect) onSelect(client);
    setSearchTerm("");
  };

  const getRecentClientsDisplay = () => {
    return recentClients.map((c) => {
      const id = c._id || c.id || c.insertId || "";
      return (
        <button
          key={id}
          type="button"
          className="recent-client-btn"
          onClick={() => handleSelectClient(c)}
          title={`${c.nombre || ""} - ${c.telefono || ""}`}
        >
          <strong>{c.nombre || "Sin nombre"}</strong>
          <small>{c.telefono || ""}</small>
        </button>
      );
    });
  };

  if (loading) return <div className="client-selector">Cargando clientes...</div>;

  return (
    <div className="client-selector">
      <h3>Seleccionar cliente</h3>
      
      {recentClients.length > 0 && (
        <div className="recent-section">
          <label className="section-label">Clientes recientes</label>
          <div className="recent-clients">
            {getRecentClientsDisplay()}
          </div>
        </div>
      )}

      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {searchTerm && (
        <div className="search-results">
          {filteredClients.length > 0 ? (
            <div className="clients-list">
              {filteredClients.map((c) => {
                const id = c._id || c.id || c.insertId || "";
                return (
                  <button
                    key={id}
                    type="button"
                    className="client-item"
                    onClick={() => handleSelectClient(c)}
                  >
                    <div className="client-name">{c.nombre || "Sin nombre"}</div>
                    <div className="client-details">
                      {c.telefono && <span>{c.telefono}</span>}
                      {c.dni && <span>{c.dni}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="no-results">No se encontraron clientes</div>
          )}
        </div>
      )}
    </div>
  );
}
