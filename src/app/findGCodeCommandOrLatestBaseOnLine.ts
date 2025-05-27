import type {GCodeCommand} from "../types/GCodeTypes.ts";

export const findGCodeCommandOrLatestBaseOnLine =
    (gCodeLine : number,toolPathGCodes:GCodeCommand[],) : GCodeCommand | undefined => {
        let toolPathGCodeCommand =
            toolPathGCodes.find(x=>x.lineNumber == gCodeLine)
        if(toolPathGCodeCommand)
            return toolPathGCodeCommand;
        const lastToolPathGCodeLine = toolPathGCodes.map(x=>x.lineNumber).filter(x=>x < gCodeLine)
            .reduce((max, num) => Math.max(max, num), -Infinity)

        toolPathGCodeCommand =
            toolPathGCodes.find(x=>x.lineNumber == lastToolPathGCodeLine)
        if(toolPathGCodeCommand)
            return toolPathGCodeCommand;

        return undefined;
    }
