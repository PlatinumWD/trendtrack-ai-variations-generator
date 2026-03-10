import axios from 'axios';
import { appConfig } from '@config/app.config';

export const apiClient = axios.create({
  baseURL: appConfig.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global error messages here
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
