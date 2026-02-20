import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "./AddRepair.css";
import useClient from "../../hooks/useClient";
import ClientSelector from "../../components/ClientSelector/ClientSelector";
import PatternDrawer from "../../components/PatternDrawer/PatternDrawer";

export default function AddRepair({ usuario, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const clientId = params.get("clientId");
  const [selectedClient, setSelectedClient] = useState(location.state?.client || null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { client: clientData, loading: loadingClient } = useClient(clientId, selectedClient);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      onLogout();
      navigate('/');
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  const encryptPassword = (password) => {
    return btoa(password);
  };

  const formik = useFormik({
    initialValues: {
      marca: "",
      modelo: "",
      imei: "",
      accesorios: "",
      patron: "",
      falla: "",
      presupuesto: "",
      deposito: "",
      recibidoPor: "Leonel",
      estado: "en proceso",
      fechaEntregaEstimada: "",
      tieneContrasena: false,
      contrasena: "",
      observaciones: "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      marca: Yup.string().required("La marca es obligatoria"),
      modelo: Yup.string().required("El modelo es obligatorio"),
      falla: Yup.string().required("Describa la falla"),
      presupuesto: Yup.number().typeError("Ingrese un número válido").nullable(),
      deposito: Yup.string()
        .matches(/^[0-9]*$/, "Solo números")
        .nullable(),
      contrasena: Yup.string().when("tieneContrasena", (tieneContrasena, schema) => {
        return tieneContrasena ? schema.required("Ingrese la contraseña") : schema;
      }),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      // Evitar múltiples envíos
      if (isProcessing) return;
      
      setIsProcessing(true);
      setSubmitting(true);
      setAlertMessage("");
      console.log("🔵 Formulario enviado", { clientId, values });

      try {
        if (!clientId) {
          console.error("❌ Sin cliente ID");
          setAlertMessage("❌ Debe seleccionar un cliente para registrar la reparación");
          setSubmitting(false);
          setIsProcessing(false);
          return;
        }

        const payload = {
          clienteId: clientId,
          clientId: clientId,
          cliente_id: clientId,
          dispositivo: {
            marca: values.marca.trim(),
            modelo: values.modelo.trim(),
            imei: values.imei.trim() || null,
            accesorios: values.accesorios.trim() || null,
            patron: values.patron || null,
            tieneContrasena: values.tieneContrasena,
            contrasena: values.tieneContrasena ? encryptPassword(values.contrasena) : null,
          },
          servicio: {
            falla: values.falla.trim(),
            presupuesto: values.presupuesto || null,
            deposito: values.deposito ? parseInt(values.deposito) : 0,
            recibidoPor: values.recibidoPor,
            estado: values.estado,
            fechaEntregaEstimada: values.fechaEntregaEstimada || null,
            observaciones: values.observaciones.trim() || null,
          },
        };

        console.log("📤 Enviando payload:", payload);
        const response = await axios.post("http://localhost:4000/reparaciones", payload);
        console.log("✅ Respuesta del servidor:", response.data);
        
        setAlertMessage(`✅ Reparación registrada exitosamente (ID: ${response.data.id})`);
        
        setTimeout(() => {
          formik.resetForm();
          navigate("/managerepairs");
        }, 1500);
      } catch (error) {
        console.error("❌ Error completo:", error);
        console.error("📍 Error response:", error.response?.data);
        setAlertMessage(
          `❌ Error al guardar: ${error.response?.data?.error || error.message || "Error desconocido"}`
        );
      } finally {
        setSubmitting(false);
        setIsProcessing(false);
      }
    },
  });

  const handleSelectClient = (client) => {
    const id = client._id || client.id || client.insertId || "";
    setSelectedClient(client);
    navigate(`/addrepair?clientId=${id}`, { state: { client } });
  };

  return (
    <div className="add-repair-page">
      <div className="screen-header">
        <div></div>
        <p className="user-info">👤 {usuario}</p>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </div>
      <header className="add-repair-header">
        <h1>📱 Agregar Reparación</h1>

        {clientId && clientData && (
          <div className="client-info-card">
            <div className="client-info-content">
              <div className="client-avatar">👤</div>
              <div className="client-details">
                <strong className="client-name">{clientData.nombre}</strong>
                <small className="client-phone">📞 {clientData.telefono}</small>
                <small className="client-email">📧 {clientData.email}</small>
              </div>
            </div>
            <button 
              type="button" 
              className="change-client-btn"
              onClick={() => {
                setSelectedClient(null);
                navigate("/addrepair");
              }}
            >
              Cambiar cliente
            </button>
          </div>
        )}

        {!clientId && (
          <div className="client-selection">
            <ClientSelector onSelect={handleSelectClient} />
            <button type="button" className="secondary add-new-btn" onClick={() => navigate("/adduser")}>
              + Nuevo cliente
            </button>
          </div>
        )}
      </header>

      {alertMessage && (
        <div className={`alert ${alertMessage.includes("✅") ? "alert-success" : "alert-error"}`}>
          {alertMessage}
        </div>
      )}

      {clientId && (
        <form className="add-repair-form" onSubmit={formik.handleSubmit}>

          <section className="card">
            <h2>Datos del dispositivo</h2>
            <div className="row">
              <label>
                Marca <span className="required">*</span>
                <input name="marca" value={formik.values.marca} onChange={formik.handleChange} onBlur={formik.handleBlur} className={formik.touched.marca && formik.errors.marca ? "input-error" : ""} />
                {formik.touched.marca && formik.errors.marca && <small className="error">{formik.errors.marca}</small>}
              </label>

              <label>
                Modelo <span className="required">*</span>
                <input name="modelo" value={formik.values.modelo} onChange={formik.handleChange} onBlur={formik.handleBlur} className={formik.touched.modelo && formik.errors.modelo ? "input-error" : ""} />
                {formik.touched.modelo && formik.errors.modelo && <small className="error">{formik.errors.modelo}</small>}
              </label>
            </div>

            <div className="row">
              <label>
                IMEI / N° Serie
                <input name="imei" value={formik.values.imei} onChange={formik.handleChange} />
              </label>

              <label>
                Accesorios
                <input name="accesorios" value={formik.values.accesorios} onChange={formik.handleChange} placeholder="Ej: cargador, funda" />
              </label>
            </div>

            <PatternDrawer 
              onPatternChange={(pattern) => formik.setFieldValue("patron", pattern)}
              initialPattern={formik.values.patron}
            />

            <div className="row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="tieneContrasena"
                  checked={formik.values.tieneContrasena}
                  onChange={formik.handleChange}
                />
                Tiene patrón/contraseña de seguridad
              </label>
            </div>

            {formik.values.tieneContrasena && (
              <label>
                Contraseña
                <input 
                  type="text"
                  name="contrasena"
                  value={formik.values.contrasena}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ej: 123456, patron visual, etc."
                  className={formik.touched.contrasena && formik.errors.contrasena ? "input-error" : ""}
                />
                {formik.touched.contrasena && formik.errors.contrasena && <small className="error">{formik.errors.contrasena}</small>}
              </label>
            )}
          </section>

          <section className="card">
            <h2>Servicio</h2>
            <label>
              Descripción de la falla <span className="required">*</span>
              <textarea name="falla" value={formik.values.falla} onChange={formik.handleChange} onBlur={formik.handleBlur} className={formik.touched.falla && formik.errors.falla ? "input-error" : ""} />
              {formik.touched.falla && formik.errors.falla && <small className="error">{formik.errors.falla}</small>}
            </label>

            <div className="row">
              <label>
                Presupuesto (opcional)
                <input name="presupuesto" type="number" value={formik.values.presupuesto} onChange={formik.handleChange} />
              </label>

              <label>
                Depósito
                <input 
                  name="deposito" 
                  type="text"
                  value={formik.values.deposito} 
                  onChange={formik.handleChange}
                  placeholder="0"
                  className={formik.touched.deposito && formik.errors.deposito ? "input-error" : ""}
                />
                {formik.touched.deposito && formik.errors.deposito && <small className="error">{formik.errors.deposito}</small>}
              </label>
            </div>

            <div className="row">
              <label>
                Recibido por
                <select name="recibidoPor" value={formik.values.recibidoPor} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                  <option value="Leonel">Leonel</option>
                  <option value="Mariana">Mariana</option>
                </select>
              </label>

              <label>
                Estado
                <div className="readonly-field">En proceso</div>
                <input type="hidden" name="estado" value={formik.values.estado} />
              </label>
            </div>

            <label>
              Fecha entrega estimada
              <input 
                type="date" 
                name="fechaEntregaEstimada" 
                value={formik.values.fechaEntregaEstimada} 
                onChange={formik.handleChange}
                min={getMinDate()}
              />
            </label>

            <label>
              Observaciones internas
              <textarea name="observaciones" value={formik.values.observaciones} onChange={formik.handleChange} />
            </label>
          </section>

          <div className="form-actions">
            <button type="submit" disabled={formik.isSubmitting || isProcessing} className="btn-save">
              {formik.isSubmitting || isProcessing ? "Guardando..." : "✓ Guardar reparación"}
            </button>
            <button type="button" className="secondary" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}


