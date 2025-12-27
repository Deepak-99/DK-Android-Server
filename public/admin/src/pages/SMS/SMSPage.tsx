import { useState, useEffect } from "react";
import { useSMS } from "./useSMS";
import SMSList from "./SMSList";
import ConversationList from "./ConversationList";
import ConversationView from "./ConversationView";
import SearchBar from "./SearchBar";
import SendSMSModal from "./SendSMSModal";
import { smsApi } from "@/services/smsApi";
import { toast } from "sonner";
import ThreadList from "./ThreadList";
import MessageList from "./MessageList";
import SMSToolbar from "./SMSToolbar";

export default function SMSPage({ deviceId }: { deviceId: string }) {
  const { list, reload, loading } = useSMS(deviceId);
  const [selected, setSelected] = useState<any>(null);
  const [threads, messages, activeThread, loadMessages, setThreads] = useState<any[]>([]);
  const [currentThread, setCurrentThread] = useState<any[]>([]);
  const [sendModal, setSendModal] = useState(false);


  async function loadThreads() {
    const res = await smsApi.conversations(deviceId);
    setThreads(res.data || []);
  }

  useEffect(() => {
    loadThreads();
  }, [deviceId]);

  async function onSearch(q: string) {
    if (!q.trim()) return reload();
    const res = await smsApi.search(q);
    setCurrentThread(res.data);
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full border-r border-border">
      <ThreadList threads={threads} onSelect={loadMessages} />
        <SearchBar onSearch={onSearch} />

        <button className="btn-primary mx-4 my-2" onClick={() => setSendModal(true)}>
          + Send SMS
        </button>

          <div className="flex flex-col flex-1">
              <SMSToolbar active={activeThread} />
              <MessageList messages={messages} />
          </div>

        <ConversationList threads={threads} onSelect={async (t) => {
          const res = await smsApi.search(t.address);
          setCurrentThread(res.data);
        }} />
      </div>

      <ConversationView messages={currentThread} />

      <SendSMSModal open={sendModal} onClose={() => setSendModal(false)} deviceId={deviceId} />
    </div>
  );
}
