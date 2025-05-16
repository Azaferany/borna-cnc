type Coordinates = {
    X: number;
    Y: number;
    Z: number;
};

type StatusType =
    | 'Idle'
    | 'Run'
    | 'Hold'
    | 'Alarm'
    | 'Home'
    | 'Door';
export const StatusDisplay = () => {
    const runningLine: number = 123;
    const feedrate: number = 1500;          // mm/min
    const spindleSpeed: number = 12000;     // RPM
    const status: StatusType = 'Idle';

    const workCoords: Coordinates = {
        X: 0,
        Y: 0,
        Z: 0,
    };

    const machineCoords: Coordinates = {
        X: 0,
        Y: 0,
        Z: 0,
    };

    const CoordRow = ({ axis, work, machine }: { axis: string; work: number; machine: number }) => (
        <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-700">
            <div className="font-bold text-gray-300">{axis}</div>
            <div className="text-blue-400">{work.toFixed(3)}</div>
            <div className="text-green-400">{machine.toFixed(3)}</div>
        </div>
    );
    const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex justify-between py-2 border-b border-gray-700">
            <div className="font-medium text-gray-300">{label}</div>
            <div className="text-gray-100">{value}</div>
        </div>
    );
    return (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <h2 className="text-xl font-bold">Position</h2>
            <div className="grid grid-cols-3 gap-4 mb-2 text-sm font-medium">
                <div>Axis</div>
                <div className="text-blue-400">Work (mm)</div>
                <div className="text-green-400">Machine (mm)</div>
            </div>
            <div className="space-y-1">
                <CoordRow axis="X" work={workCoords.X} machine={machineCoords.X} />
                <CoordRow axis="Y" work={workCoords.Y} machine={machineCoords.Y} />
                <CoordRow axis="Z" work={workCoords.Z} machine={machineCoords.Z} />
            </div>

            <h2 className="text-xl font-bold">Machine Info</h2>
            <div className="space-y-1">
                <InfoRow label="Running Line" value={runningLine} />
                <InfoRow label="Feedrate (mm/min)" value={feedrate.toFixed(0)} />
                <InfoRow label="Spindle Speed (RPM)" value={spindleSpeed.toFixed(0)} />
                <InfoRow label="Status" value={status} />
            </div>
        </div>
    );
};