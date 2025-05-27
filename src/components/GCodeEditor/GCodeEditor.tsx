import { useEffect, useRef, useState} from "react";
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-gcode';
import 'ace-builds/src-noconflict/theme-monokai';
import {useStore} from "../../app/store.ts";
import {OpenFileButton} from "../OpenFileButton/OpenFileButton.tsx";
import {addLineNumbers, cleanGCodeText, parseGCode} from "../../app/GcodeParserUtils.ts";

export const GCodeEditor = () => {
  const editorRef = useRef<AceEditor>(null);
  const [isHovered, setIsHovered] = useState(false);
  const loadToolPathGCodes = useStore(x => x.loadToolPathGCodes);
  const allGCodes = useStore(x => x.allGCodes);
  const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
  const selectGCodeLine = useStore(x => x.selectGCodeLine);
  const toolPathGCodes = useStore(x => x.toolPathGCodes);
  const isSending = useStore(x => x.isSending);

  useEffect(() => {


/*
    editorRef.current.editor.session.addGutterDecoration(5,"gcode-line-highlight");
*/

    if (!editorRef?.current?.editor) return;

    const c = (editorRef?.current?.editor?.getCursorPosition()?.row??0) +1;
    if (selectedGCodeLine !== undefined && selectedGCodeLine >= 0 && c != selectedGCodeLine) {
      editorRef.current.editor.gotoLine(selectedGCodeLine, 0, true);

    }
  }, [selectedGCodeLine]);

  useEffect(() => {
    const handleFocus = () => {
      editorRef.current?.editor.focus();
    };

    window.addEventListener('focus', handleFocus);
    handleFocus(); // Also focus on initial mount

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);



  const processGcode = (text: string) => {

    const cleanedLines = cleanGCodeText(text)
    const numberedLines = addLineNumbers(cleanedLines);

    const parsedCommands = parseGCode(numberedLines);

    loadToolPathGCodes(numberedLines, parsedCommands)
  };

  const handleSave = () => {
    const gcode = editorRef.current?.editor.getValue() ?? "";
    const blob = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.gcode';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
      <div className="bg-gray-800 p-4 rounded-lg h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">G-code Editor</h2>
          <div className="space-x-2">
            <OpenFileButton />
            <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 active:bg-green-900 px-4 py-1.5 rounded"
            >
              Save File
            </button>
          </div>
        </div>
        <div className="relative flex-1 min-h-0">
          <AceEditor
              onCursorChange={(value) => {

                const row = value.getCursor().row;

                selectGCodeLine(row + 1);
              }}
              ref={editorRef}
              highlightActiveLine={true}
              mode="gcode"
              value={allGCodes?.join('\n') ?? ""}
              onChange={value =>{
                loadToolPathGCodes(value.split('\n').filter(x=>x != ""), toolPathGCodes ?? [])
              }}
              onBlur={() => {
                processGcode(editorRef?.current?.editor.getValue() ?? "")
              }}
              name="gcode-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="100%"
              setOptions={{
                showPrintMargin: false,
                showGutter: true,
                animatedScroll: true,
                selectionStyle:"line",
              }}

              className="rounded"
          />
          {/* Transparent Overlay that blocks interaction */}


          {isSending &&(
              <div 
                className="absolute inset-0 z-10 bg-transparent pointer-events-auto flex items-center justify-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isHovered && (
                  <div className="bg-gray-900 text-white px-4 py-2 rounded shadow-lg">
                    G-codes are locked while sending
                  </div>
                )}
              </div>
          )}

        </div>
      </div>
  );
};