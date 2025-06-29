import {useCallback, useEffect, useRef} from 'react';
import {useStore} from './store';
import {useGRBL} from './useGRBL';
import {toast} from 'react-toastify';
import GRBLWebSocket from "./GRBLWebSocket.ts";
import {useTranslation} from 'react-i18next';

const RETRY_INTERVAL = 5000; // 3 seconds

export const useAutoConnection = () => {
    const {t} = useTranslation();
    const {connect, isConnected} = useGRBL();
    const eventSource = useStore(x => x.eventSource);
    const connectionType = useStore(x => x.connectionType);

    const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const connectingToastRef = useRef<string | number | undefined>(undefined);
    const retryCountRef = useRef(0);
    const isConnectingRef = useRef(false);
    const isConnectedRef = useRef(false);
    const eventSourceRef = useRef(eventSource ?? new GRBLWebSocket());

    useEffect(() => {
        isConnectedRef.current = isConnected;
        eventSourceRef.current = eventSource ?? new GRBLWebSocket();
    }, [isConnected, eventSource]);

    const showConnectingToast = useCallback(() => {
        if (!connectingToastRef.current) {
            connectingToastRef.current = toast.loading(t('autoConnection.connecting'), {
                position: 'top-right',
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: false,
                closeButton: false,
            });
        }
    }, [t]);

    const hideConnectingToast = useCallback(() => {
        if (connectingToastRef.current) {
            toast.dismiss(connectingToastRef.current);
            connectingToastRef.current = undefined;
            console.log('[useAutoConnection] Connecting toast dismissed');
        }
    }, []);

    const showConnectedToast = useCallback(() => {
        toast.success(t('autoConnection.connected'), {
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }, [t]);

    const showDisconnectedToast = useCallback(() => {
        toast.error(t('autoConnection.disconnected'), {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }, [t]);

    const attemptConnection = useCallback(async () => {
        if (isConnectedRef.current || isConnectingRef.current) {
            return;
        }
        isConnectingRef.current = true;
        showConnectingToast();
        console.error('[useAutoConnection] Connection:', isConnectedRef.current);

        try {
            if (!isConnectedRef.current) {
                await connect();
            }

        } catch (error) {
            console.error('[useAutoConnection] Connection failed:', error);

            // Schedule next retry
            console.log(`[useAutoConnection] Scheduling retry in ${RETRY_INTERVAL}ms`);
        }

        retryTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;

            console.log('[useAutoConnection] Retry timeout triggered, resetting isConnecting and attempting again');
            isConnectingRef.current = false;
            eventSource?.disconnect()
            attemptConnection();
        }, RETRY_INTERVAL);
    }, [connect, eventSource, showConnectingToast]);

    const startAutoConnection = useCallback(() => {
        if (isConnectedRef.current || isConnectingRef.current) {
            return;
        }
        
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        retryCountRef.current = 0;
        isConnectingRef.current = false;
        attemptConnection();
    }, [attemptConnection]);

    // Handle connection success
    useEffect(() => {

        if (isConnected) {
            isConnectingRef.current = false;
            retryCountRef.current = 0;

            // Clear any pending retry
            if (retryTimeoutRef.current) {
                console.log('[useAutoConnection] Clearing retry timeout due to successful connection');
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }

            hideConnectingToast();
            showConnectedToast();
        }
    }, [isConnected, hideConnectingToast, showConnectedToast]);

    // Handle disconnection (start auto-reconnect)
    useEffect(() => {
        if (!isConnected && eventSource) {
            // Only show disconnected toast if we were previously connected
            if (retryCountRef.current > 0) {
                showDisconnectedToast();
            }
            if (retryTimeoutRef.current) {
                console.log('[useAutoConnection] Clearing retry timeout due to successful connection');
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }
            if (connectionType == "serial")
                connect()
            else {
                startAutoConnection();
            }
        }
    }, [isConnected, startAutoConnection, showDisconnectedToast, eventSource, connectionType, connect]);

    return {
        isConnecting: isConnectingRef.current,
        retryCount: retryCountRef.current,
        startAutoConnection,
    };
}; 