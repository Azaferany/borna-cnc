import {type GCodeCommand, type GCodeOffsets, Plane, type Point3D6Axis} from "../types/GCodeTypes.ts";

const INCH_TO_MM = 25.4;

const convertToMM = (value: number, isInches: boolean): number => {
    return isInches ? value * INCH_TO_MM : value;
};

export const parseGCode = (lines: string[],workSpaces: {offsets: GCodeOffsets,activeGCodeOffset: keyof GCodeOffsets} ): GCodeCommand[] => {
    const parsedCommands: GCodeCommand[] = [];

    let currentPosition: Omit<Point3D6Axis,"a"|"b"|"c"> & {a:number,b:number,c:number} =
        {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
            b: 0,
            c: 0
        };

    let currentFeedRate = 0;
    let currentWorkSpace:keyof GCodeOffsets= workSpaces?.activeGCodeOffset;
    let isIncrementalMode = false;
    let currentPlane : Plane = Plane.XY;
    let isInches = false;
    let isMachineCoordinates = false;

    // Process all lines
    for (let currentLine = 0; currentLine < lines.length; currentLine++) {

        const line = lines[currentLine];
        let trimmedLine = line.trim().toUpperCase();

        if (trimmedLine && !trimmedLine.startsWith(';')) {
            trimmedLine = trimmedLine.split(';')[0]
            const words = trimmedLine.split(/\s+/);
            const command: GCodeCommand = {
                feedRate:currentFeedRate,
                isRapidMove:false,
                rawCommand: trimmedLine,
                lineNumber:currentLine,
                commandCode: 'G01',
                isIncremental: isIncrementalMode,
                startPoint: { ...currentPosition },
                activePlane: currentPlane,
                activeWorkSpace: currentWorkSpace,
                hasMove: false
            };

            let hasMove = false;
            let newX: number | undefined  = undefined;
            let newY: number | undefined  = undefined;
            let newZ: number | undefined  = undefined;
            let newA: number | undefined  = undefined;
            let newB: number | undefined  = undefined;
            let newC: number | undefined  = undefined;

            for (const word of words) {
                const code = word[0];
                const value = parseFloat(word.slice(1));
                if(!isNaN(value))
                    switch (code) {
                        case 'N':
                            command.lineNumber = value;
                            break;
                        case 'G':
                            command.commandCode = word;
                            if (value === 0) command.isRapidMove = true;
                            else if (value === 1) command.isRapidMove = false;
                            else if (value === 2 || value === 3) {
                                command.isArcMove = true;
                                command.isClockwise = value === 2;
                                hasMove=true;
                            } else if (value === 4) {
                                // Dwell - handled by command code
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
                            else if (value === 20) {
                                isInches = true;
                            }
                            else if (value === 21) {
                                isInches = false;
                            }
                            else if (value === 28 ) {
                                command.isRapidMove = true;
                                hasMove = true;

                                newX = workSpaces.offsets.G28.x;
                                newY = workSpaces.offsets.G28.y;
                                newZ = workSpaces.offsets.G28.z;
                                if(workSpaces.offsets.G28.a)
                                    newA = workSpaces.offsets.G28.a;
                                if(workSpaces.offsets.G28.b)
                                    newB = workSpaces.offsets.G28.b;
                                if(workSpaces.offsets.G28.c)
                                    newC = workSpaces.offsets.G28.c;
                            }
                            else if (value === 30 ) {
                                // Home position - handled by command code
                                command.isRapidMove = true;
                                hasMove = true;

                                newX = workSpaces.offsets.G30.x;
                                newY = workSpaces.offsets.G30.y;
                                newZ = workSpaces.offsets.G30.z;
                                if(workSpaces.offsets.G30.a)
                                    newA = workSpaces.offsets.G30.a;
                                if(workSpaces.offsets.G30.b)
                                    newB = workSpaces.offsets.G30.b;
                                if(workSpaces.offsets.G30.c)
                                    newC = workSpaces.offsets.G30.c;                            }
                            else if (value === 53) {
                                isMachineCoordinates = true;
                            }
                            else if (value === 54) {
                                command.activeWorkSpace = "G54"
                                currentWorkSpace = "G54";
                                isMachineCoordinates = false;
                            }
                            else if (value === 55) {
                                command.activeWorkSpace = "G55"
                                currentWorkSpace = "G55";
                                isMachineCoordinates = false;
                            }
                            else if (value === 56) {
                                command.activeWorkSpace = "G56"
                                currentWorkSpace = "G56";
                                isMachineCoordinates = false;
                            }
                            else if (value === 57) {
                                command.activeWorkSpace = "G57"
                                currentWorkSpace = "G57";
                                isMachineCoordinates = false;
                            }
                            else if (value === 58) {
                                command.activeWorkSpace = "G58"
                                currentWorkSpace = "G58";
                                isMachineCoordinates = false;
                            }
                            else if (value === 59) {
                                command.activeWorkSpace = "G59"
                                currentWorkSpace = "G59";
                                isMachineCoordinates = false;
                            }
                            else if (value === 90) {
                                command.isIncremental = false
                                isIncrementalMode = false;
                            } else if (value === 91) {
                                command.isIncremental = true
                                isIncrementalMode = true;
                            }
                            break;
                        case 'M':
                            command.commandCode = word;
                            // Handle M codes (M0-M9)
                            if (value >= 0 && value <= 9) {
                                // M codes are handled by command code
                            }
                            break;
                        case 'T':
                            command.commandCode = word;
                            break;
                        case 'X':
                            newX = isIncrementalMode ? currentPosition.x + convertToMM(value, isInches) : convertToMM(value, isInches);
                            hasMove = true;
                            break;
                        case 'Y':
                            newY = isIncrementalMode ? currentPosition.y + convertToMM(value, isInches) : convertToMM(value, isInches);
                            hasMove = true;
                            break;
                        case 'Z':
                            newZ = isIncrementalMode ? currentPosition.z + convertToMM(value, isInches) : convertToMM(value, isInches);
                            hasMove = true;
                            break;
                        case 'A':
                            newA = isIncrementalMode ? currentPosition.a + value : value;
                            hasMove = true;
                            break;
                        case 'B':
                            newB = isIncrementalMode ? currentPosition.b + value : value;
                            hasMove = true;
                            break;
                        case 'C':
                            newC = isIncrementalMode ? currentPosition.c + value : value;
                            hasMove = true;
                            break;
                        case 'I':
                            command.arcCenter = {
                                x: convertToMM(value, isInches) + command.startPoint.x,
                                y: command.arcCenter?.y ?? command.startPoint.y ?? 0,
                                z: command.arcCenter?.z ?? command.startPoint.z ?? 0
                            };
                            hasMove = true;
                            break;
                        case 'J':
                            command.arcCenter = {
                                x: command.arcCenter?.x ?? command.startPoint.x ?? 0,
                                y: convertToMM(value, isInches) + command.startPoint.y,
                                z: command.arcCenter?.z ?? command.startPoint.z ?? 0
                            };
                            hasMove = true;
                            break;
                        case 'K':
                            command.arcCenter = {
                                x: command.arcCenter?.x ?? command.startPoint.x ?? 0,
                                y: command.arcCenter?.y ?? command.startPoint.y ?? 0,
                                z: convertToMM(value, isInches) + command.startPoint.z
                            };
                            hasMove = true;
                            break;
                        case 'F':
                            command.feedRate = convertToMM(value, isInches);
                            if(value > 0) currentFeedRate = convertToMM(value, isInches);
                            break;
                        case 'P':
                            // Dwell time for G4
                            if (command.commandCode === 'G4') {
                                command.dwellTime = value;
                            }
                            break;
                    }
            }

            command.hasMove = hasMove;
            if (hasMove) {
                // Convert to machine coordinates if needed
                if (!isMachineCoordinates) {
                    command.endPoint = {
                        x: newX !== undefined? newX + workSpaces.offsets[command.activeWorkSpace].x : command.startPoint.x,
                        y: newY !== undefined? newY + workSpaces.offsets[command.activeWorkSpace].y : command.startPoint.y,
                        z: newZ !== undefined? newZ + workSpaces.offsets[command.activeWorkSpace].z : command.startPoint.z,

                        a: newA !== undefined? newA + (workSpaces.offsets[command.activeWorkSpace].a ?? 0) : command.startPoint.a,
                        b: newB !== undefined? newB + (workSpaces.offsets[command.activeWorkSpace].b ?? 0) : command.startPoint.b,
                        c: newC !== undefined? newC + (workSpaces.offsets[command.activeWorkSpace].c ?? 0) : command.startPoint.c
                    };

                } else {
                    command.endPoint = {
                        x: newX !== undefined ? newX : command.startPoint.x,
                        y: newY !== undefined ? newY : command.startPoint.y,
                        z: newZ !== undefined ? newZ : command.startPoint.z,
                        a: newA !== undefined ? newA : command.startPoint.a,
                        b: newB !== undefined ? newB : command.startPoint.b,
                        c: newC !== undefined ? newC : command.startPoint.c,
                    };
                }

                parsedCommands.push(command as GCodeCommand);

                currentPosition = command.endPoint;
            } else {
                // Add non-movement commands
                parsedCommands.push(command as GCodeCommand);
            }
        }
    }

    return parsedCommands;
};

export const addLineNumbers = (lines: string[]): string[] => {
    let currentNumber = 1;
    const increment = 1;

    return lines
        .map((rawLine) => {
            const line = rawLine.trim();

            // If empty or comment line, leave it untouched
            if (line === '' || line.startsWith(';')) {
                return rawLine;
            }

            // Strip any existing line-number prefix (e.g. "N12 ")
            const withoutPrefix = rawLine.replace(/^\s*[Nn]\d+\s+/, '');

            // Prefix with the next unique number
            const numbered = `N${currentNumber} ${withoutPrefix}`;
            currentNumber += increment;
            return numbered;
        });
}
export const cleanGCodeText = (text: string): string[] => {
    // Split into lines and trim each line
    const lines = text.split('\n').map(line => {
        // Remove comments (everything after and including ;)
        const commentIndex = line.indexOf(';');
        const lineWithoutComments = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();
        // Remove N part (line number)
        return lineWithoutComments.replace(/^N\d+\s*/, '').trim();
    });

    const cleanedLines: string[] = [];
    let lastLineComand = "G0";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === '') {
            continue;
        }

        // Split the line into words
        const words = line.split(/\s+/).map(x=>x.toUpperCase());
        const commandWords: string[] = [];

        // Process each word
        for (const word of words) {
            // Skip empty words
            if (!word) continue;

            // Check if it's a G/M/T command
            if (/^[GMT]/.test(word)) {
                commandWords.push(word);
            }
        }
        if(commandWords.find(x=>x === "G0" || x === "G00" || x==="G1" || x==="G01" || x==="G02" || x==="G2" || x==="G03" || x==="G3")) {
            lastLineComand = commandWords.slice().reverse().find(x=>x === "G0" || x === "G00" || x==="G1" || x==="G01" || x==="G02" || x==="G2" || x==="G03" || x==="G3")!
        }
        // If we have commands, create separate lines for each
        if (commandWords.length > 1) {
            if(commandWords[0] ==="G53")
            {
                cleanedLines.push(line);
                continue;
            }
            for (const command of commandWords) {
                const commandIndex = words.findIndex(x=>x === command);
                const nextCommandIndex = words.findIndex(x=>x === commandWords[commandWords.findIndex(x=>x === command) + 1]);
                const gcodeWords = words.slice(commandIndex, nextCommandIndex);

                if(gcodeWords.length === 1) {
                    cleanedLines.push(gcodeWords.join(" "));
                } else {
                    if (!['G00', 'G01', 'G02', 'G03', 'G53',"G0","G1","G2","G3"].includes(command)) {
                        // Check if it's a coordinate word
                        cleanedLines.push(command);
                        if(gcodeWords.slice(1).length > 0)
                            cleanedLines.push(`${lastLineComand} ${gcodeWords.slice(1).join(" ")}`);
                    } else {
                        cleanedLines.push(gcodeWords.join(" "));
                    }
                }
            }
        } else if(commandWords.length == 1) {
            // If no commands found, keep the original line
            cleanedLines.push(words.join(" "));
        }
        else if (commandWords.length == 0) {

            if(words.find(x=>x.includes("X") || x.includes("Y") || x.includes("Z") || x.includes("A") || x.includes("B") || x.includes("C")))
                cleanedLines.push(`${lastLineComand} ${words.join(" ")}`);
            else
                cleanedLines.push(words.join(" "));

        }
    }

    return cleanedLines;
}
export function extractLineNumber(gcodeLine : string) {
    // Use a regex to match an 'N' at the beginning of the line,
    // followed by one or more digits, capturing just the digits.
    const match = gcodeLine.match(/^N(\d+)/);

    // If there was no match, return null.
    if (!match) {
        return null;
    }

    // match[1] contains the digits after 'N'. Convert to a Number and return.
    return Number(match[1]);
}
