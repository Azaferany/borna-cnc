import React, {useState, useEffect} from 'react';
import {useStore} from '../../app/store';
import {useShallow} from 'zustand/react/shallow';
import {PlayIcon} from '@heroicons/react/24/solid';
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root');

interface StartOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (startFromLine: number) => void;
}

export const StartOptionsModal: React.FC<StartOptionsModalProps> = ({isOpen, onClose, onStart}) => {
    const selectedGCodeLine = useStore(s => s.selectedGCodeLine);
    const allGCodes = useStore(useShallow(s => s.allGCodes));
    const [startFromLine, setStartFromLine] = useState(selectedGCodeLine ?? 1);
    const [previewLine, setPreviewLine] = useState<string>('');

    // Update preview when startFromLine changes
    useEffect(() => {
        if (allGCodes && startFromLine > 0 && startFromLine <= allGCodes.length) {
            setPreviewLine(allGCodes[startFromLine - 1]);
        } else {
            setPreviewLine('');
        }
    }, [startFromLine, allGCodes]);

    // Reset to selected line when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartFromLine(selectedGCodeLine ?? 1);
        }
    }, [isOpen, selectedGCodeLine]);

    const totalLines = allGCodes?.length ?? 0;
    const isStartFromBeginning = startFromLine === 1;

    const modalStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        },
        content: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            inset: 'auto',
            position: 'relative' as const,
            width: '100%',
            maxWidth: '28rem',
            maxHeight: '90vh',
            overflow: 'visible'
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={modalStyles}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
        >
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Start Options</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Start from beginning option */}
                    <div
                        className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                            isStartFromBeginning
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => setStartFromLine(1)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isStartFromBeginning ? 'border-blue-500' : 'border-gray-400'
                                }`}>
                                    {isStartFromBeginning && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500"/>
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-white font-medium">Start from beginning</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Execute all G-code commands from the first line
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Start from line option */}
                    <div
                        className={`p-4 rounded-lg border-2 transition-colors ${
                            !isStartFromBeginning
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => setStartFromLine(startFromLine == 1 ? (selectedGCodeLine && selectedGCodeLine > 1 ? selectedGCodeLine : 2) : startFromLine)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    !isStartFromBeginning ? 'border-blue-500' : 'border-gray-400'
                                }`}>
                                    {!isStartFromBeginning && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500"/>
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-white font-medium">Start from specific line</h3>
                                <div className="mt-2 flex items-center space-x-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalLines}
                                        value={startFromLine}
                                        onChange={(e) => setStartFromLine(Math.max(2, Math.min(Number(e.target.value), totalLines)))}
                                        className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        disabled={isStartFromBeginning}
                                    />
                                    <span className="text-sm text-gray-400">
                                        of {totalLines} lines
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview section */}
                    {!isStartFromBeginning && previewLine && (
                        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Line Preview:</h4>
                            <div className="font-mono text-sm text-white bg-gray-800 p-2 rounded overflow-x-auto">
                                {previewLine}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons - sticky footer */}
                <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onStart(startFromLine)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
                        >
                            <PlayIcon className="h-5 w-5"/>
                            <span>Start</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}; 