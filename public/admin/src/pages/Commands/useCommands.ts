import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CommandItem } from "./types";
import { commandsApi } from "@/services/commandsApi";
import { CommandDTO, CommandType } from "@/types/commands";
import { Command } from "./commandTypes";
import {commandApi} from "@/services/commandApi";

export function useCommands(deviceId: string) {
    const [history, setHistory] = useState<CommandDTO[]>([]);
    const [list, setList] = useState<CommandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [commands, setCommands] = useState<Command[]>([]);

    async function loadHistory() {
        setLoading(true);
        const res = await commandsApi.history(deviceId);
        setHistory(res.data || []);
        setLoading(false);
    }

    async function load() {
        setLoading(true);
        const res = await commandsApi.list(deviceId);
        setList(res.data || []);
        async function load() {
            const res = await commandApi.list(deviceId);
            setCommands(res.data || []);
        }
        setLoading(false);
    }

    async function send(commandType: CommandType, parameters: any = {}) {
        await commandsApi.create(deviceId, commandType, parameters);
        await loadHistory();
    }


  useEffect(() => {
    load();
  }, [deviceId]);

  useWebSocket("command.update", (cmd: Command) => {
    if (cmd.device_id !== deviceId) return;
    setCommands(prev =>
      prev.map(c => (c.id === cmd.id ? cmd : c))
    );
  });

  useWebSocket("command.new", (cmd: Command) => {
    if (cmd.device_id !== deviceId) return;
    setCommands(prev => [cmd, ...prev]);
  });

    return {
        history,
        loading,
        list,
        send,
        commands,
        reload: load
    };
}
