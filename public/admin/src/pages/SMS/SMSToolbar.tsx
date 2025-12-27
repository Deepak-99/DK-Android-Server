export default function SMSToolbar({ active }: any) {
    return (
        <div className="p-2 border-b border-border flex gap-2">
      <span className="font-semibold">
        {active ? `Thread: ${active}` : "Select a conversation"}
      </span>
        </div>
    );
}
