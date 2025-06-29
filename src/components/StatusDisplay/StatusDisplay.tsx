import { useStore } from '../../app/store';
import React, {useState, memo} from 'react';
import {useTranslation} from 'react-i18next';
import {
    ChevronUpIcon,
    ChevronDownIcon,
    HomeIcon,
    ArrowUturnUpIcon,
    MapPinIcon,
    PencilIcon
} from '@heroicons/react/24/solid';
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
                           status,
                           onUpdateRelative
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
    onUpdateRelative: (axis: string, newValue: number) => void;
}) => {
    const {t} = useTranslation();
    const currentRelative = -workOffset + machine;
    const [inputValue, setInputValue] = useState(currentRelative.toFixed(3));
    const [isEditing, setIsEditing] = useState(false);

    const handleFocus = () => {
        setIsEditing(true);
        setInputValue(currentRelative.toFixed(3));
    };

    const handleBlur = () => {
        setIsEditing(false);
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue) && newValue !== currentRelative) {
            onUpdateRelative(axis, newValue);
        } else {
            setInputValue(currentRelative.toFixed(3));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    // Update input value when relative position changes externally
    React.useEffect(() => {
        if (!isEditing) {
            setInputValue(currentRelative.toFixed(3));
        }
    }, [currentRelative, isEditing]);

    return (
        <div className="grid grid-cols-[auto_1.5fr_1fr_auto] gap-0.5 py-1 border-b border-gray-700 items-center">
        <div className="font-bold text-gray-300 flex items-center justify-center gap-1">
            <button
                onClick={() => onHome(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={t('status.homeAxisTooltip', {axis})}
                disabled={!isConnected || isSending || status !== 'Idle'}
                data-tour="home-buttons"
            >
                <HomeIcon className="w-4 h-4 font-bold" />
            </button>
            {axis}
        </div>
            <div className="text-blue-400 flex items-center justify-center relative">
                <input
                    type="number"
                    step="0.001"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={!isConnected || isSending || status !== 'Idle'}
                    className={`w-full bg-transparent text-center border-0 outline-none text-blue-400 pr-3 ${
                        (!isConnected || isSending || status !== 'Idle')
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-gray-700 focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 rounded px-1'
                    }`}
                    title={t('status.relativePositionTooltip', {axis})}
                />
                <PencilIcon
                    className={`absolute right-0 w-3 h-3 pointer-events-none ${
                        (!isConnected || isSending || status !== 'Idle')
                            ? 'opacity-30'
                            : 'opacity-60'
                    }`}
                />
            </div>
        <div className="text-green-400 flex items-center justify-center">{machine.toFixed(3)}</div>
        <div className="font-bold text-gray-300 flex gap-1">
            <button
                onClick={() => onSetZero(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-blue-600 hover:bg-blue-700 active:bg-blue-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={t('status.setZeroTooltip', {axis})}
                disabled={!isConnected || isSending || status !== 'Idle'}
                data-tour="zero-buttons"
            >
                <span>{t('status.zero')}</span>
                <MapPinIcon className="w-4 h-4 font-bold"/>

            </button>
            <button
                onClick={() => onReset(axis)}
                className={`w-full px-1 py-1 mr-1 text-[10px] bg-red-600 hover:bg-red-700 active:bg-red-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle' || g92Offset === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={t('status.resetOffsetTooltip', {axis})}
                disabled={!isConnected || isSending || status !== 'Idle' || g92Offset === 0}
                data-tour="reset-buttons"
            >
                <span>{t('status.reset')}</span>
                <ArrowUturnUpIcon className="w-4 h-4 font-bold"/>

            </button>
        </div>
    </div>
    );
});

export const StatusDisplay = () => {
    const {t} = useTranslation();
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [isActiveModesOpen, setIsActiveModesOpen] = useState(false);
    const machineCoordinate = useStore(useShallow(x => x.machineCoordinate));
    const workPlaceCoordinateOffset = useStore(useShallow(x => x.workPlaceCoordinateOffset));
    const machineConfig = useStore(useShallow(x => x.machineConfig));
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const lastSentLine = useStore(x => x.lastSentLine);
    const availableBufferSlots = useStore(x => x.availableBufferSlots);
    const selectedGCodeLine = useStore(x => x.selectedGCodeLine);
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const activeModes = useStore(useShallow(x => x.activeModes));
    const {sendCommand, isConnected} = useGRBL();

    const handleUpdateRelative = async (axis: string, newRelativeValue: number) => {
        try {
            // Send G92 command to set the current machine position to the new relative value
            await sendCommand(`G92 ${axis}${newRelativeValue.toFixed(3)}`);
            await sendCommand(`$#`);
        } catch (error) {
            console.error('Error updating relative position:', error);
        }
    };

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
            await sendCommand(`G92 ${axis}${machineCoordinate[axis.toLowerCase()] - workPlaceCoordinateOffset[axis.toLowerCase()] + gCodeOffsets.G92[axis.toLowerCase()]}`);
        } catch (error) {
            console.error('Error resetting offset:', error);
        }
    };

    const handleHome = async (axis: string) => {
        try {
            await sendCommand(`$H${axis.length != 1 ? "" : axis}`);
        } catch (error) {
            console.error('Error homing axis:', error);
        }
    };

    const handleSetZeroAll = async () => {
        try {
            const activeAxesStr = getActiveAxesString();
            await sendCommand(`G92 ${activeAxesStr}`);
            await sendCommand('$#');
        } catch (error) {
            console.error('Error setting zero for all axes:', error);
        }
    };

    const handleResetAll = async () => {
        try {
            await sendCommand(`G92.1`);
        } catch (error) {
            console.error('Error resetting all offsets:', error);
        }
    };

    const getActiveAxesString = () => {
        const axesCommands = [];
        if (machineConfig.activeAxes.x) axesCommands.push('X0');
        if (machineConfig.activeAxes.y) axesCommands.push('Y0');
        if (machineConfig.activeAxes.z) axesCommands.push('Z0');
        return axesCommands.join(' ');
    };

    const getActiveAxesForHome = () => {
        const activeAxes = [];
        if (machineConfig.activeAxes.x) activeAxes.push('X');
        if (machineConfig.activeAxes.y) activeAxes.push('Y');
        if (machineConfig.activeAxes.z) activeAxes.push('Z');
        return activeAxes.join('');
    };

    const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex justify-between py-2 border-b border-gray-700">
            <div className="font-medium text-gray-300 text-sm">{label}</div>
            <div className="text-gray-100 text-sm">{value}</div>
        </div>
    );

    return (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-100">{t('status.position')}</h2>
                <span className={`px-4 py-1.5 text-base font-bold rounded-full ${
                    status === 'Run' ? 'bg-green-500 text-white' :
                        status === 'Idle' ? 'bg-blue-500 text-white' :
                            status === 'Alarm' ? 'bg-red-500 text-white' :
                                status === 'Hold' ? 'bg-yellow-500 text-black' :
                                    status === 'Door' ? 'bg-orange-500 text-white' :
                                        status === 'Jog' ? 'bg-purple-500 text-white' :
                                            !status ? 'bg-gray-600 text-white' :
                                                'bg-gray-500 text-white'
                }`}>
                    {status ? (t(`status.statusValues.${status}`) || status) : t('status.statusValues.NotConnected')}
                </span>

            </div>
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 mb-2 text-sm font-medium">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => handleHome(getActiveAxesForHome())}
                        title={t('status.homeAllTooltip')}
                        className={`w-full px-1 py-1 mr-1 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-900 text-white rounded transition-colors flex items-center justify-center gap-1 ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!isConnected || isSending || status !== 'Idle'}
                        data-tour="home-buttons"
                    >
                        <HomeIcon className="w-4 h-4" />
                    </button>
                    {t('status.axis')}
                </div>
                <div className="text-blue-400 text-xs flex items-center justify-center"
                     data-tour="relative-coordinates">
                    {t('status.relative')} (<UnitDisplay/>)
                </div>
                <div className="text-green-400 text-xs flex items-center justify-center"
                     data-tour="absolute-coordinates">
                    {t('status.absolute')} (<UnitDisplay/>)
                </div>
                <div className="flex items-center justify-center gap-2  ">
                    <button
                        onClick={handleSetZeroAll}
                        className={`py-1 px-1 text-xs gap-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-900 text-white rounded-md transition-colors flex items-center justify-center ${(!isConnected || isSending || status !== 'Idle') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={t('status.setZeroAllTooltip')}
                        disabled={!isConnected || isSending || status !== 'Idle'}
                        data-tour="zero-buttons"
                    >
                        <MapPinIcon className="w-3 h-3"/>
                        {t('status.all')}
                    </button>
                    <button
                        onClick={handleResetAll}
                        className={`py-1 px-1 text-xs gap-1 bg-red-600 hover:bg-red-700 active:bg-red-900 text-white rounded-md transition-colors flex items-center justify-center ${(!isConnected || isSending || status !== 'Idle' || ((gCodeOffsets?.G92?.x ?? 0) == 0 && (gCodeOffsets?.G92?.y ?? 0) == 0 && (gCodeOffsets?.G92?.z ?? 0) == 0)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={t('status.resetAllTooltip')}
                        disabled={!isConnected || isSending || status !== 'Idle' || ((gCodeOffsets?.G92?.x ?? 0) == 0 && (gCodeOffsets?.G92?.y ?? 0) == 0 && (gCodeOffsets?.G92?.z ?? 0) == 0)}
                        data-tour="reset-buttons"
                    >
                        <ArrowUturnUpIcon className="w-3 h-3"/>
                        {t('status.all')}
                    </button>
                </div>
            </div>
            <div className="space-y-0">
                {machineConfig.activeAxes.x && (
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
                        onUpdateRelative={handleUpdateRelative}
                    />
                )}
                {machineConfig.activeAxes.y && (
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
                        onUpdateRelative={handleUpdateRelative}
                    />
                )}
                {machineConfig.activeAxes.z && (
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
                        onUpdateRelative={handleUpdateRelative}
                    />
                )}
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
                            <span>{t('status.details')}</span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${
                                isDetailsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-2 mt-2 space-y-1">
                                    <InfoRow label={t('status.lastSentLine')}
                                             value={lastSentLine ?? t('status.notSending')}/>
                                    <InfoRow label={t('status.bufferSlots')} value={availableBufferSlots}/>
                                    <InfoRow label={t('status.selectedLine')} value={selectedGCodeLine ?? '-'}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeModes && (
                <div className="space-y-2">
                    <button
                        onClick={() => setIsActiveModesOpen(!isActiveModesOpen)}
                        className="w-full flex items-center justify-between text-lg font-semibold mb-2 text-left hover:text-gray-300 transition-colors"
                    >
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {t('status.activeModes')}
                        </div>
                        <span className="transition-transform duration-300">
                            {isActiveModesOpen ? (
                                <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                                <ChevronDownIcon className="w-4 h-4" />
                            )}
                        </span>
                    </button>
                    <div
                        className={`grid transition-all duration-300 ease-in-out ${
                            isActiveModesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                                    {t('status.workCoordinateSystem')}: {activeModes.WorkCoordinateSystem}
                                </span>
                                <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                                    {t('status.arcPlane')}: {activeModes.Plane === Plane.XY ? t('status.xyPlane') : activeModes.Plane === Plane.XZ ? t('status.xzPlane') : t('status.yzPlane')}
                                </span>
                                <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                                    {t('status.unitsType')}: {t(`status.unitsTypes.${activeModes.UnitsType}`) || activeModes.UnitsType}
                                </span>
                                <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
                                    {t('status.positioningMode')}: {t(`status.positioningModes.${activeModes.PositioningMode}`) || activeModes.PositioningMode}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!isActiveModesOpen && (
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                                {activeModes.WorkCoordinateSystem}
                            </span>
                            <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                                {activeModes.Plane === Plane.XY ? t('status.xyPlane') : activeModes.Plane === Plane.XZ ? t('status.xzPlane') : t('status.yzPlane')}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                                {t(`status.unitsTypes.${activeModes.UnitsType}`) || activeModes.UnitsType}
                            </span>
                            <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
                                {t(`status.positioningModes.${activeModes.PositioningMode}`) || activeModes.PositioningMode}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};