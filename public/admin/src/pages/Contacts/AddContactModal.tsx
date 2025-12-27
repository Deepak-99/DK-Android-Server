import { useState } from "react";
import { contactsApi } from "@/services/contactsApi";
import { toast } from "sonner";

export default function AddContactModal({
                                            open,
                                            onClose,
                                            deviceId,
                                            refresh
                                        }: {
    open: boolean;
    onClose: () => void;
    deviceId: string;
    refresh: () => void;
}) {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [email, setEmail] = useState("");

    async function add() {
        await contactsApi.add(deviceId, {
            contact_id: Date.now().toString(),
            display_name: name,
            phone_number: number,
            email
        });

        toast.success("Contact added");
        refresh();
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 p-6 rounded-lg space-y-4 w-96">
                <h2 className="text-lg font-bold">Add Contact</h2>

                <input className="input" placeholder="Name" onChange={(e) => setName(e.target.value)} />
                <input className="input" placeholder="Phone Number" onChange={(e) => setNumber(e.target.value)} />
                <input className="input" placeholder="Email (optional)" onChange={(e) => setEmail(e.target.value)} />

                <div className="flex gap-2 justify-end">
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={add}>Add</button>
                </div>
            </div>
        </div>
    );
}
