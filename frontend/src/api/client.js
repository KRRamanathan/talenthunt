const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 90000);
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The API is taking longer than expected. Render free-tier services can take 30–60s to wake.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  clients: () => request("/clients"),
  roles: (skip = 0, limit = 20) => request(`/roles?skip=${skip}&limit=${limit}`),
  role: (id) => request(`/roles/${id}`),
  createRole: (body) => request("/roles", { method: "POST", body: JSON.stringify(body) }),
  candidates: (roleId, perspective = "recruiter") =>
    request(`/roles/${roleId}/candidates?perspective=${perspective}&limit=50`),
  candidate: (id, perspective = "recruiter") => request(`/candidates/${id}?perspective=${perspective}`),
  patchCandidate: (id, body) => request(`/candidates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  feedback: (id, body) => request(`/candidates/${id}/feedback`, { method: "POST", body: JSON.stringify(body) }),
  dashboard: () => request("/dashboard/summary"),
  health: (id) => request(`/roles/${id}/health`),
  report: (id) => request(`/roles/${id}/report`),
  calibration: (id) => request(`/roles/${id}/calibration`),
  market: (id) => request(`/roles/${id}/market-insights`),
};
