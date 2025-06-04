import { useStore } from '../../app/store';
import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, HomeIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { useGRBL } from '../../app/useGRBL';

export const StatusDisplay = () => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const machineCoordinate = useStore(x => x.machineCoordinate);
    const workPlaceCoordinateOffset = useStore(x => x.workPlaceCoordinateOffset);
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const lastSentLine = useStore(x => x.lastSentLine);
    const availableBufferSlots = useStore(x => x.availableBufferSlots);
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const gCodeOffsets = useStore(x => x.gCodeOffsets);
    const { sendCommand } = useGRBL();

    const handleSetZero = async (axis: string) => {
        try {
            await sendCommand(`G92 ${axis}0`);
            await sendCommand(`$#`);
        } catch (error) {
            console.error('Error setting zero:', error);
        }
    };

    const handleReset = async (axis: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await sendCommand(`G92 ${axis}${gCodeOffsets.G92[axis.toLowerCase()]}`);
        } catch (error) {
            console.error('Error resetting offset:', error);
        }
    };

    const handleHome = async (axis: string) => {
        try {
            await sendCommand(`$H${axis}`);
        } catch (error) {
            console.error('Error homing axis:', error);
        }
    };

    const ZeroButton = ({ axis }: { axis: string }) => (
        <button
            onClick={() => handleSetZero(axis)}
            className="w-full px-1 py-1 mr-1 text-[10px] bg-blue-600 hover:bg-blue-700 active:bg-blue-900 text-white rounded transition-colors flex items-center justify-center gap-1"
            title={`Set ${axis} to zero`}
        >
            <ArrowUturnLeftIcon className="w-4 h-4 font-bold" />
            <span>Zero</span>
        </button>
    );

    const ResetButton = ({ axis }: { axis: string }) => (
        <button
            onClick={() => handleReset(axis)}
            className="w-full px-1 py-1 mr-1 text-[10px] bg-red-600 hover:bg-red-700 active:bg-red-900 text-white rounded transition-colors flex items-center justify-center gap-1"
            title={`Reset ${axis} offset`}
        >
            <ArrowPathIcon className="w-4 h-4 font-bold" />
            <span>Reset</span>
        </button>
    );

    const HomeButton = ({ axis }: { axis: string }) => (
        <button
            onClick={() => handleHome(axis)}
            className="w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1"
            title={`Home ${axis} axis`}
        >
            <HomeIcon className="w-4 h-4 font-bold" />
        </button>
    );

    const CoordRow = ({ axis, workOffset, machine }: { axis: string; workOffset: number; machine: number }) => (
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 py-1 border-b border-gray-700 items-center">
            <div className="font-bold text-gray-300 flex items-center justify-center gap-1">
                <HomeButton axis={axis} />
                {axis}

            </div>
            <div className="text-blue-400 flex items-center justify-center">{(-workOffset + machine).toFixed(3)}</div>
            <div className="text-green-400 flex items-center justify-center">{machine.toFixed(3)}</div>
            <div className="font-bold text-gray-300 flex gap-1">
                <ZeroButton axis={axis} />
                <ResetButton axis={axis} />
            </div>
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
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">Position</h2>
                <span className={`px-4 py-1.5 text-base font-bold rounded-full ${
                    status === 'Run' ? 'bg-green-500 text-white' :
                    status === 'Idle' ? 'bg-blue-500 text-white' :
                    status === 'Alarm' ? 'bg-red-500 text-white' :
                    status === 'Hold' ? 'bg-yellow-500 text-black' :
                    'bg-gray-500 text-white'
                }`}>
                    {status || 'Unknown'}
                </span>
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 mb-2 text-sm font-medium">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => handleHome('XYZ')}
                        className="w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1"
                        title={`Home all axis`}
                    >
                        <HomeIcon className="w-4 h-4" />
                    </button>
                    Axis


                </div>
                <div className="text-blue-400 text-xs flex items-center justify-center">Work (mm)</div>
                <div className="text-green-400 text-xs flex items-center justify-center">Machine(mm)</div>
                <div className="text-green-400 text-xs flex items-center justify-center text-center">Temporary Work Offset</div>
            </div>
            <div className="space-y-0">
                <CoordRow axis="X" workOffset={workPlaceCoordinateOffset?.x ?? 0} machine={machineCoordinate?.x ?? 0} />
                <CoordRow axis="Y" workOffset={workPlaceCoordinateOffset?.y ?? 0} machine={machineCoordinate?.y ??0} />
                <CoordRow axis="Z" workOffset={workPlaceCoordinateOffset?.z ?? 0} machine={machineCoordinate?.z ?? 0} />
            </div>

            {(isSending || status == "Run") && (
                <div className="text-xs text-gray-400 space-y-1 pt-2">
                    <div>
                        <button
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            className="w-full flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <span className="transition-transform duration-300">
                                {isDetailsOpen ? (
                                    <ChevronUpIcon className="w-4 h-4 font-bold" />
                                ) : (
                                    <ChevronDownIcon className="w-4 h-4 font-bold" />
                                )}
                            </span>
                            <span>Details</span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${
                                isDetailsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-2 mt-2 space-y-1">
                                    <InfoRow label="Last Sent Line" value={lastSentLine ?? "Not Sending"}/>
                                    <InfoRow label="Buffer Slots" value={availableBufferSlots}/>
                                    <InfoRow label="Selected Line" value={selectedGCodeLine ?? '-'}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};