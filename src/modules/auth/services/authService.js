// import axios from "axios";

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_BASE_URL,
//     headers: { "Content-Type": "application/json" },
// });

// // ─── Mock — remove this and uncomment the real call below when API is ready ───
// const MOCK_CREDENTIALS = [
//     { id: 1, username: 'user',  password: 'user',  role: 'user' },
//     { id: 2, username: 'admin', password: 'admin', role: 'admin' },
// ];

// export const loginApi = async (username, password) => {
//     // ── MOCK ──────────────────────────────────────────────────────────────────
//     await new Promise(res => setTimeout(res, 500));
//     const match = MOCK_CREDENTIALS.find(
//         c => c.username === username && c.password === password
//     );
//     if (!match) {
//         const err = new Error('Invalid username or password.');
//         err.response = { data: { error: 'Invalid username or password.' } };
//         throw err;
//     }
//     return { data: { id: match.id, username: match.username, role: match.role } };
//     // ─────────────────────────────────────────────────────────────────────────

//     // ── REAL API (uncomment when backend is ready) ────────────────────────────
//     // return api.post('/auth/login', { username, password });
//     //
//     // Expected response: { id, username, role }
//     // Backend sets role — frontend trusts it as-is.
//     // ─────────────────────────────────────────────────────────────────────────
// };

import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Backend response shape: { message, username, role }
export const loginApi = async (username, password) => {
    return api.post('/login', { username, password });
};