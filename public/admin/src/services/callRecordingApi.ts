import api from "./api";
import { CallRecording } from "../pages/CallRecordings/types";

// ----------------------------
// Types
// ----------------------------

export interface CallRecordingResponse {
  data: CallRecording[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

// ----------------------------
// API functions
// ----------------------------

// LIST (paginated)
export const getCallRecordings = async (
  deviceId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<CallRecordingResponse> => {

  const res = await api.get(`/media/recordings/device/${deviceId}`, {
    params
  });

  return res.data;
};


// DELETE single recording
export const deleteCallRecording = async (
  deviceId: string,
  recordingId: string
): Promise<void> => {

  await api.delete(`/media/recordings/device/${deviceId}`, {
    data: {
      recordingIds: [recordingId]
    }
  });
};


// DOWNLOAD / STREAM
export const downloadCallRecording = (
  deviceId: string,
  filePath: string
) => {

  const url = `/media/recordings/file/${deviceId}/${filePath}`;
  window.open(url, '_blank');
};
