import React from "react";
import {useStore} from "../../app/store.ts";
import {addLineNumbers, cleanGCodeText, parseGCode} from "../../app/GcodeParserUtils.ts";

interface OpenFileButtonProps {
    className?: string;
}

export const OpenFileButton: React.FC<OpenFileButtonProps> = ({ className }) => {
    const loadToolPathGCodes = useStore(state => state.loadToolPathGCodes);
    const isSending = useStore(state => state.isSending);




    const processGcode = (text: string) => {
        const cleanedLines = cleanGCodeText(text)
        const numberedLines = addLineNumbers(cleanedLines);

        const parsedCommands = parseGCode(numberedLines);

        loadToolPathGCodes(numberedLines, parsedCommands)
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    processGcode(text);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <label className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-900 px-4 py-1.5 rounded cursor-pointer inline-block ${className} ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            Open File
            <input
                type="file"
                accept=".gcode,.nc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isSending}
            />
        </label>
    );
}; 