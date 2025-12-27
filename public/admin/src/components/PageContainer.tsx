export default function PageContainer({ children, title }: any) {
    return (
        <div>
            {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
            <div className="bg-card p-6 rounded-lg border border-border shadow">
                {children}
            </div>
        </div>
    );
}
