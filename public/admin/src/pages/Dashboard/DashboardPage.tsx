import DashboardLayout from "@/layout/DashboardLayout";
import PageContainer from "@/components/PageContainer";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <PageContainer title="Dashboard Overview">
                <div className="text-text-dim">
                    Welcome to Hawkshaw Admin Panel.<br />
                    Select an item from the sidebar to begin.
                </div>
            </PageContainer>
        </DashboardLayout>
    );
}
