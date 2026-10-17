import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attaches the logged-in user's role as a header so the backend maintenance
// middleware can recognise admins and let them through.
axiosInstance.interceptors.request.use((config) => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.role) {
            config.headers['x-user-role'] = user.role;
        }
    } catch {
        // Ignore parse errors — header simply won't be set
    }
    return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// If the backend returns 503 with code MAINTENANCE_MODE, redirect non-admin
// users to the maintenance page immediately.
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 503 &&
            error.response?.data?.code === 'MAINTENANCE_MODE'
        ) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                if (user?.role !== 'ADMIN') {
                    window.location.href = '/maintenance';
                }
            } catch {
                window.location.href = '/maintenance';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
