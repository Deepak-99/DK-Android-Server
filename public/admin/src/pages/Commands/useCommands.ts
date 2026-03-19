import { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { CommandItem } from "./types";
import { commandsApi } from "../../services/commandsApi";
import { CommandType } from "../../types/commands";
import { Command } from "./commandTypes";

// ------------------------------------
// Normalize websocket payload → API shape
// ------------------------------------

function mapSocketCommand(cmd: Command): CommandItem {
  return {
    id: cmd.id,
    device_id: cmd.device_id,
    command_type: cmd.command_type,
    parameters: cmd.parameters,
    status: cmd.status,
    result: cmd.result ?? null, // IMPORTANT: ensure required field exists
    created_at: cmd.created_at,
    updated_at: cmd.updated_at
  };
}

// ------------------------------------
// Hook
// ------------------------------------

export function useCommands(deviceId: string) {

  const [list, setList] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ------------------------------------
  // Load from REST API
  // ------------------------------------

  async function load() {
    try {
      setLoading(true);
      const res = await commandsApi.list(deviceId);
      setList(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------
  // Send new command
  // ------------------------------------

  async function send(commandType: CommandType, parameters: any = {}) {
    await commandsApi.create(deviceId, commandType, parameters);
    await load(); // refresh list
  }

  // ------------------------------------
  // Initial load
  // ------------------------------------

  useEffect(() => {
    if (!deviceId) return;
    load();
  }, [deviceId]);

  // ------------------------------------
  // WebSocket live updates
  // ------------------------------------

  useWebSocket("command.update", (cmd: Command) => {
    if (cmd.device_id !== deviceId) return;

    const normalized = mapSocketCommand(cmd);

    setList(prev =>
      prev.map(c => (c.id === normalized.id ? normalized : c))
    );
  });

  useWebSocket("command.new", (cmd: Command) => {
    if (cmd.device_id !== deviceId) return;

    const normalized = mapSocketCommand(cmd);

    setList(prev => [normalized, ...prev]);
  });

  // ------------------------------------
  // Public API
  // ------------------------------------

  return {
    list,
    loading,
    send,
    reload: load
  };
}
