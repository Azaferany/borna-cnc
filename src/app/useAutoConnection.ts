import {useEffect, useRef, useCallback} from 'react';
import {useStore} from './store';
import {useGRBL} from './useGRBL';
import {toast} from 'react-toastify';

const RETRY_INTERVAL = 3000; // 3 seconds

export const useAutoConnection = () => {
    const {connect, isConnected} = useGRBL();
    const connectionType = useStore(x => x.connectionType);
    const eventSource = useStore(x => x.eventSource);

    const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const connectingToastRef = useRef<string | number | undefined>(undefined);
    const retryCountRef = useRef(0);
    const isConnectingRef = useRef(false);

    const showConnectingToast = useCallback(() => {
        if (!connectingToastRef.current) {
            connectingToastRef.current = toast.loading('Connecting to machine...', {
                position: 'top-right',
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: false,
                closeButton: false,
            });
        }
    }, []);

    const hideConnectingToast = useCallback(() => {
        if (connectingToastRef.current) {
            toast.dismiss(connectingToastRef.current);
            connectingToastRef.current = undefined;
        }
    }, []);

    const showConnectedToast = useCallback(() => {
        toast.success('Connected to machine!', {
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }, []);

    const showDisconnectedToast = useCallback(() => {
        toast.error('Disconnected from machine', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }, []);

    const attemptConnection = useCallback(async () => {
        if (isConnectingRef.current || isConnected) return;

        isConnectingRef.current = true;
        showConnectingToast();

        try {
            retryCountRef.current++;
            console.log(`Connection attempt ${retryCountRef.current}`);
            await connect();
        } catch (error) {
            console.error('Connection failed:', error);

            // Schedule next retry
            retryTimeoutRef.current = setTimeout(() => {
                isConnectingRef.current = false;
                attemptConnection();
            }, RETRY_INTERVAL);
        }
    }, [connect, isConnected, showConnectingToast]);

    const startAutoConnection = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        retryCountRef.current = 0;
        isConnectingRef.current = false;
        attemptConnection();
    }, [attemptConnection]);

    // Handle connection success
    useEffect(() => {
        if (isConnected && isConnectingRef.current) {
            isConnectingRef.current = false;
            retryCountRef.current = 0;

            // Clear any pending retry
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }

            hideConnectingToast();
            showConnectedToast();
        }
    }, [isConnected, hideConnectingToast, showConnectedToast]);

    // Handle disconnection (start auto-reconnect)
    useEffect(() => {
        if (!isConnected && !isConnectingRef.current && eventSource) {
            // Only show disconnected toast if we were previously connected
            if (retryCountRef.current > 0) {
                showDisconnectedToast();
            }
            // Small delay before starting reconnection attempts
            setTimeout(() => {
                startAutoConnection();
            }, 1000);
        }
    }, [isConnected, startAutoConnection, showDisconnectedToast, eventSource]);

    // Start initial connection when component mounts or connection type changes
    useEffect(() => {
        if (eventSource) {
            startAutoConnection();
        }

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            hideConnectingToast();
        };
    }, [eventSource, connectionType, startAutoConnection, hideConnectingToast]);

    return {
        isConnecting: isConnectingRef.current,
        retryCount: retryCountRef.current,
        startAutoConnection,
    };
}; 