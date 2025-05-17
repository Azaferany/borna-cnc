// src/utils/GRBLSerial.js
export default class GRBLSerial extends EventTarget {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    port: SerialPort | null = null;
    reader: ReadableStreamDefaultReader<string> | null = null;
    keepReading = false;
    baudRate: number;

    constructor({ baudRate = 115200 } = {}) {
        super();
        this.baudRate = baudRate;
        this.port = null;
        this.reader = null;
        this.keepReading = false;
    }

    // 1️⃣ Prompt user to select and open a serial port
    async connect() {
        if (!("serial" in navigator)) {
            throw new Error("Web Serial API not supported");
        }
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: this.baudRate });
            this.keepReading = true;
            this._readLoop();
            this.port.addEventListener("disconnect", () => {
                console.log("Disconnected");
                this.dispatchEvent(new CustomEvent("disconnect"));
            });
        } catch (error) {
            this.port = null;
            throw error;
        }
    }

    // 2️⃣ Close reader and port
    async disconnect() {
        this.keepReading = false;
        
        try {
            // First, stop the read loop and release the reader
            if (this.reader) {
                await this.reader.cancel();
                await new Promise(resolve => setTimeout(resolve, 100)); // Give time for cleanup
                this.reader = null;
            }

            // Then close the port
            if (this.port?.readable) {
                await this.port.readable.cancel();
            }
            
            if (this.port?.writable) {
                const writer = this.port.writable.getWriter();
                await writer.close();
                writer.releaseLock();
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }
        } catch (error: any) {
            console.error('Error during disconnect:', error);
            // Force reset of internal state even if there was an error
            this.reader = null;
            this.port = null;
            this.keepReading = false;
            throw error;
        }
    }

    // 3️⃣ Send a line (with newline) to GRBL
    async send(line: string) {
        if (!this.port?.writable) return;
        const writer = this.port.writable.getWriter();
        try {
            await writer.write(new TextEncoder().encode(line + "\n"));
        } finally {
            writer.releaseLock();
        }
    }

    // Internal: read continuously, split into lines, filter, and emit
    async _readLoop() {
        if (!this.port?.readable) return;

        try {
            const textStream = this.port.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TransformStream({
                    start() {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        this.buffer = "";
                    },
                    transform(chunk, controller) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        this.buffer += chunk;
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const lines = this.buffer.split(/\r?\n/);
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        this.buffer = lines.pop(); // hold incomplete
                        for (const line of lines) controller.enqueue(line);
                    },
                }));

            this.reader = textStream.getReader();

            try {
                while (this.keepReading && this.reader) {
                    const { value: raw, done } = await this.reader.read();
                    if (done) break;
                    const line = raw.trim();
                    // filter out GRBL handshakes and queries:
                    if (/^ok$/i.test(line) || line === "?") {
                        continue;
                    }
                    this.dispatchEvent(new CustomEvent("data", { detail: line }));
                }
            } finally {
                if (this.reader) {
                    await this.reader.cancel();
                    this.reader.releaseLock();
                    this.reader = null;
                }
            }
        } catch (error: any) {

            console.error('Error in read loop:', error);

            this.dispatchEvent(new CustomEvent("data", { detail: `Error: ${error?.message || 'Unknown error'}` }));
            this.dispatchEvent(new CustomEvent("data", { detail: `Error: ${error?.message || 'Unknown error'}` }));
        }
    }
}
