import { useState } from "react";
import { useContacts } from "./useContacts";
import ContactsList from "./ContactsList";
import ContactDetails from "./ContactDetails";
import SearchBar from "./SearchBar";
import AddContactModal from "./AddContactModal";
import { contactsApi } from "../../services/contactsApi";
import { toast } from "sonner";

export default function ContactsPage({ deviceId }: { deviceId: string }) {

  const { list, reload, loading } = useContacts(deviceId);

  const [selected, setSelected] = useState<any>(null);
  const [addModal, setAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSearch(q: string) {
    try {
      if (q.trim().length === 0) return reload();

      const res = await contactsApi.search(q);
      setSelected(null);

      toast(`Found ${res.data.length} results`);
    } catch {
      setErrorMsg("Failed to search contacts");
    }
  }

  async function onDelete(id: string) {
    try {
      await contactsApi.delete(id);
      toast.success("Contact deleted");
      await reload();
      setSelected(null);
    } catch {
      setErrorMsg("Failed to delete contact");
    }
  }

  return (
    <div className="flex h-full">

      <div className="flex flex-col h-full">
        <SearchBar onSearch={onSearch} />

        <button
          className="btn-primary mx-4 my-2"
          onClick={() => setAddModal(true)}
        >
          + Add Contact
        </button>

        <ContactsList list={list} onSelect={setSelected} />
      </div>

      <ContactDetails
        contact={selected}
        onDelete={onDelete}
      />

      <AddContactModal
        open={addModal}
        onClose={() => setAddModal(false)}
        deviceId={deviceId}
        refresh={reload}
      />

      {errorMsg && (
        <div className="error-box">
          {errorMsg}
        </div>
      )}

    </div>
  );
}
