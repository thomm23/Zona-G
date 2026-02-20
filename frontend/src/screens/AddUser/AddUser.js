import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "./AddUser.css";

export default function AddUser({ usuario, onLogout }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      onLogout();
      navigate('/');
    }
  };

  const formik = useFormik({
    initialValues: {
      nombre: "",
      telefono: "",
      email: "",
    },
    validationSchema: Yup.object({
      nombre: Yup.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .required("El nombre es obligatorio"),
      telefono: Yup.string()
        .matches(/^[0-9]{8,}$/, "El teléfono debe tener al menos 8 dígitos")
        .required("El teléfono es obligatorio"),
      email: Yup.string()
        .email("Correo electrónico inválido")
        .required("El correo es obligatorio"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const response = await axios.post("http://localhost:4000/clientes", {
          nombre: values.nombre.trim(),
          telefono: values.telefono.trim(),
          email: values.email.trim(),
        });

        const newClientId = response.data?.id;

        alert("✅ Cliente agregado correctamente");
        formik.resetForm();

        // Navegar a AddRepair si se creó el cliente, sino al Dashboard
        if (newClientId) {
          navigate(`/addrepair?clientId=${newClientId}`, {
            state: { client: response.data },
          });
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error al guardar cliente:", error);
        alert("❌ Error al guardar el cliente. Intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="adduser-container">
      <div className="screen-header">
        <div></div>
        <p className="user-info">👤 {usuario}</p>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </div>
      <div className="form-wrapper">
        <h1>👥 Nuevo Cliente</h1>
        <p className="form-subtitle">Completa los datos del cliente para comenzar</p>

        <form onSubmit={formik.handleSubmit}>
          {/* Nombre */}
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formik.values.nombre}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.nombre && formik.errors.nombre ? "input-error" : ""}
            />
            {formik.touched.nombre && formik.errors.nombre && (
              <span className="error-text">{formik.errors.nombre}</span>
            )}
          </div>

          {/* Teléfono */}
          <div className="form-group">
            <label htmlFor="telefono">Teléfono *</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="Ej: 1123456789"
              value={formik.values.telefono}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.telefono && formik.errors.telefono ? "input-error" : ""}
            />
            {formik.touched.telefono && formik.errors.telefono && (
              <span className="error-text">{formik.errors.telefono}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Ej: cliente@ejemplo.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.email && formik.errors.email ? "input-error" : ""}
            />
            {formik.touched.email && formik.errors.email && (
              <span className="error-text">{formik.errors.email}</span>
            )}
          </div>

          {/* Botones */}
          <div className="form-buttons">
            <button
              type="submit"
              disabled={isLoading || !formik.isValid}
              className="btn-primary"
            >
              {isLoading ? "Guardando..." : "Guardar Cliente"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
