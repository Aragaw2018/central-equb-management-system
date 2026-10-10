import axios from 'axios';

// Create an instance for our API calls
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api'
});

export default axiosInstance;