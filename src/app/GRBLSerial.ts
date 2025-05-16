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
            throw new Error("Web Serial API not supported");                 // :contentReference[oaicite:0]{index=0}
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.port = await navigator.serial.requestPort();                 // :contentReference[oaicite:1]{index=1}
        await this.port.open({ baudRate: this.baudRate });                // :contentReference[oaicite:2]{index=2}
        this.keepReading = true;
        this._readLoop();
    }

    // 2️⃣ Close reader and port
    async disconnect() {
        this.keepReading = false;
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        if (this.port) {
            await this.port.close();                                        // :contentReference[oaicite:3]{index=3}
            this.port = null;
        }
    }

    // 3️⃣ Send a line (with newline) to GRBL
    async send(line : string) {
        if (!this.port?.writable) return;
        const writer = this.port.writable.getWriter();
        await writer.write(new TextEncoder().encode(line + "\n"));         // :contentReference[oaicite:4]{index=4}
        writer.releaseLock();
    }

    // Internal: read continuously, split into lines, filter, and emit
    async _readLoop() {
        const textStream = this.port.readable
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new TransformStream({
                start() {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this.buffer = ""; },
                transform(chunk, controller) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this.buffer += chunk;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const lines = this.buffer.split(/\r?\n/);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this.buffer = lines.pop();                                  // hold incomplete
                    for (const line of lines) controller.enqueue(line);
                },
            }));
        this.reader = textStream.getReader();

        while (this.keepReading) {
            const { value: raw, done } = await this.reader!.read();
            if (done) break;
            const line = raw.trim();
            // filter out GRBL handshakes and queries:
            if (/^ok$/i.test(line) || line === "?") {                      // :contentReference[oaicite:5]{index=5}
                continue;
            }
            this.dispatchEvent(new CustomEvent("data", { detail: line }));
        }
    }
}
