import React from "react";
import {useTranslation} from 'react-i18next';
import {useStore} from "../../app/store.ts";
import {addLineNumbers, cleanGCodeText, parseGCode} from "../../app/GcodeParserUtils.ts";
import {useShallow} from "zustand/react/shallow";

interface OpenFileButtonProps {
    className?: string;
}

export const OpenFileButton: React.FC<OpenFileButtonProps> = ({ className }) => {
    const {t} = useTranslation();
    const loadToolPathGCodes = useStore(state => state.loadToolPathGCodes);
    const isSending = useStore(state => state.isSending);
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const activeModes = useStore(useShallow(x => x.activeModes));



    const processGCode = (text: string) => {
        const cleanedLines = cleanGCodeText(text)
        const numberedLines = addLineNumbers(cleanedLines);

        const parsedCommands = parseGCode(numberedLines,{
            activeGCodeOffset:activeModes?.WorkCoordinateSystem ?? "G54",
            offsets:gCodeOffsets
        });
        loadToolPathGCodes(numberedLines, parsedCommands)
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            event.target.value = "";
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    processGCode(text);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <label className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-900 px-4 py-1.5 rounded cursor-pointer inline-block ${className} ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {t('gcode.openFile')}
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