import { useState, useEffect } from "react";
import { contactsApi } from "@/services/contactsApi";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ContactItem } from "./types";

export function useContacts(deviceId: string) {
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [filtered, setFiltered] = useState<ContactItem[]>([]);
    const [list, setList] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await contactsApi.list(deviceId);
        setContacts(res.data || []);
        setFiltered(res.data || []);
        setList(res.data || []);
        setLoading(false);
    }

    function search(term: string) {
        if (!term.trim()) {
            setFiltered(contacts);
            return;
        }
        const t = term.toLowerCase();
        setFiltered(
            contacts.filter(
                (c) =>
                    c.display_name.toLowerCase().includes(t) ||
                    (c.phone_number && c.phone_number.includes(t))
            )
        );
    }

    useWebSocket("contacts.new", (c: ContactItem) => {
        if (c.device_id === deviceId) {
            setList((prev) => [c, ...prev]);
        }
    });

    useWebSocket("contacts.delete", (payload: { contact_id: string }) => {
        setList((prev) => prev.filter((c) => c.contact_id !== payload.contact_id));
    });

    useEffect(() => { load(); }, [deviceId]);

    return { list,contacts, filtered, loading, search, reload: load };
}
