import { useStore } from '../../app/store';

export const StatusDisplay = () => {
    const machineCoordinate = useStore(x => x.machineCoordinate);
    const workPlaceCoordinateOffset = useStore(x => x.workPlaceCoordinateOffset);
    const feedrate = useStore(x => x.feedrate);
    const spindleSpeed = useStore(x => x.spindleSpeed);
    const status = useStore(x => x.status);

    // Set up polling interval


    const CoordRow = ({ axis, workOffset, machine }: { axis: string; workOffset: number; machine: number }) => (
        <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-700">
            <div className="font-bold text-gray-300">{axis}</div>
            <div className="text-blue-400">{(workOffset + machine).toFixed(3)}</div>
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
                <CoordRow axis="X" workOffset={workPlaceCoordinateOffset?.x ?? 0} machine={machineCoordinate?.x ?? 0} />
                <CoordRow axis="Y" workOffset={workPlaceCoordinateOffset?.y ?? 0} machine={machineCoordinate?.y ??0} />
                <CoordRow axis="Z" workOffset={workPlaceCoordinateOffset?.z ?? 0} machine={machineCoordinate?.z ?? 0} />
            </div>

            <h2 className="text-xl font-bold">Machine Info</h2>
            <div className="space-y-1">
                <InfoRow label="Feedrate (mm/min)" value={feedrate.toFixed(0)} />
                <InfoRow label="Spindle Speed (RPM)" value={spindleSpeed.toFixed(0)} />
                <InfoRow label="Status" value={status} />
            </div>
        </div>
    );
};