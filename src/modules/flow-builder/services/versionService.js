import axios from "axios";
import { formatForBackend, formatForFrontend } from "../utils/formatConverter";

const api = axios.create({
    baseURL: "http://10.10.19.188:6215/api",
    headers: { "Content-Type": "application/json" },
});

// Save Version
export const saveVersionApi = async (versionName, nodes, edges) => {
    const formattedData = formatForBackend(nodes, edges);

    return api.post("/save-version", {
        version: versionName,
        data: formattedData,
    });
};

// Get Flow Versions
export const getVersionsApi = () =>
    api.get("/list-versions");

// Load Version Flow
export const loadVersionApi = async (versionName) => {
    const response = await api.get("/get-version", {
        params: { file: versionName }
    });

    return formatForFrontend(response.data);
};

// Publish Flow
export const publishApi = async (nodes, edges) => {
    const formattedData = formatForBackend(nodes, edges);

    return api.post("/publish", {
        data: formattedData
    });
};