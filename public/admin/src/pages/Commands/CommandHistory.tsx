import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export default function CommandHistory({ deviceId }: any) {
  const { data } = useQuery({
    queryKey:["commands",deviceId],
    queryFn:()=>api.get(`/commands?deviceId=${deviceId}`)
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold mb-3">
        Command History
      </h3>

      <div className="space-y-2">
        {data?.data?.map((c:any)=>(
          <div
            key={c.id}
            className="border-b border-border pb-2 text-sm"
          >
            {c.command} — {c.status}
          </div>
        ))}
      </div>
    </div>
  );
}