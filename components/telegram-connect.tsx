"use client";

import { useState } from "react";
import { ExternalLink, Send, Unplug } from "lucide-react";

type ConnectionState = { enabled: boolean; connectedAt: string; lastMessageAt: string | null; username: string | null; displayName: string | null } | null;

export function TelegramConnect({ initialConnection, labels }: { initialConnection: ConnectionState; labels: { kicker: string; title: string; copy: string; connect: string; open: string; connected: string; enable: string; disable: string; disconnect: string; waiting: string; unavailable: string; lastDelivery: string; notSent: string } }) {
  const [connection, setConnection] = useState(initialConnection);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const requestLink = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/portal/telegram/link", { method: "POST" });
      const result = await response.json() as { ok?: boolean; url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || labels.unavailable);
      setLink(result.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : labels.unavailable); }
    finally { setBusy(false); }
  };

  const change = async (action: "enable" | "disable" | "disconnect") => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/portal/telegram/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok) throw new Error(result.message || labels.unavailable);
      if (action === "disconnect") { setConnection(null); setLink(null); }
      else if (connection) setConnection({ ...connection, enabled: action === "enable" });
    } catch (error) { setMessage(error instanceof Error ? error.message : labels.unavailable); }
    finally { setBusy(false); }
  };

  return <section className="workspace-card telegram-connect-card"><div className="panel-heading"><div><span className="kicker">{labels.kicker}</span><h2>{labels.title}</h2></div><p>{labels.copy}</p></div>{connection ? <><div className="telegram-connection-status"><Send size={18} /><span><strong>{labels.connected}</strong><small>{connection.displayName || (connection.username ? `@${connection.username}` : "Telegram")}</small><small>{labels.lastDelivery}: {connection.lastMessageAt ? new Date(connection.lastMessageAt).toISOString().slice(0, 10) : labels.notSent}</small></span></div><div className="admin-action-row"><button className="button button-small" type="button" disabled={busy} onClick={() => void change(connection.enabled ? "disable" : "enable")}>{connection.enabled ? labels.disable : labels.enable}</button><button className="button button-secondary button-small" type="button" disabled={busy} onClick={() => void change("disconnect")}><Unplug size={14} /> {labels.disconnect}</button></div></> : <><button className="button" type="button" disabled={busy} onClick={() => void requestLink()}>{busy ? labels.waiting : labels.connect} <Send size={16} /></button>{link ? <p className="telegram-link-note"><a className="table-link" href={link} target="_blank" rel="noopener noreferrer">{labels.open} <ExternalLink size={14} /></a></p> : null}</>}{message ? <p className="workspace-alert" role="alert">{message}</p> : null}</section>;
}
