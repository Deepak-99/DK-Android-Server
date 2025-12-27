export default function ConversationList({
  threads,
  onSelect
}: {
  threads: any[];
  onSelect: (t: any) => void;
}) {
  return (
    <div className="w-96 border-r border-border overflow-y-auto h-full">
      {threads.map((t) => (
        <div
          key={t.thread_id}
          className="p-4 border-b border-border hover:bg-accent cursor-pointer"
          onClick={() => onSelect(t)}
        >
          <div className="font-medium">{t.address}</div>
          <div className="text-xs text-muted-foreground truncate">
            {t.snippet}
          </div>
        </div>
      ))}
    </div>
  );
}
