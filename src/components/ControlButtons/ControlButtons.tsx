import React, {useState, useRef, useCallback} from 'react';
import {StartButton} from "../StartButton/StartButton.tsx";
import {PreviousButton} from "../PreviousButton/PreviousButton.tsx";
import {PauseButton} from "../PauseButton/PauseButton.tsx";
import {ResetButton} from "../ResetButton/ResetButton.tsx";
import {DwellInfo} from "../DwellInfo/DwellInfo.tsx";
import {MainGasButton} from "../MainGasButton/MainGasButton.tsx";
import {SecondaryGasButton} from "../SecondaryGasButton/SecondaryGasButton.tsx";
import {SpindleControl} from "../SpindleControl/SpindleControl.tsx";

interface ButtonConfig {
    id: string;
    type: 'built-in';
    component: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    visible: boolean;
    minSize: { width: number; height: number };
}

interface DraggableButtonProps {
    config: ButtonConfig;
    isEditMode: boolean;
    onMove: (id: string, position: { x: number; y: number }) => void;
    onResize: (id: string, size: { width: number; height: number }) => void;
    onRemove: (id: string) => void;
    children: React.ReactNode;
    gridSize?: number;
}

const DraggableButton: React.FC<DraggableButtonProps> = ({
                                                             config,
                                                             isEditMode,
                                                             onMove,
                                                             onResize,
                                                             onRemove,
                                                             children,
                                                             gridSize = 10
                                                         }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [resizeStart, setResizeStart] = useState({x: 0, y: 0, width: 0, height: 0});
    const [originalPosition, setOriginalPosition] = useState({x: 0, y: 0});
    const [originalSize, setOriginalSize] = useState({width: 0, height: 0});
    const buttonRef = useRef<HTMLDivElement>(null);

    // Snap to grid helper function
    const snapToGrid = useCallback((value: number) => Math.round(value / gridSize) * gridSize, [gridSize]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        setIsDragging(true);
        setOriginalPosition({x: config.position.x, y: config.position.y});
        setDragStart({
            x: e.clientX - config.position.x,
            y: e.clientY - config.position.y
        });
    }, [isEditMode, config.position]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setOriginalSize({width: config.size.width, height: config.size.height});
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: config.size.width,
            height: config.size.height
        });
    }, [isEditMode, config.size]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        // Get container bounds for boundary checking
        const container = document.querySelector('.control-buttons-container') as HTMLElement;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerPadding = 16; // Account for padding
        const containerWidth = containerRect.width - (containerPadding * 2);
        const containerHeight = containerRect.height - (containerPadding * 2) - 60; // Account for header

        const isOutsideContainer = (
            e.clientX < containerRect.left ||
            e.clientX > containerRect.right ||
            e.clientY < containerRect.top ||
            e.clientY > containerRect.bottom
        );

        if (isOutsideContainer) {
            // Cancel drag/resize and restore original state
            if (isDragging) {
                onMove(config.id, originalPosition);
                setIsDragging(false);
            }
            if (isResizing) {
                onResize(config.id, originalSize);
                setIsResizing(false);
            }
            return;
        }

        if (isDragging) {
            const newX = snapToGrid(e.clientX - dragStart.x);
            const newY = snapToGrid(e.clientY - dragStart.y);

            // Constrain position within container bounds
            const constrainedX = Math.max(0, Math.min(newX, containerWidth - config.size.width));
            const constrainedY = Math.max(0, Math.min(newY, containerHeight - config.size.height));

            onMove(config.id, {x: constrainedX, y: constrainedY});
        } else if (isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            // Calculate new dimensions with grid snapping and minimum size constraints
            let newWidth = Math.max(config.minSize.width, snapToGrid(resizeStart.width + deltaX));
            let newHeight = Math.max(config.minSize.height, snapToGrid(resizeStart.height + deltaY));

            // Constrain size to not exceed container bounds
            const maxWidth = containerWidth - config.position.x;
            const maxHeight = containerHeight - config.position.y;

            newWidth = Math.min(newWidth, maxWidth);
            newHeight = Math.min(newHeight, maxHeight);

            // Ensure dimensions are grid-aligned after constraining
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);

            // Final check against minimum size
            newWidth = Math.max(config.minSize.width, newWidth);
            newHeight = Math.max(config.minSize.height, newHeight);

            onResize(config.id, {width: newWidth, height: newHeight});
        }
    }, [isDragging, isResizing, onMove, config.id, config.size.width, config.size.height, config.minSize.width, config.minSize.height, config.position.x, config.position.y, originalPosition, onResize, originalSize, snapToGrid, dragStart.x, dragStart.y, resizeStart.x, resizeStart.y, resizeStart.width, resizeStart.height]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    React.useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    // Get button title for display in edit mode
    const getButtonTitle = () => {
        switch (config.component) {
            case 'StartButton':
                return 'Start Button';
            case 'PreviousButton':
                return 'Previous Button';
            case 'PauseButton':
                return 'Pause Button';
            case 'ResetButton':
                return 'Reset Button';
            case 'MainGasButton':
                return 'Main Gas Button';
            case 'SecondaryGasButton':
                return 'Secondary Gas Button';
            case 'SpindleControl':
                return 'Spindle Control';
            case 'DwellInfo':
                return 'Dwell Info';
            default:
                return 'Unknown Button';
        }
    };

    return (
        <div
            ref={buttonRef}
            className={`absolute ${isEditMode ? 'cursor-move border-2 border-dashed border-blue-400' : ''}`}
            style={{
                left: config.position.x,
                top: config.position.y,
                width: config.size.width,
                height: config.size.height,
                zIndex: isDragging ? 1000 : 1
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Show title overlay in edit mode */}
            {isEditMode && (
                <div
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-white text-sm font-medium text-center px-2">
                        {getButtonTitle()}
                    </span>
                </div>
            )}

            {/* Wrapper div to control pointer events */}
            <div className={isEditMode ? 'pointer-events-none' : ''} style={{width: '100%', height: '100%'}}>
                {children}
            </div>

            {isEditMode && (
                <>
                    {/* Position handle (move) - top-left corner */}
                    <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 cursor-move rounded-full border-2 border-white shadow-lg"
                        onMouseDown={handleMouseDown}
                        title="Drag to move"
                    />

                    {/* Resize handle - bottom-right corner */}
                    <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-full border-2 border-white shadow-lg"
                        onMouseDown={handleResizeMouseDown}
                        title="Drag to resize"
                    />

                    {/* Remove button */}
                    <div className="absolute -top-8 left-0 flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(config.id);
                            }}
                            className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
                        >
                            Remove
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

interface AddButtonModalProps {
    onAdd: (button: ButtonConfig) => void;
    onCancel: () => void;
}

const AddButtonModal: React.FC<AddButtonModalProps> = ({onAdd, onCancel}) => {
    const [selectedBuiltIn, setSelectedBuiltIn] = useState('StartButton');

    const builtInOptions = [
        {value: 'StartButton', label: 'Start Button'},
        {value: 'PauseButton', label: 'Pause Button'},
        {value: 'ResetButton', label: 'Reset Button'},
        {value: 'MainGasButton', label: 'Main Gas Button'},
        {value: 'SecondaryGasButton', label: 'Secondary Gas Button'},
        {value: 'SpindleControl', label: 'Spindle Control'},
        {value: 'DwellInfo', label: 'Dwell Info'}
    ];

    // Define minimum sizes for each button type
    const getMinSize = (componentName: string) => {
        switch (componentName) {
            case 'StartButton':
            case 'PauseButton':
            case 'ResetButton':
            case 'MainGasButton':
            case 'SecondaryGasButton':
                return {width: 100, height: 70};
            case 'SpindleControl':
                return {width: 200, height: 150};
            case 'DwellInfo':
                return {width: 200, height: 80};
            default:
                return {width: 80, height: 40};
        }
    };

    const handleAdd = () => {
        const gridSize = 10;
        const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;
        const minSize = getMinSize(selectedBuiltIn);

        const newButton: ButtonConfig = {
            id: `${selectedBuiltIn.toLowerCase()}-${Date.now()}`,
            type: 'built-in',
            component: selectedBuiltIn,
            position: {x: snapToGrid(50), y: snapToGrid(310)},
            size: minSize,
            visible: true,
            minSize: minSize
        };
        onAdd(newButton);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Add Button</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Built-in Button
                    </label>
                    <select
                        value={selectedBuiltIn}
                        onChange={(e) => setSelectedBuiltIn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    >
                        {builtInOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        Add Button
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ControlButtons = () => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [containerSize, setContainerSize] = useState({width: 400, height: 400});
    const gridSize = 10;

    // Calculate 50% width for default buttons
    const getDefaultButtonWidth = () => Math.floor((containerSize.width - 30) / 2); // Account for padding and gap

    // Define minimum sizes for each button type
    const getMinSize = (componentName: string) => {
        switch (componentName) {
            case 'StartButton':
            case 'PauseButton':
            case 'ResetButton':
            case 'MainGasButton':
            case 'SecondaryGasButton':
                return {width: 80, height: 40};
            case 'SpindleControl':
                return {width: 150, height: 200};
            case 'DwellInfo':
                return {width: 120, height: 50};
            default:
                return {width: 80, height: 40};
        }
    };

    const [buttons, setButtons] = useState<ButtonConfig[]>([
        {
            id: 'pause',
            type: 'built-in',
            component: 'PauseButton',
            position: {x: getDefaultButtonWidth() + 20, y: 60},
            size: {width: getDefaultButtonWidth(), height: 50},
            visible: true,
            minSize: getMinSize('PauseButton')
        },
        {
            id: 'start',
            type: 'built-in',
            component: 'StartButton',
            position: {x: 10, y: 120},
            size: {width: getDefaultButtonWidth(), height: 50},
            visible: true,
            minSize: getMinSize('StartButton')
        },
        {
            id: 'maingas',
            type: 'built-in',
            component: 'MainGasButton',
            position: {x: getDefaultButtonWidth() + 20, y: 120},
            size: {width: getDefaultButtonWidth(), height: 50},
            visible: true,
            minSize: getMinSize('MainGasButton')
        },
        {
            id: 'reset',
            type: 'built-in',
            component: 'ResetButton',
            position: {x: 10, y: 180},
            size: {width: getDefaultButtonWidth(), height: 50},
            visible: true,
            minSize: getMinSize('ResetButton')
        },
        {
            id: 'secondarygas',
            type: 'built-in',
            component: 'SecondaryGasButton',
            position: {x: getDefaultButtonWidth() + 20, y: 180},
            size: {width: getDefaultButtonWidth(), height: 50},
            visible: true,
            minSize: getMinSize('SecondaryGasButton')
        },
        {
            id: 'dwell',
            type: 'built-in',
            component: 'DwellInfo',
            position: {x: 10, y: 240},
            size: {width: containerSize.width - 70, height: 60},
            visible: true,
            minSize: getMinSize('DwellInfo')
        }
    ]);

    // Update button positions when container size changes
    React.useEffect(() => {
        const updateButtonSizes = () => {
            const container = document.querySelector('.control-buttons-container') as HTMLElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                const newWidth = rect.width - 32; // Account for padding
                const newHeight = rect.height - 92; // Account for padding and header
                setContainerSize({width: newWidth, height: newHeight});

                const buttonWidth = Math.floor((newWidth - 30) / 2);

                setButtons(prev => prev.map(btn => {
                    switch (btn.id) {
                        case 'pause':
                            return {...btn, size: {width: buttonWidth, height: 70}, position: {x: 10, y: 0}};
                        case 'start':
                            return {
                                ...btn,
                                size: {width: buttonWidth, height: 70},
                                position: {x: buttonWidth + 20, y: 0}
                            };
                        case 'maingas':
                            return {...btn, size: {width: buttonWidth, height: 70}, position: {x: 10, y: 80}};
                        case 'reset':
                            return {
                                ...btn,
                                size: {width: buttonWidth, height: 70},
                                position: {x: buttonWidth + 20, y: 80}
                            };
                        case 'secondarygas':
                            return {...btn, size: {width: buttonWidth, height: 70}, position: {x: 10, y: 160}};
                        case 'dwell':
                            return {...btn, size: {width: newWidth - 20, height: 60}, position: {x: 10, y: 240}};
                        default:
                            return btn;
                    }
                }));
            }
        };

        // Initial update
        updateButtonSizes();

        // Listen for window resize
        window.addEventListener('resize', updateButtonSizes);

        return () => {
            window.removeEventListener('resize', updateButtonSizes);
        };
    }, []);

    // Grid background component
    const GridBackground = () => (
        <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: `
          linear-gradient(to right, #374151 1px, transparent 1px),
          linear-gradient(to bottom, #374151 1px, transparent 1px)
        `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: '0 0'
            }}
        />
    );

    const renderBuiltInButton = (componentName: string) => {
        switch (componentName) {
            case 'StartButton':
                return <StartButton/>;
            case 'PreviousButton':
                return <PreviousButton/>;
            case 'PauseButton':
                return <PauseButton/>;
            case 'ResetButton':
                return <ResetButton/>;
            case 'MainGasButton':
                return <MainGasButton/>;
            case 'SecondaryGasButton':
                return <SecondaryGasButton/>;
            case 'SpindleControl':
                return <SpindleControl/>;
            case 'DwellInfo':
                return <DwellInfo/>;
            default:
                return <div>Unknown Component</div>;
        }
    };

    const handleMoveButton = (id: string, position: { x: number; y: number }) => {
        setButtons(prev => prev.map(btn =>
            btn.id === id ? {...btn, position} : btn
        ));
    };

    const handleResizeButton = (id: string, size: { width: number; height: number }) => {
        setButtons(prev => prev.map(btn =>
            btn.id === id ? {...btn, size} : btn
        ));
    };

    const handleRemoveButton = (id: string) => {
        setButtons(prev => prev.filter(btn => btn.id !== id));
    };

    const handleAddButton = (button: ButtonConfig) => {
        setButtons(prev => [...prev, button]);
        setShowAddModal(false);
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full relative overflow-hidden control-buttons-container">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Machine Control
                </h2>

                <div className="flex gap-2">
                    <button
                        onClick={toggleEditMode}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors z-50 ${
                            isEditMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                    >
                        {isEditMode ? 'Exit Edit' : 'Edit Layout'}
                    </button>

                    {isEditMode && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-500"
                        >
                            Add Button
                        </button>
                    )}
                </div>
            </div>

            <div className="relative"
                 style={{minHeight: `${Math.max(...buttons.map(x => x.size.height + x.position.y))}px`}}>
                {/* Grid background - only visible in edit mode */}
                {isEditMode && <GridBackground/>}

                {buttons.filter(btn => btn.visible).map(button => (
                    <DraggableButton
                        key={button.id}
                        config={button}
                        isEditMode={isEditMode}
                        onMove={handleMoveButton}
                        onResize={handleResizeButton}
                        onRemove={handleRemoveButton}
                        gridSize={gridSize}
                    >
                        <div style={{width: '100%', height: '100%'}}>
                            {renderBuiltInButton(button.component)}
                        </div>
                    </DraggableButton>
                ))}
            </div>

            {showAddModal && (
                <AddButtonModal
                    onAdd={handleAddButton}
                    onCancel={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
};