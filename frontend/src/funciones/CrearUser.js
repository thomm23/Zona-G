import axios from "axios";

/**
 * Función para crear un usuario en el backend
 * @param {Object} newUser - Objeto con los datos del usuario {name, email, role}
 * @param {Function} setUsers - Función de React para actualizar el estado de usuarios
 */
export const createUser = async (newUser, setUsers) => {
  try {
    const response = await axios.post("http://localhost:3000/api/clientes", newUser);
    console.log("Usuario creado:", response.data);
    // Actualiza el estado de usuarios si se pasa la función setUsers
    if (setUsers) {
      setUsers((prevUsers) => [...prevUsers, response.data]);
    }
  } catch (error) {
    console.error("Error al crear usuario:", error.response?.data || error.message);
  }
};
