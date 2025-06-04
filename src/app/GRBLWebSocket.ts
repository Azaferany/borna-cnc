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
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectTimeout: number = 1000; // Start with 1 second
    private lastMassage?: string; // Start with 1 second

    constructor({ url = 'ws://192.168.5.1:80' } = {}) {
        super();
        this.url = url;
        this.socket = null;
    }

    async connect() {
        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log("WebSocket connected");
                this.reconnectAttempts = 0;
                this.reconnectTimeout = 1000;
                this.dispatchTypedEvent("connect", new CustomEvent("connect"));
            };

            this.socket.onmessage = (event) => {
                const
                    data = event.data.trim();
                if (data) {// Ignore 'ok' responses that come after messages starting with '<'

                    if (data?.startsWith("<") && data?.endsWith("ok")) {
                        this.dispatchTypedEvent("data", new CustomEvent("data", { detail: data.replace('ok','').trim() }));

                    }
                    else {
                        if(data == 'ok' && this.lastMassage?.startsWith("<") && this.lastMassage?.endsWith(">"))
                        {
                            return
                        }
                        this.lastMassage = data;
                        this.dispatchTypedEvent("data", new CustomEvent("data", { detail: data }));

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

                // Attempt to reconnect if not closed cleanly
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                        this.connect();
                    }, this.reconnectTimeout);
                    // Exponential backoff
                    this.reconnectTimeout *= 2;
                }
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
            this.socket.close(1000, "User disconnected");
            this.socket = null;
        }
    }

    async send(command: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        if(command == "$H")
            return;

        this.socket.send(command + '\n');
    }
}