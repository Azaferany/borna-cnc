import {TypedEventTarget} from "typescript-event-target";

export interface GRBLSerialEventMap {
    connect: Event;
    disconnect: CustomEvent<string|null>;
    data: CustomEvent<string>;
    error: CustomEvent<string>;
    // [...]
}

export default class GRBLSerial extends TypedEventTarget<GRBLSerialEventMap> {

    port: SerialPort | null = null;
    baudRate: number;
    keepReading = false;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private reader: ReadableStreamDefaultReader<string> | null = null;

    constructor({ baudRate = 115200 } = {}) {
        super();
        this.baudRate = baudRate;
        this.port = null;
        this.keepReading = false;

    }

    // 1️⃣ Prompt user to select and open a serial port
    async connect() {
        if (!("serial" in navigator)) {
            throw new Error("Web Serial API not supported");
        }

        try {
            this.port = await navigator.serial.requestPort();
            if (!this.port) {
                throw new Error("No port selected");
            }
            // Only set up event listeners after port is successfully opened


            try {
                await this.port.open({baudRate: this.baudRate});
            }
            catch { /* empty */ }
            this._connectListener()
            this.port.addEventListener("disconnect", this._disconnectListener);
            this.keepReading = true;

            this._readLoop();
        } catch (error) {
            console.error("Error connecting to serial port:", error);
            this.port = null;
            throw error;
        }
    }
    private readonly _disconnectListener = () => {
        console.log("Disconnected");
        this.dispatchTypedEvent("data",new CustomEvent("data", { detail: "> device disconnected" }));
        this.dispatchTypedEvent("disconnect", new CustomEvent("disconnect"));
    };
    private readonly _connectListener = () => {
        console.log("connected");
        this.dispatchTypedEvent("connect", new CustomEvent("connect"));
    };
    // 2️⃣ Close reader and port
    async disconnect() {
        this.port?.removeEventListener("disconnect", this._disconnectListener);
        this.port?.removeEventListener("connect", this._connectListener);
        this.keepReading = false;

        try {
            // Release the writer if it exists
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            // Release the writer if it exists
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            
            if (this.port) {
                await this.port.forget();
                this.port = null;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error during disconnect:', error);
            // Force reset of internal state even if there was an error
            this.port = null;
            throw error;
        }
    }

    // 3️⃣ Send a line (with newline) to GRBL
    async send(line: string) {
        if (!this.port?.writable) return;
        
        try {
            if (!this.writer) {
                this.writer = this.port.writable.getWriter();
            }
            await this.writer.write(new TextEncoder().encode(line + "\n"));
        } catch (error) {
            // If there's an error, release the writer and set it to null
            this.writer?.releaseLock();
            this.writer = null;
            throw error;
        }
    }
    // Internal: read continuously, split into lines, filter, and emit
    private async _readLoop() {
        console.log("⭐️ _readLoop started");

        if (!this.port?.readable) return;

        // 1️⃣ Pipe through TextDecoderStream → lineSplitter → getReader()
        let buffer = "";
        const splitter = new TransformStream<string,string>({
            transform(chunk, controller) {
                buffer += chunk;
                const lines = buffer.split("\n");
                buffer = lines.pop()!;            // leftover
                for (const line of lines) {
                    controller.enqueue(line);
                }
            },
            flush(controller) {
                if (buffer) controller.enqueue(buffer);
            }
        });
        const reader = this.port.readable
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(splitter)
            .getReader();
        this.reader = reader;
        let pendingStatusLine = "";

        try {
            while (this.keepReading) {
                const { value, done } = await reader.read();
                if (done) break;
                const trimmed = value.trim();
                if (trimmed) {
                    if (trimmed === "ok" && pendingStatusLine) {
                        // If we have a pending status line and received "ok", emit the combined line
                        this.dispatchTypedEvent("data", new CustomEvent("data", {
                            detail: `${pendingStatusLine}`
                        }));
                        pendingStatusLine = ""; // Reset the pending status line
                    } else if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
                        // If we have a pending status line, emit it first
                        if (pendingStatusLine) {
                            this.dispatchTypedEvent("data", new CustomEvent("data", {
                                detail: pendingStatusLine
                            }));
                        }
                        // Store the new status line
                        pendingStatusLine = trimmed;
                    } else {
                        // If we have a pending status line, emit it first
                        if (pendingStatusLine) {
                            this.dispatchTypedEvent("data", new CustomEvent("data", {
                                detail: pendingStatusLine
                            }));
                            pendingStatusLine = ""; // Reset the pending status line
                        }
                        // For any other line, emit it directly
                        this.dispatchTypedEvent("data", new CustomEvent("data", { detail: trimmed }));
                    }
                }
            }
        } catch (err) {
            console.error('Serial read error:', err);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.dispatchTypedEvent("error", new CustomEvent<string>(err.toString()));
        } finally {
            reader.releaseLock();
            this.dispatchTypedEvent("disconnect",new CustomEvent("disconnect"))
        }
    }
}
