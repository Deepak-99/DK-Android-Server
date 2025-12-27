import { useParams } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import DeviceHeader from "./header/DeviceHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InfoTab from "./tabs/InfoTab";
import LocationTab from "./tabs/LocationTab";
import FilesTab from "./tabs/FilesTab";
import CommandsTab from "./tabs/CommandsTab";
import SmsTab from "./tabs/SmsTab";
import ContactsTab from "./tabs/ContactsTab";
import AppsTab from "./tabs/AppsTab";
import LogsTab from "./tabs/LogsTab";

export default function DeviceDetailPage() {
    const { id } = useParams();

    return (
        <DashboardLayout>
            <DeviceHeader deviceId={id!} />

            <Tabs defaultValue="info" className="mt-6">
                <TabsList className="w-full overflow-x-auto">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="commands">Commands</TabsTrigger>
                    <TabsTrigger value="sms">SMS</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="apps">Apps</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="info"><InfoTab deviceId={id!} /></TabsContent>
                <TabsContent value="location"><LocationTab deviceId={id!} /></TabsContent>
                <TabsContent value="files"><FilesTab deviceId={id!} /></TabsContent>
                <TabsContent value="commands"><CommandsTab deviceId={id!} /></TabsContent>
                <TabsContent value="sms"><SmsTab deviceId={id!} /></TabsContent>
                <TabsContent value="contacts"><ContactsTab deviceId={id!} /></TabsContent>
                <TabsContent value="apps"><AppsTab deviceId={id!} /></TabsContent>
                <TabsContent value="logs"><LogsTab deviceId={id!} /></TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
