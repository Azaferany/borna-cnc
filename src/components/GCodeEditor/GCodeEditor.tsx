import {useCallback, useEffect, useRef} from "react";
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-gcode';
import 'ace-builds/src-noconflict/theme-monokai';
import {type GCodeCommand, Plane, type Point3D} from "../../types/GCodeTypes.ts";
import {useStore} from "../../app/store.ts";
import {OpenFileButton} from "../OpenFileButton/OpenFileButton.tsx";

export const GCodeEditor = () => {
  const editorRef = useRef<AceEditor>(null);
  const {loadToolPathGCodes,allGCodes,selectedGCodeLine,selectGCodeLine,toolPathGCodes} = useStore();

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

  const parseGCode = useCallback((text: string): GCodeCommand[] => {
    const lines = text.split('\n');
    const parsedCommands: GCodeCommand[] = [];


    let currentPosition: Point3D = { x: 0, y: 0, z: 0 };
    let currentA = 0;
    let currentB = 0;
    let currentC = 0;

    let isIncrementalMode = false;
    let currentPlane : Plane = Plane.XY;
    // Process all lines
    lineLoop : for (let currentLine = 0; currentLine < lines.length; currentLine++) {
      const line = lines[currentLine];
      let trimmedLine = line.trim().toUpperCase();

      if (trimmedLine && !trimmedLine.startsWith(';')) {
        trimmedLine = trimmedLine.split(';')[0]
        const words = trimmedLine.split(/\s+/);
        const command: GCodeCommand = {
          isRapidMove:false,
          rawCommand: trimmedLine,
          lineNumber:currentLine,
          commandCode: words[1],
          isIncremental: isIncrementalMode,
          startPoint: { ...currentPosition },
          startA: currentA,
          startB: currentB,
          startC: currentC,
          activePlane: currentPlane,
        };

        let hasMove = false;
        let newX = currentPosition.x;
        let newY = currentPosition.y;
        let newZ = currentPosition.z;
        let newA = currentA;
        let newB = currentB;
        let newC = currentC;

        for (const word of words) {
          const code = word[0];
          const value = parseFloat(word.slice(1));
          if(!isNaN(value))
            switch (code) {
              case 'N':
                command.lineNumber = value;
                break;
              case 'G':
                if (value === 0) command.isRapidMove = true;
                else if (value === 1) command.isRapidMove = false;
                else if (value === 2 || value === 3) {
                  command.isArcMove = true;
                  command.isClockwise = value === 2;
                } else if (value === 17) {
                  command.activePlane = Plane.XY;
                  currentPlane = Plane.XY;
                }
                else if (value === 18) {
                  command.activePlane = Plane.XZ;
                  currentPlane = Plane.XZ;
                }
                else if (value === 19) {
                  command.activePlane = Plane.YZ;
                  currentPlane = Plane.YZ;
                }
                else if (value === 90) {
                  command.isIncremental = false
                  isIncrementalMode = false;
                } else if (value === 91) {
                  command.isIncremental = true
                  isIncrementalMode = true;
                }
                else {
                  continue lineLoop;
                }
                break;
              case 'X':
                newX = isIncrementalMode ? currentPosition.x + value : value;
                hasMove = true;
                break;
              case 'Y':
                newY = isIncrementalMode ? currentPosition.y + value : value;
                hasMove = true;
                break;
              case 'Z':
                newZ = isIncrementalMode ? currentPosition.z + value : value;
                hasMove = true;
                break;
              case 'A':
                newA = isIncrementalMode ? currentA + value : value;
                hasMove = true;
                break;
              case 'B':
                newB = isIncrementalMode ? currentB + value : value;
                hasMove = true;
                break;
              case 'C':
                newC = isIncrementalMode ? currentC + value : value;
                hasMove = true;
                break;
              case 'I':
                command.arcCenter = {x: value, y: 0, z: 0};
                break;
              case 'J':
                command.arcCenter = {x: 0, y: value, z: 0};
                break;
              case 'K':
                command.arcCenter = {x: 0, y: 0, z: value};
                break;
              case 'F':
                command.feedRate = value;
            }
        }

        if (hasMove) {
          command.endPoint = { x: newX, y: newY, z: newZ };
          command.endA = newA;
          command.endB = newB;
          command.endC = newC;
          parsedCommands.push(command as GCodeCommand);

          currentPosition = { x: newX, y: newY, z: newZ };
          currentA = newA;
          currentB = newB;
          currentC = newC;
        }
      }
    }

    return parsedCommands;
  }, []);

  const addLineNumbers = useCallback((text: string): string => {
    let currentNumber = 1;
    const increment = 1;

    return text
        .split('\n')
        .map((rawLine) => {
          const line = rawLine.trim();

          // If empty or comment line, leave it untouched
          if (line === '' || line.startsWith(';')) {
            return rawLine;
          }

          // Strip any existing line-number prefix (e.g. "N12 ")
          const withoutPrefix = rawLine.replace(/^\s*N\d+\s+/, '');

          // Prefix with the next unique number
          const numbered = `N${currentNumber} ${withoutPrefix}`;
          currentNumber += increment;
          return numbered;
        })
        .join('\n');
  }, []);
  const processGcode = (text: string) => {
    const cleanedText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n');
    const numberedText = addLineNumbers(cleanedText);

    const parsedCommands = parseGCode(numberedText);

    loadToolPathGCodes(numberedText.split('\n').filter(x=>!x.startsWith(";")),
        parsedCommands
            .filter(x=>x.commandCode?.includes('G')))
  };

  const handleSave = () => {
    //const blob = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
    //saveAs(blob, 'program.gcode');
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
              onChange={value =>loadToolPathGCodes(value.split('\n'), toolPathGCodes ?? [])}
              onBlur={() => {
                processGcode(editorRef?.current?.editor.getValue() ?? "")
              } }
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

          {/*
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto" />
*/}

        </div>
      </div>
  );
};