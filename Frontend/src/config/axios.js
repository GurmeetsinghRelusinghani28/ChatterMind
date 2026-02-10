// import axios from 'axios';

// // Create an instance of axios with default configuration

// const axiosInstance = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
//     headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//     },
// });

// export default axiosInstance;

// 

// src/config/axios.js
import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 responses
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance