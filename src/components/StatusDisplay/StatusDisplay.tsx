import { useStore } from '../../app/store';
import { useState, memo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, HomeIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { useGRBL } from '../../app/useGRBL';
import { Plane } from '../../types/GCodeTypes';
import { UnitDisplay } from '../UnitDisplay/UnitDisplay';
import {useShallow} from "zustand/react/shallow";


const CoordRow = memo(({
                           axis,
                           workOffset,
                           machine,
                           onSetZero,
                           onReset,
                           onHome,
                           isConnected,
                           g92Offset,
                           isSending,
                           status
                       }: {
    axis: string; 
    workOffset: number; 
    machine: number;
    onSetZero: (axis: string) => void;
    onReset: (axis: string) => void;
    onHome: (axis: string) => void;
    isConnected: boolean;
    g92Offset: number;
    isSending: boolean;
    status: string;
}) => (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 py-1 border-b border-gray-700 items-center">
        <div className="font-bold text-gray-300 flex items-center justify-center gap-1">
            <button
                onClick={() => onHome(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Home ${axis} axis`}
                disabled={!isConnected || isSending || status !== 'Idle'}
            >
                <HomeIcon className="w-4 h-4 font-bold" />
            </button>
            {axis}
        </div>
        <div className="text-blue-400 flex items-center justify-center">{(-workOffset + machine).toFixed(3)}</div>
        <div className="text-green-400 flex items-center justify-center">{machine.toFixed(3)}</div>
        <div className="font-bold text-gray-300 flex gap-1">
            <button
                onClick={() => onSetZero(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-blue-600 hover:bg-blue-700 active:bg-blue-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Set ${axis} to zero`}
                disabled={!isConnected || isSending || status !== 'Idle'}
            >
                <span>Zero</span>
                <ArrowUturnLeftIcon className="w-4 h-4 font-bold" />

            </button>
            <button
                onClick={() => onReset(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-red-600 hover:bg-red-700 active:bg-red-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle' || g92Offset === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Reset ${axis} offset`}
                disabled={!isConnected || isSending || status !== 'Idle' || g92Offset === 0}
            >
                <span>Reset</span>
                <ArrowPathIcon className="w-4 h-4 font-bold" />

            </button>
        </div>
    </div>
));

export const StatusDisplay = () => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const workPlaceCoordinateOffset = useStore(useShallow(x => x.workPlaceCoordinateOffset));
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const lastSentLine = useStore(x => x.lastSentLine);
    const availableBufferSlots = useStore(x => x.availableBufferSlots);
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const activeModes = useStore(useShallow(x => x.activeModes));
    const {sendCommand, isConnected} = useGRBL();

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
            await sendCommand(`$H${axis === "XYZ" ? "" : axis}`);
        } catch (error) {
            console.error('Error homing axis:', error);
        }
    };

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
                        title={`Home all axis`}
                        className={`w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isConnected || isSending || status !== 'Idle'}
                    >
                        <HomeIcon className="w-4 h-4" />
                    </button>
                    Axis
                </div>
                <div className="text-blue-400 text-xs flex items-center justify-center">
                    Work (<UnitDisplay/>)
                </div>
                <div className="text-green-400 text-xs flex items-center justify-center">
                    Machine (<UnitDisplay/>)
                </div>
                <div className="text-green-400 text-xs flex items-center justify-center text-center">Temporary Work Offset</div>
            </div>
            <div className="space-y-0">
                <CoordRow 
                    axis="X" 
                    workOffset={workPlaceCoordinateOffset?.x ?? 0} 
                    machine={machineCoordinate?.x ?? 0} 
                    onSetZero={handleSetZero}
                    onReset={handleReset}
                    onHome={handleHome}
                    isConnected={isConnected}
                    g92Offset={gCodeOffsets.G92.x}
                    isSending={isSending}
                    status={status}
                />
                <CoordRow 
                    axis="Y" 
                    workOffset={workPlaceCoordinateOffset?.y ?? 0} 
                    machine={machineCoordinate?.y ?? 0} 
                    onSetZero={handleSetZero}
                    onReset={handleReset}
                    onHome={handleHome}
                    isConnected={isConnected}
                    g92Offset={gCodeOffsets.G92.y}
                    isSending={isSending}
                    status={status}
                />
                <CoordRow 
                    axis="Z" 
                    workOffset={workPlaceCoordinateOffset?.z ?? 0} 
                    machine={machineCoordinate?.z ?? 0} 
                    onSetZero={handleSetZero}
                    onReset={handleReset}
                    onHome={handleHome}
                    isConnected={isConnected}
                    g92Offset={gCodeOffsets.G92.z}
                    isSending={isSending}
                    status={status}
                />
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
            {activeModes && (
                <div className="space-y-2">
                    <h2 className="text-xl font-bold mb-4">Active Modes :</h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                            Work Coordinate System: {activeModes.WorkCoordinateSystem}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                            Arc Plane: {activeModes.Plane === Plane.XY ? 'XY Plane' : activeModes.Plane === Plane.XZ ? 'XZ Plane' : 'YZ Plane'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                            Units Type: {activeModes.UnitsType}
                        </span>
                        <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
                            Positioning Mode: {activeModes.PositioningMode}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};