import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../components/Modal/Modal";
import "./ManageClients.css";

function ManageClients({ usuario, onLogout }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      onLogout();
      navigate('/');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get("http://localhost:4000/clientes");
      setClients(response.data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      alert("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setEditFormData({
      nombre: client.nombre || '',
      telefono: client.telefono || '',
      email: client.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEditChanges = async () => {
    try {
      await axios.put(`http://localhost:4000/clientes/${selectedClient.id}`, editFormData);
      
      setIsEditModalOpen(false);
      fetchClients();
      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      alert('Error al actualizar el cliente');
    }
  };

  const deleteClient = async (clientId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await axios.delete(`http://localhost:4000/clientes/${clientId}`);
        alert('Cliente eliminado');
        fetchClients();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [clients, searchTerm]
  );

  if (loading) return <div className="loading">Cargando clientes...</div>;

  return (
    <div className="manage-clients">
      <div className="screen-header">
        <div></div>
        <p className="user-info">👤 {usuario}</p>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      <div className="header-section">
        <h1>👥 Gestión de Clientes</h1>
        <button className="btn-back" onClick={() => navigate("/")}>
          ← Volver
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="clients-container">
        {filteredClients.length === 0 ? (
          <p className="no-clients">No hay clientes para mostrar</p>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div className="client-names">
                  <h3>{client.nombre}</h3>
                </div>
              </div>

              <div className="client-details">
                <p>
                  <strong>📞 Teléfono:</strong> {client.telefono}
                </p>
                <p>
                  <strong>📧 Email:</strong> {client.email}
                </p>
              </div>

              <div className="client-actions">
                <button
                  className="btn-edit"
                  onClick={() => openEditModal(client)}
                >
                  ✏️ Editar
                </button>

                <button
                  className="btn-danger"
                  onClick={() => deleteClient(client.id)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para editar cliente */}
      <Modal 
        isOpen={isEditModalOpen} 
        title="✏️ Editar Cliente" 
        onClose={() => setIsEditModalOpen(false)}
      >
        <form>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={editFormData.nombre || ''}
              onChange={handleEditChange}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={editFormData.telefono || ''}
              onChange={handleEditChange}
              placeholder="Ej: 1123456789"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={editFormData.email || ''}
              onChange={handleEditChange}
              placeholder="Ej: cliente@ejemplo.com"
            />
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="btn-save"
              onClick={saveEditChanges}
            >
              Guardar cambios
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ManageClients;
