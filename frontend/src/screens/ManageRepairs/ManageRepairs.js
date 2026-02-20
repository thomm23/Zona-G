import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../components/Modal/Modal";
import "./ManageRepairs.css";

function ManageRepairs({ usuario, onLogout }) {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      onLogout();
      navigate('/');
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const response = await axios.get("http://localhost:4000/reparaciones");
      setRepairs(response.data);
    } catch (error) {
      console.error("Error al obtener reparaciones:", error);
      alert("Error al cargar las reparaciones");
    } finally {
      setLoading(false);
    }
  };

  const updateRepairStatus = async (repairId, newStatus) => {
    // Actualizar estado local inmediatamente para mejor UX
    const updatedRepairs = repairs.map((repair) =>
      repair.id === repairId
        ? { ...repair, servicio: { ...repair.servicio, estado: newStatus } }
        : repair
    );
    setRepairs(updatedRepairs);

    // Sincronizar con servidor en background
    try {
      await axios.put(`http://localhost:4000/reparaciones/${repairId}`, {
        estado: newStatus,
      });
    } catch (error) {
      console.error("Error al actualizar reparación:", error);
      // Revertir cambio local si falla
      fetchRepairs();
      alert("Error al actualizar la reparación");
    }
  };

  const deleteRepair = async (repairId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta reparación?")) {
      try {
        await axios.delete(`http://localhost:4000/reparaciones/${repairId}`);
        alert("Reparación eliminada");
        fetchRepairs();
      } catch (error) {
        console.error("Error al eliminar reparación:", error);
        alert("Error al eliminar la reparación");
      }
    }
  };

  const sendWhatsAppMessage = async (clienteName, clientePhone, repairStatus) => {
    try {
      // Paso 1: Enviar datos seguramente al backend (POST)
      const response = await axios.post("http://localhost:4000/reparaciones/send-whatsapp-message", {
        phone: clientePhone,
        clienteName: clienteName,
        repairStatus: repairStatus
      });

      if (response.data.success && response.data.redirectUrl) {
        // Paso 2: Redirigir usando el token (URL corta sin datos sensibles)
        window.location.href = `http://localhost:4000${response.data.redirectUrl}`;
      }
    } catch (error) {
      console.error("Error al enviar mensaje por WhatsApp:", error);
      alert("Error al enviar el mensaje. Verifica los datos del cliente.");
    }
  };

  const openEditModal = (repair) => {
    setSelectedRepair(repair);
    setEditFormData({
      dispositivo: repair.dispositivo?.marca || '',
      modelo: repair.dispositivo?.modelo || '',
      falla: repair.servicio?.falla || '',
      presupuesto: repair.servicio?.presupuesto || '',
      deposito: repair.servicio?.deposito || '',
      estado: repair.servicio?.estado || 'en proceso'
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
      await axios.put(`http://localhost:4000/reparaciones/${selectedRepair.id}`, {
        dispositivo: {
          marca: editFormData.dispositivo,
          modelo: editFormData.modelo
        },
        servicio: {
          falla: editFormData.falla,
          presupuesto: parseFloat(editFormData.presupuesto),
          deposito: parseFloat(editFormData.deposito),
          estado: editFormData.estado,
          fechaEntregaEstimada: selectedRepair.servicio?.fechaEntregaEstimada
        }
      });
      
      setIsEditModalOpen(false);
      fetchRepairs();
      alert('Reparación actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar reparación:', error);
      alert('Error al actualizar la reparación');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "en proceso":
        return "#FFA500";
      case "lista":
        return "#4CAF50";
      case "cancelada":
        return "#f44336";
      default:
        return "#888";
    }
  };

  const filteredRepairs =
    filterStatus === "todos"
      ? repairs
      : repairs.filter((r) => r.servicio?.estado === filterStatus);

  if (loading) return <div className="loading">Cargando reparaciones...</div>;

  return (
    <div className="manage-repairs">
      <div className="screen-header">
        <div></div>
        <p className="user-info">👤 {usuario}</p>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </div>
      <div className="header-section">
        <h1>📱 Administración de Reparaciones</h1>
        <button className="btn-back" onClick={() => navigate("/")}>
          ← Volver
        </button>
      </div>

      <div className="filters">
        <button
          className={filterStatus === "todos" ? "active" : ""}
          onClick={() => setFilterStatus("todos")}
        >
          Todas ({repairs.length})
        </button>
        <button
          className={filterStatus === "en proceso" ? "active" : ""}
          onClick={() => setFilterStatus("en proceso")}
        >
          En proceso ({repairs.filter((r) => r.servicio?.estado === "en proceso").length})
        </button>
        <button
          className={filterStatus === "lista" ? "active" : ""}
          onClick={() => setFilterStatus("lista")}
        >
          Listas ({repairs.filter((r) => r.servicio?.estado === "lista").length})
        </button>
        <button
          className={filterStatus === "cancelada" ? "active" : ""}
          onClick={() => setFilterStatus("cancelada")}
        >
          Canceladas ({repairs.filter((r) => r.servicio?.estado === "cancelada").length})
        </button>
      </div>

      <div className="repairs-container">
        {filteredRepairs.length === 0 ? (
          <p className="no-repairs">No hay reparaciones con este estado</p>
        ) : (
          filteredRepairs.map((repair) => (
            <div key={repair.id} className="repair-card">
              <div className="repair-header">
                <div className="repair-info">
                  <h3>{repair.cliente?.nombre || "Cliente desconocido"}</h3>
                  <p className="device-info">
                    {repair.dispositivo?.marca} {repair.dispositivo?.modelo}
                  </p>
                </div>
                <div
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(repair.servicio?.estado) }}
                >
                  {repair.servicio?.estado?.toUpperCase()}
                </div>
              </div>

              <div className="repair-details">
                <p>
                  <strong>Falla:</strong> {repair.servicio?.falla}
                </p>
                <p>
                  <strong>Presupuesto:</strong> ${repair.servicio?.presupuesto || "N/A"}
                </p>
                <p>
                  <strong>Depósito:</strong> ${repair.servicio?.deposito || 0}
                </p>
                <p>
                  <strong>Fecha estimada:</strong>{" "}
                  {new Date(repair.servicio?.fechaEntregaEstimada).toLocaleDateString() || "N/A"}
                </p>
                <p>
                  <strong>Teléfono:</strong> {repair.cliente?.telefono}
                </p>
              </div>

              <div className="repair-actions">
                <select
                  className="status-select"
                  value={repair.servicio?.estado || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      updateRepairStatus(repair.id, e.target.value);
                    }
                  }}
                >
                  <option value="">-- Cambiar estado --</option>
                  <option value="en proceso">En proceso</option>
                  <option value="lista">Lista</option>
                  <option value="cancelada">Cancelada</option>
                </select>

                <button
                  className="btn-edit"
                  onClick={() => openEditModal(repair)}
                >
                  ✏️ Editar
                </button>

                {repair.servicio?.estado === "lista" && (
                  <button
                    className="btn-whatsapp"
                    onClick={() =>
                      sendWhatsAppMessage(
                        repair.cliente?.nombre,
                        repair.cliente?.telefono,
                        "lista"
                      )
                    }
                  >
                    💬 WhatsApp
                  </button>
                )}

                <button
                  className="btn-danger"
                  onClick={() => deleteRepair(repair.id)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para editar reparación */}
      <Modal 
        isOpen={isEditModalOpen} 
        title="✏️ Editar Reparación" 
        onClose={() => setIsEditModalOpen(false)}
      >
        <form>
          <div className="form-group">
            <label>Marca del dispositivo</label>
            <input
              type="text"
              name="dispositivo"
              value={editFormData.dispositivo || ''}
              onChange={handleEditChange}
              placeholder="Ej: Samsung"
            />
          </div>

          <div className="form-group">
            <label>Modelo</label>
            <input
              type="text"
              name="modelo"
              value={editFormData.modelo || ''}
              onChange={handleEditChange}
              placeholder="Ej: S21"
            />
          </div>

          <div className="form-group">
            <label>Falla reportada</label>
            <textarea
              name="falla"
              value={editFormData.falla || ''}
              onChange={handleEditChange}
              placeholder="Describe la falla..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Presupuesto ($)</label>
            <input
              type="number"
              name="presupuesto"
              value={editFormData.presupuesto || ''}
              onChange={handleEditChange}
              placeholder="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Depósito ($)</label>
            <input
              type="number"
              name="deposito"
              value={editFormData.deposito || ''}
              onChange={handleEditChange}
              placeholder="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              name="estado"
              value={editFormData.estado || 'en proceso'}
              onChange={handleEditChange}
            >
              <option value="en proceso">En proceso</option>
              <option value="lista">Lista</option>
              <option value="cancelada">Cancelada</option>
            </select>
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

export default ManageRepairs;
