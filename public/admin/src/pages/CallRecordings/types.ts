export interface CallRecording {
  id: number;
  device_id: string;
  call_id: number;
  phone_number: string;
  contact_name?: string;
  duration: number;
  size_bytes: number;
  mime: string;
  created_at: string;
}
