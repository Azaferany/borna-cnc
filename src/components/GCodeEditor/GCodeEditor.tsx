import { useEffect, useRef, useState} from "react";
import AceEditor from 'react-ace';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import 'ace-builds/src-noconflict/mode-gcode';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import {useStore} from "../../app/store.ts";
import {OpenFileButton} from "../OpenFileButton/OpenFileButton.tsx";
import {addLineNumbers, cleanGCodeText, parseGCode} from "../../app/GcodeParserUtils.ts";
import {useShallow} from "zustand/react/shallow";

// Define G-code completions
const gcodeCompletions = [
  { name: 'G0', value: 'G0', caption: 'G0 - Rapid Move', meta: 'Movement' },
  { name: 'G1', value: 'G1', caption: 'G1 - Linear Move', meta: 'Movement' },
  { name: 'G2', value: 'G2', caption: 'G2 - Clockwise Arc', meta: 'Movement' },
  { name: 'G3', value: 'G3', caption: 'G3 - Counter-clockwise Arc', meta: 'Movement' },
  { name: 'G4', value: 'G4', caption: 'G4 - Dwell', meta: 'Control' },
  { name: 'G17', value: 'G17', caption: 'G17 - XY Plane Selection', meta: 'Plane' },
  { name: 'G18', value: 'G18', caption: 'G18 - XZ Plane Selection', meta: 'Plane' },
  { name: 'G19', value: 'G19', caption: 'G19 - YZ Plane Selection', meta: 'Plane' },
  { name: 'G20', value: 'G20', caption: 'G20 - Inches', meta: 'Units' },
  { name: 'G21', value: 'G21', caption: 'G21 - Millimeters', meta: 'Units' },
  { name: 'G28', value: 'G28', caption: 'G28 - Home', meta: 'Control' },
  { name: 'G90', value: 'G90', caption: 'G90 - Absolute Positioning', meta: 'Positioning' },
  { name: 'G91', value: 'G91', caption: 'G91 - Relative Positioning', meta: 'Positioning' },
  { name: 'M3', value: 'M3', caption: 'M3 - Spindle Clockwise', meta: 'Spindle' },
  { name: 'M4', value: 'M4', caption: 'M4 - Spindle Counter-clockwise', meta: 'Spindle' },
  { name: 'M5', value: 'M5', caption: 'M5 - Spindle Stop', meta: 'Spindle' },
  { name: 'M8', value: 'M8', caption: 'M8 - Coolant On', meta: 'Coolant' },
  { name: 'M9', value: 'M9', caption: 'M9 - Coolant Off', meta: 'Coolant' },
];

const axisCompletions = [

  { name: 'X', value: 'X', caption: 'X - X axis position', meta: 'Axis',score:6},
  { name: 'Y', value: 'Y', caption: 'Y - Y axis position', meta: 'Axis',score:5 },
  { name: 'Z', value: 'Z', caption: 'Z - Z axis position', meta: 'Axis',score:4 },
  { name: 'A', value: 'A', caption: 'A - A axis position', meta: 'Axis',score:3 },
  { name: 'B', value: 'B', caption: 'B - B axis position', meta: 'Axis',score:2 },
  { name: 'C', value: 'C', caption: 'C - C axis position', meta: 'Axis',score:1 },

];

const feedCompletions = [
  { name: 'F', value: 'F', caption: 'F - Feed rate', meta: 'Feed' },
];

const arcCompletions = [
  { name: 'I', value: 'I', caption: 'I - Arc center X offset', meta: 'Arc' },
  { name: 'J', value: 'J', caption: 'J - Arc center Y offset', meta: 'Arc' },
  { name: 'K', value: 'K', caption: 'K - Arc center Z offset', meta: 'Arc' },
];

const spindleCompletions = [
  { name: 'S', value: 'S', caption: 'S - Spindle speed', meta: 'Spindle' },
];

export const GCodeEditor = () => {
  const editorRef = useRef<AceEditor>(null);
  const [isHovered, setIsHovered] = useState(false);
  const loadToolPathGCodes = useStore(x => x.loadToolPathGCodes);
  const allGCodes = useStore(useShallow(x => x.allGCodes));
  const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
  const selectGCodeLine = useStore(x => x.selectGCodeLine);
  const toolPathGCodes = useStore(useShallow(x => x.toolPathGCodes));
  const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
  const activeModes = useStore(useShallow(x => x.activeModes));
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

  useEffect(() => {
    if (!editorRef?.current?.editor) return;

    // Set up completions using the editor's completer
    editorRef.current.editor.completers = [{
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getCompletions: function(editor: unknown, session: unknown, pos: unknown, prefix: string, callback: unknown) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const line = session.getLine(pos.row);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const linePrefix = line.substring(0, pos.column);

        // Check if we're after a line number (N1, N2, etc.)
        const hasLineNumber = /^N\d+\s*$/.test(linePrefix);
        if (hasLineNumber) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          callback(null, gcodeCompletions);
          return;
        }

        // Check for specific commands and their parameters
        const match = linePrefix.match(/(?:^|\s)(G\d+|M\d+)\s*$/);
        if (match) {
          const command = match[1];
          let completions = [];

          switch (command) {
            case 'G0':
              completions = axisCompletions;
              break;
            case 'G1':
              completions = [...axisCompletions, ...feedCompletions];
              break;
            case 'G2':
            case 'G3':
              completions = [...axisCompletions, ...feedCompletions, ...arcCompletions];
              break;
            case 'M3':
            case 'M4':
              completions = spindleCompletions;
              break;
            default:
              completions = gcodeCompletions;
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          callback(null, completions);
          return;
        }

        // Default to G-code completions

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        callback(null, gcodeCompletions);
      }
    }];

    // Enable autocompletion
    editorRef.current.editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true
    });
  }, []);

  const processGCode = (text: string) => {

    const cleanedLines = cleanGCodeText(text)
    const numberedLines = addLineNumbers(cleanedLines);

    const parsedCommands = parseGCode(numberedLines,{
      activeGCodeOffset:activeModes?.WorkCoordinateSystem ?? "G54",
      offsets:gCodeOffsets
    });

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

  const handleFind = () => {
    if (!editorRef.current?.editor) return;
    editorRef.current.editor.execCommand('find');
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
          <button
              onClick={handleFind}
              className="absolute top-2 right-4 z-20 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-1.5 py-1.5 rounded"
              disabled={isSending}
              title="Find (Ctrl+F)"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
          <AceEditor
              onCursorChange={(value) => {
                if (isSending)
                  return;
                const row = value.getCursor().row;
                selectGCodeLine(row + 1);
              }}
              ref={editorRef}
              highlightActiveLine={true}
              mode="gcode"
              value={allGCodes?.join('\n') ?? ""}
              onChange={value => {
                const newLines = value.split('\n');
                // Only update if the content actually changed
                if (JSON.stringify(newLines) !== JSON.stringify(allGCodes)) {
                  loadToolPathGCodes(newLines, toolPathGCodes ?? []);
                }
              }}
              onBlur={() => {
                const currentValue = editorRef?.current?.editor.getValue() ?? "";


                if (JSON.stringify(currentValue.split('\n')) !== JSON.stringify(toolPathGCodes?.map(x=>x.rawCommand))) {
                  processGCode(currentValue);
                }
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
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                fontSize: 13,
                tabSize: 2,
                lineHeight: 1.5,
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