import React, { useState } from 'react';
import apiClient from './client'; // Import your custom instance

const Dashboard = () => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      // Use apiClient instead of axios
      const response = await apiClient.get('/dashboard-stats');
      setData(response.data);
    } catch (error) {
      // Thanks to the interceptor, we know 401s are already handled (redirected).
      // We only need to handle local UI states here, like stopping a spinner.
      console.log('Local component error handling:', error.message);
    }
  };

  return <button onClick={fetchData}>Load Data</button>;
};