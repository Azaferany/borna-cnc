import React, {useState, useEffect} from 'react';
import {useStore} from '../../app/store';
import {AlarmModal} from './AlarmModal';

export const AlarmModalProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const status = useStore(x => x.status);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Show modal when status changes to Alarm
    useEffect(() => {
        if (status === 'Alarm') {
            setIsModalOpen(true);
        }
    }, [status]);

    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {children}
            <AlarmModal
                isOpen={isModalOpen}
                onClose={handleClose}
            />
        </>
    );
}; 