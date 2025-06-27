import {useState} from 'react';
import {ChatBubbleLeftIcon} from '@heroicons/react/24/solid';
import {MessageHistoryModal} from '../MessageHistoryModal/MessageHistoryModal';
import {useStore} from "../../app/store.ts";

export const MessageHistoryButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const messageHistoryLength = useStore(x => x.messageHistory.length);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={messageHistoryLength === 0}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-900 text-white flex items-center gap-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:active:bg-gray-400"
            >
                <ChatBubbleLeftIcon className="w-5 h-5"/>
                <span>Message History</span>
            </button>
            <MessageHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}; 