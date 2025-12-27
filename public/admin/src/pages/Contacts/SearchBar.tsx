import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");

  function submit() {
    onSearch(q);
  }

  return (
    <div className="p-4 flex gap-3 border-b border-border">
      <input
        className="input flex-1"
        placeholder="Search contacts..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="btn-primary" onClick={submit}>Search</button>
    </div>
  );
}
