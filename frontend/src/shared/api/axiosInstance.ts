import axios from 'axios'

// La URL base incluye el prefijo /api/v1 y sale de la variable de entorno
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
