import { TypedEventTarget } from "typescript-event-target";

export interface GRBLWebSocketEventMap {
    connect: Event;
    disconnect: CustomEvent<string | null>;
    data: CustomEvent<string>;
    error: CustomEvent<string>;
}

export default class GRBLWebSocket extends TypedEventTarget<GRBLWebSocketEventMap> {
    private socket: WebSocket | null = null;
    private url: string;
    private lastMassage?: string;
    private messageBuffer: string = ""; // Buffer for incomplete messages

    constructor({ url = 'ws://192.168.5.1' } = {}) {
        super();
        this.url = url;
        this.socket = null;
    }

    async connect() {
        try {
            this.socket = new WebSocket(this.url);
            this.socket.onopen = () => {
                console.log("WebSocket connected");
                this.dispatchTypedEvent("connect", new CustomEvent("connect"));
            };

            this.socket.onmessage = (event) => {
                // Append new data to buffer
                this.messageBuffer += event.data;

                // Split buffer by line endings
                const lines = this.messageBuffer.split(/\r?\n/);

                // Process all complete lines (all but the last if buffer doesn't end with newline)
                const isLastLineComplete = this.messageBuffer.endsWith('\n') || this.messageBuffer.endsWith('\r\n');
                const linesToProcess = isLastLineComplete ? lines : lines.slice(0, -1);

                // Keep incomplete line in buffer
                this.messageBuffer = isLastLineComplete ? "" : lines[lines.length - 1];

                for (const line of linesToProcess) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        // Ignore 'ok' responses that come after messages starting with '<'
                        if ((trimmedLine?.startsWith("<") ||
                            trimmedLine?.startsWith("[") || (this.lastMassage?.includes('$'))) && trimmedLine?.endsWith("ok")) {
                            this.dispatchTypedEvent("data", new CustomEvent("data", {detail: trimmedLine.replace('ok', '').trim()}));
                        }
                        else {
                            if (trimmedLine == 'ok' && ((this.lastMassage?.startsWith("<") && this.lastMassage?.endsWith(">")) || (this.lastMassage?.startsWith('[') && this.lastMassage?.endsWith(']')) || (this.lastMassage?.includes('$'))))
                            {
                                continue;
                            }
                            this.lastMassage = trimmedLine;
                            this.dispatchTypedEvent("data", new CustomEvent("data", {detail: trimmedLine}));
                        }
                    }
                }
            };

            this.socket.onerror = (error) => {
                this.socket?.close();
                this.messageBuffer = ""; // Clear buffer on error
                console.error("WebSocket error:", error);
                this.dispatchTypedEvent("error", new CustomEvent("error", { detail: error.toString() }));
            };

            this.socket.onclose = (event) => {
                this.socket?.close();
                this.messageBuffer = ""; // Clear buffer on close
                console.log("WebSocket disconnected:", event.code, event.reason);
                this.dispatchTypedEvent("disconnect", new CustomEvent("disconnect", { detail: event.reason }));
            };
        } catch (error) {
            console.error("Error connecting to WebSocket:", error);
            this.socket?.close();

            this.socket = null;
            throw error;
        }
    }

    async disconnect() {
        if (this.socket) {
            this.socket.close(1000, "User disconnected");
            this.socket = null;
        }
        this.messageBuffer = ""; // Clear buffer on disconnect
    }

    async send(command: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        this.socket.send(command + '\r');
    }
}