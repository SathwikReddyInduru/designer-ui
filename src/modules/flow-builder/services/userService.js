import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Get all users
export const getUsersApi = () =>
    api.get("/users");

// Create a new user  →  POST /api/users
export const createUserApi = (payload) =>
    api.post("/users", payload);

// Update a user's role and/or is_active  →  PUT /api/users/{user_id}
export const updateUserApi = (userId, payload) =>
    api.put(`/users/${userId}`, payload);

// Delete a user  →  DELETE /api/users/{user_id}
export const deleteUserApi = (userId) =>
    api.delete(`/users/${userId}`);