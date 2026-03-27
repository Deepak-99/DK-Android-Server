export default function StatTile({ icon, label, value }: any) {
    return (
        <div className="bg-card border border-border rounded-xl p-5
                    hover:border-accent transition">

            <div className="flex justify-between items-center">
                <div>
                    <div className="text-muted text-sm">{label}</div>
                    <div className="text-2xl font-semibold mt-1">
                        {value}
                    </div>
                </div>

                <div className="text-accent">
                    {icon}
                </div>
            </div>

        </div>
    );
}