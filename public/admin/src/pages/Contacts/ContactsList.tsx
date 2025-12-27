import { ContactItem } from "./types";

export default function ContactsList({
  list,
  onSelect
}: {
  list: ContactItem[];
  onSelect: (c: ContactItem) => void;
}) {
    return (
        <div className="border-r border-border w-96 h-full overflow-y-auto">
            {contacts.map((c) => (
                <div
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="p-3 hover:bg-accent cursor-pointer border-b border-border"
                >
                    <div className="font-semibold">{c.display_name}</div>
                    <div className="text-muted-foreground text-sm">
                        {c.phone_number}
                    </div>
                </div>
            ))}

            {list.map((c) => (
                <div
                    key={c.id}
                    className="p-4 border-b border-border hover:bg-accent cursor-pointer"
                    onClick={() => onSelect(c)}
                >
                    <div className="font-medium">{c.display_name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone_number}</div>
                </div>
            ))}
        </div>
    );
}
