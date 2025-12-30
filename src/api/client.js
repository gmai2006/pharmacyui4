import axios from 'axios';

// 1. Create the instance
const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Setup the Response Interceptor
apiClient.interceptors.response.use(
  // A. SUCCESS (2xx Status)
  (response) => {
    // You can strip the 'data' object here so you don't have to type response.data.data everywhere
    return response; 
  },
  
  // B. ERROR (Any status outside 2xx)
  (error) => {
    const originalRequest = error.config;

    // Handle specific status codes globally
    if (error.response) {
      switch (error.response.status) {
        
        case 401:
          // Unauthorized: Token expired or not logged in
          console.error('Session expired. Redirecting to login...');
          // Clear local storage
          localStorage.removeItem('authToken');
          // Force redirect to login page
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden: User valid, but permissions missing
          console.error('Access denied.');
          // You might trigger a global toast notification here
          break;

        case 404:
          console.error('Resource not found.');
          break;

        case 500:
          console.error('Server error. Please report this issue.');
          break;
          
        default:
          console.error('An unknown error occurred.');
      }
    } else if (error.request) {
      // Network errors (server down/no internet)
      console.error('Network Error: Please check your connection.');
    }

    // CRITICAL: Always return Promise.reject(error)
    // This passes the error back to your specific component's try/catch block.
    // If you don't do this, the component will think the request succeeded!
    return Promise.reject(error);
  }
);

export default apiClient;