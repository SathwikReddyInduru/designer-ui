import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Get all users
export const getUsersApi = () =>
    api.get("/users");

// Update a user's role and/or status
export const updateUserApi = (userId, payload) =>
    api.patch(`/users/${userId}`, payload);

// Delete a user
export const deleteUserApi = (userId) =>
    api.delete(`/users/${userId}`);