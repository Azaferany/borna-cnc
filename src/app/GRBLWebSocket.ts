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
    private lastMassage?: string; // Start with 1 second

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
                const
                    data = event.data.trim();
                const lines = data.split(/\r?\n/);
                for (const line of lines) {
                    if (line) {// Ignore 'ok' responses that come after messages starting with '<'
                        if ((line?.startsWith("<") ||
                            line?.startsWith("[")) && line?.endsWith("ok")) {
                            this.dispatchTypedEvent("data", new CustomEvent("data", { detail: line.replace('ok','').trim() }));

                        }
                        else {
                            if(line == 'ok' && ((this.lastMassage?.startsWith("<") && this.lastMassage?.endsWith(">")) || (this.lastMassage?.startsWith('[') && this.lastMassage?.endsWith(']'))))
                            {
                                return
                            }
                            this.lastMassage = line;
                            this.dispatchTypedEvent("data", new CustomEvent("data", { detail: line }));

                        }
                    }
                }

            };

            this.socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.dispatchTypedEvent("error", new CustomEvent("error", { detail: error.toString() }));
            };

            this.socket.onclose = (event) => {
                console.log("WebSocket disconnected:", event.code, event.reason);
                this.dispatchTypedEvent("disconnect", new CustomEvent("disconnect", { detail: event.reason }));
            };
        } catch (error) {
            console.error("Error connecting to WebSocket:", error);
            this.socket = null;
            throw error;
        }
    }

    async disconnect() {
        if (this.socket) {
            this.socket.close(1000, "User disconnected");
            this.socket = null;
        }
    }

    async send(command: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        this.socket.send(command + '\r');
    }
}