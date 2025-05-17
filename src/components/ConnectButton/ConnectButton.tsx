import { useGRBL } from '../../contexts/GRBLContext';

export const ConnectButton = ({ className = '' }: { className?: string }) => {
    const { isConnected, connect, disconnect } = useGRBL();

    return (
        <button
            onClick={isConnected ? disconnect : connect}
            className={`px-4 py-1.5 rounded cursor-pointer ${
                isConnected 
                    ? 'bg-red-600 hover:bg-red-800' 
                    : 'bg-green-600 hover:bg-green-800'
            } ${className}`}
        >
            {isConnected ? 'Disconnect' : 'Connect'}
        </button>
    );
}; 