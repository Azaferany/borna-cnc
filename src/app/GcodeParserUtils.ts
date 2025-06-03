import {type GCodeCommand, Plane, type Point3D} from "../types/GCodeTypes.ts";

export const parseGCode = (lines: string[]): GCodeCommand[] => {
    const parsedCommands: GCodeCommand[] = [];


    let currentPosition: Point3D = { x: 0, y: 0, z: 0 };
    let currentA = 0;
    let currentB = 0;
    let currentC = 0;
    let currentFeedRate = 0;

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
                feedRate:currentFeedRate,
                isRapidMove:false,
                rawCommand: trimmedLine,
                lineNumber:currentLine,
                commandCode: 'G01',
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
                            command.commandCode = word;
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
                        case 'M':
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
export const cleanGCodeText = (text: string) : string[] => {

    const cleanedLines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .filter(x=>!x.startsWith(";"));

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
