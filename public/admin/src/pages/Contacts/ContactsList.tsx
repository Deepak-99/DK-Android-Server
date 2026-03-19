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

      {list.map((c: ContactItem) => (
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

    </div>
  );
}
