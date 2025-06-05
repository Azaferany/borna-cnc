import {type GCodeCommand, type GCodeOffsets, Plane, type Point3D6Axis} from "../types/GCodeTypes.ts";

export const parseGCode = (lines: string[],workSpaces: {offsets: GCodeOffsets,activeGCodeOffset: keyof GCodeOffsets} ): GCodeCommand[] => {
    const parsedCommands: GCodeCommand[] = [];

    let currentPosition: Omit<Point3D6Axis,"a"|"b"|"c"> & {a:number,b:number,c:number} =
        {
            x: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].x : 0,
            y: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].y : 0,
            z: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].z : 0,
            a: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].a ?? 0 : 0,
            b: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].b ?? 0 : 0,
            c: workSpaces  ? workSpaces.offsets[workSpaces.activeGCodeOffset].c ?? 0 : 0
        };

    let currentFeedRate = 0;
    let currentworkSpace:keyof GCodeOffsets= workSpaces?.activeGCodeOffset;
    let isIncrementalMode = false;
    let currentPlane : Plane = Plane.XY;
    let isMachineCoordinates = false;
    let isInches = false;

    // Process all lines
    lineLoop : for (let currentLine = 0; currentLine < lines.length; currentLine++) {
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
                activeWorkSpace: currentworkSpace,
            };

            let hasMove = false;
            let newX = currentPosition.x;
            let newY = currentPosition.y;
            let newZ = currentPosition.z;
            let newA = currentPosition.a;
            let newB = currentPosition.b;
            let newC = currentPosition.c;

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
                            else if (value === 28 || value === 30) {
                                // Home position - handled by command code
                            }
                            else if (value === 53) {
                                isMachineCoordinates = true;
                            }
                            else if (value === 54) {
                                command.activeWorkSpace = "G54"
                                currentworkSpace = "G54";
                                isMachineCoordinates = false;
                            }
                            else if (value === 55) {
                                command.activeWorkSpace = "G55"
                                currentworkSpace = "G55";
                                isMachineCoordinates = false;
                            }
                            else if (value === 56) {
                                command.activeWorkSpace = "G56"
                                currentworkSpace = "G56";
                                isMachineCoordinates = false;
                            }
                            else if (value === 57) {
                                command.activeWorkSpace = "G57"
                                currentworkSpace = "G57";
                                isMachineCoordinates = false;
                            }
                            else if (value === 58) {
                                command.activeWorkSpace = "G58"
                                currentworkSpace = "G58";
                                isMachineCoordinates = false;
                            }
                            else if (value === 59) {
                                command.activeWorkSpace = "G59"
                                currentworkSpace = "G59";
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
                            command.arcCenter = {x: value+ command.startPoint.x , y : command.arcCenter?.y ?? command.startPoint.y ?? 0, z : command.arcCenter?.z  ?? command.startPoint.z ?? 0};
                            hasMove = true;
                            break;
                        case 'J':
                            command.arcCenter = {x: command.arcCenter?.x  ?? command.startPoint.x ?? 0  , y : value  + command.startPoint.y, z : command.arcCenter?.z  ?? command.startPoint.z ?? 0};
                            hasMove = true;
                            break;
                        case 'K':
                            command.arcCenter = {x: command.arcCenter?.x  ?? command.startPoint.x ?? 0 , y : command.arcCenter?.y  ?? command.startPoint.y ?? 0, z : value+ command.startPoint.z};
                            hasMove = true;
                            break;
                        case 'F':
                            command.feedRate = value;
                            if(value > 0) currentFeedRate = value;
                            break;
                        case 'P':
                            // Dwell time for G4
                            if (command.commandCode === 'G4') {
                                command.dwellTime = value;
                            }
                            break;
                    }
            }

            if (hasMove) {
                // Convert to machine coordinates if needed
                if (!isMachineCoordinates) {
                    command.endPoint = { 
                        x: newX - workSpaces.offsets[command.activeWorkSpace].x, 
                        y: newY - workSpaces.offsets[command.activeWorkSpace].y, 
                        z: newZ - workSpaces.offsets[command.activeWorkSpace].z, 
                        a: newA - (workSpaces.offsets[command.activeWorkSpace].a ?? 0), 
                        b: newB - (workSpaces.offsets[command.activeWorkSpace].b ?? 0), 
                        c: newC - (workSpaces.offsets[command.activeWorkSpace].c ?? 0) 
                    };
                } else {
                    command.endPoint = { x: newX, y: newY, z: newZ, a: newA, b: newB, c: newC };
                }
                parsedCommands.push(command as GCodeCommand);

                currentPosition = { x: newX, y: newY, z: newZ, a: newA, b: newB, c: newC };
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
        return commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();
    });
    
    const cleanedLines: string[] = [];
    
    for (const line of lines) {
        // Skip empty lines
        if (line === '') {
            continue;
        }
        
        // Split the line into words
        const words = line.split(/\s+/);
        const processedWords: string[] = [];
        
        for (const word of words) {
            // Skip empty words
            if (!word) continue;
            
            // Handle G53 specially - keep it with the next word
            if (word === 'G53' && words.length > 1) {
                const nextWord = words[words.indexOf(word) + 1];
                if (nextWord) {
                    processedWords.push(`${word} ${nextWord}`);
                    continue;
                }
            }
            
            // Add the word to processed words
            processedWords.push(word);
        }
        
        // Add each processed word as a separate line
        cleanedLines.push(...processedWords);
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
