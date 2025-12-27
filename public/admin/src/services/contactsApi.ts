import api from "@/services/apiBase";
import { ContactItem } from "@/pages/Contacts/types";

export const contactsApi = {
  list(deviceId: string) {
    return api.get<ContactItem[]>(`/contacts/device/${deviceId}`);
  },

  search(query: string) {
    return api.get<ContactItem[]>(`/contacts/search/${query}`);
  },

  add(deviceId: string, data: any) {
    return api.post("/contacts", {
      device_id: deviceId,
      contacts: [data]
    });
  },

  delete(contactId: string) {
    return api.delete(`/contacts/${contactId}`);
  }
};
