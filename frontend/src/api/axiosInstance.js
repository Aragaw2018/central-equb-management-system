import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,   // Send/receive HttpOnly cookies on every request
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
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        // 401 — session invalid/expired or ID spoofed.
        // Clear local state and redirect to login so the user must re-authenticate.
        if (status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            // Avoid redirect loops when already on the login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // 503 — maintenance mode: redirect non-admin users
        if (status === 503 && code === 'MAINTENANCE_MODE') {
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
