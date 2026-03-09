// Determinar la URL base de la API según el ambiente
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://zona-g.onrender.com' 
    : 'http://localhost:4000');

export default API_BASE_URL;
