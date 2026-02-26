import api from "@/api/axios";

export interface CommandPayload {
  type: string;
  data?: string;
}

// -----------------------------
// LIST
// -----------------------------

export const getCommandHistory = async (deviceId: string) => {
  const res = await api.get(`/commands`, {
    params: { deviceId }
  });

  return res.data.data; // backend returns { success, data, pagination }
};

// -----------------------------
// SEND
// -----------------------------

export const sendCommand = async (
  deviceId: string,
  type: string,
  data?: string
) => {

  const res = await api.post(`/devices/${deviceId}/commands`, {
    command: type,
    params: {
      data
    }
  });

  return res.data;
};

// -----------------------------
// DELETE
// -----------------------------

export const deleteCommand = async (
  deviceId: string,
  commandId: string
) => {

  const res = await api.delete(`/devices/${deviceId}/commands/${commandId}`);

  return res.data;
};

// -----------------------------
// RETRY
// -----------------------------

export const retryCommand = async (
  deviceId: string,
  commandId: string
) => {

  const res = await api.post(`/commands/${commandId}/retry`);

  return res.data;
};
