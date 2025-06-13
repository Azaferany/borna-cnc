import React, { useState} from 'react';
import { useGRBL } from "../../app/useGRBL.ts";
import { useStore } from "../../app/store.ts";
import type {Point3D6Axis} from "../../types/GCodeTypes.ts";
import {useShallow} from "zustand/react/shallow";

const WorkOffsetPanel: React.FC = () => {
  const {sendCommand, isConnected} = useGRBL();
  const gCodeOffsets = useStore(useShallow(state => state.gCodeOffsets));
  const updateGCodeOffsets = useStore(state => state.updateGCodeOffsets);
  const activeModes = useStore(useShallow(state => state.activeModes));
  const [editingOffset, setEditingOffset] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActivateOffset = (offset: string) => {
    sendCommand(offset);
  };

  const handleSubmit = (point : Point3D6Axis, offset: string) => {
    const command = `G10 L2 P${+offset.slice(1)-53} X${point.x} Y${point.y} Z${point.z}`;
    sendCommand(command);
    updateGCodeOffsets(perv => ({
      ...perv,
      [offset]: { ...point }
    }));
    setEditingOffset(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-white hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <h2 className="text-xl font-bold">Work Offsets</h2>
          {!isConnected ? (
              <span className="px-2 py-1 bg-red-600 rounded-md text-sm font-medium">
              Please connect first
            </span>
          ) : activeModes?.WorkCoordinateSystem && (
              <span className="px-2 py-1 bg-blue-600 rounded-md text-sm font-medium whitespace-normal break-words">
              Active : {activeModes.WorkCoordinateSystem} X : {gCodeOffsets[activeModes.WorkCoordinateSystem as keyof typeof gCodeOffsets].x.toFixed(3)} Y:{gCodeOffsets[activeModes.WorkCoordinateSystem as keyof typeof gCodeOffsets].y.toFixed(3)} Z : {gCodeOffsets[activeModes.WorkCoordinateSystem as keyof typeof gCodeOffsets].z.toFixed(3)}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-gray-600 rounded-md transition-colors duration-200 flex items-center gap-1"
        >
          <span className="text-sm font-medium">{isExpanded ? 'Close' : 'Open Details'}</span>
          {isExpanded ? (
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      <div className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'h-auto' : 'h-0'}`}>
        <div className="p-4 pt-2 transform transition-transform duration-200 ease-out" style={{ transform: `translateY(${isExpanded ? '0' : '-100%'})` }}>
          {!isConnected ? (
              <div className="text-center text-gray-400 py-4">
                Please connect to the machine first to view and edit work offsets
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(gCodeOffsets)
                    .filter(([key]) => key !== 'G92')
                    .filter(([key]) => key !== 'G28')
                    .filter(([key]) => key !== 'G30')
                    .map(([offset, values]) => (
                        <form
                            key={offset}
                            id={`offset-form-${offset}`}
                            onSubmit={(e) => {
                              e.preventDefault()
                              const form = e.target as HTMLFormElement;
                              const formData = new FormData(form);
                              const x = parseFloat(formData.get('x') as string) || 0;
                              const y = parseFloat(formData.get('y') as string) || 0;
                              const z = parseFloat(formData.get('z') as string) || 0;
                              handleSubmit({x, y, z}, offset)
                            }}
                            className={`bg-gray-700 rounded-lg p-3 transition-colors duration-200 ${
                                activeModes?.WorkCoordinateSystem === offset
                                    ? 'ring-2 ring-green-500 bg-gray-600 border border-green-500'
                                    : 'hover:bg-gray-600'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-white">{offset}</h3>
                              {activeModes?.WorkCoordinateSystem === offset && (
                                  <span
                                      className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                            Active
                          </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {editingOffset === offset ? (
                                  <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                          setEditingOffset(null);
                                        }}
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 active:bg-red-900 transition-colors duration-200"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 active:bg-green-900 transition-colors duration-200"
                                    >
                                      Save
                                    </button>

                                  </>
                              ) : (
                                  <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                          handleSubmit({x: 0, y: 0, z: 0}, offset);
                                        }}
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 active:bg-red-700 transition-colors duration-200"
                                    >
                                      Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                          setEditingOffset(offset);
                                          e.stopPropagation();
                                          e.preventDefault();
                                        }}
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-800 active:bg-gray-900 transition-colors duration-200"
                                    >
                                      Edit
                                    </button>

                                  </>
                              )}
                              {activeModes?.WorkCoordinateSystem !== offset && (<button
                                  type="button"
                                  onClick={() => handleActivateOffset(offset)}
                                  className={`flex-1 sm:flex-none px-3 py-1.5 text-white text-sm rounded-md transition-colors duration-200 bg-blue-600 hover:bg-blue-700 active:bg-blue-900`}
                              >
                                Activate
                              </button>)}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="w-8 text-gray-300 font-medium" htmlFor={"x"}>X:</label>
                              <input name={"x"} id={"x"}
                                     type="number"
                                     value={editingOffset !== offset ? values.x : undefined}
                                     className={`flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                         editingOffset !== offset ? 'opacity-50 cursor-not-allowed' : ''
                                     }`}
                                     placeholder="0.000"
                                     step="0.001"
                                     disabled={editingOffset !== offset}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-8 text-gray-300 font-medium" htmlFor={"y"}>Y:</label>
                              <input name={"y"} id={"y"}
                                     type="number"
                                     value={editingOffset !== offset ? values.y : undefined}
                                     className={`flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                         editingOffset !== offset ? 'opacity-50 cursor-not-allowed' : ''
                                     }`}
                                     placeholder="0.000"
                                     step="0.001"
                                     disabled={editingOffset !== offset}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-8 text-gray-300 font-medium" htmlFor={"z"}>Z:</label>
                              <input name={"z"} id={"z"}
                                     type="number"
                                     value={editingOffset !== offset ? values.z : undefined}
                                     className={`flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                         editingOffset !== offset ? 'opacity-50 cursor-not-allowed' : ''
                                     }`}
                                     placeholder="0.000"
                                     step="0.001"
                                     disabled={editingOffset !== offset}
                              />
                            </div>
                          </div>
                        </form>
                    ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkOffsetPanel; 