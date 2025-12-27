import { useEffect, useState } from "react";
import { smsApi } from "@/services/smsApi";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SMSThread, SMSMessage } from "./types";

export function useSMS(deviceId: string) {
  const [list, setList] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<SMSThread[]>([]);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await smsApi.list(deviceId);
    setList(res.data || []);
    setLoading(false);
  }

  async function loadThreads() {
    const res = await smsApi.threads(deviceId);
    setThreads(res.data || []);
  }

  async function loadMessages(threadId: string) {
    setActiveThread(threadId);
    const res = await smsApi.messages(deviceId, threadId);
    setMessages(res.data || []);
  }

  useEffect(() => { load(); }, [deviceId]);

  useEffect(() => { loadThreads(); }, [deviceId]);

  useWebSocket("sms.new", (msg: SMSMessage) => {
    if (msg.device_id !== deviceId) return;

    if (msg.thread_id === activeThread) {
      setMessages(m => [...m, msg]);
    }
  });

  loadThreads();

  useWebSocket("sms.delete", ({ id }: { id: number }) => {
    setList((prev) => prev.filter((m) => m.id !== id));
  });

  return {threads, messages, activeThread, list,loadMessages, loading, reload: load };
}
