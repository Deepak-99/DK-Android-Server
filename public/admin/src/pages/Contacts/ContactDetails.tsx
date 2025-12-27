import { ContactItem } from "./types";

export default function ContactDetails({
  contact,
  onDelete
}: {
  contact: ContactItem | null;
  onDelete: (id: string) => void;
}) {
  if (!contact)
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a contact
      </div>
    );

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      <h2 className="text-xl font-bold">Contact Details</h2>

      <div className="space-y-2">
        <div><b>Name:</b> {contact.display_name}</div>
        <div><b>Phone:</b> {contact.phone_number}</div>
        {contact.email && <div><b>Email:</b> {contact.email}</div>}
      </div>

      <button className="btn-destructive mt-6" onClick={() => onDelete(contact.contact_id)}>
        Delete Contact
      </button>
    </div>
  );
}
