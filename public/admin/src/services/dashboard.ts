import api from "../api/axios";

export async function getDashboardStats() {
    const res = await api.get("/dashboard/stats");
    return res.data;
}
