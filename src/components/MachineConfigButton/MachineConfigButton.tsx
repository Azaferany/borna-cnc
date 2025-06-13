import {Cog6ToothIcon} from '@heroicons/react/24/outline';
import {Link} from "react-router";
import {ROUTES} from '../../app/routes';
import {useStore} from "../../app/store";

export function MachineConfigButton() {
    const isConnected = useStore(x => x.isConnected);
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const isConfigEnabled = isConnected && status === "Idle" && !isSending;

    if (!isConnected) {
        return null;
    }

    return (
        <div className="pl-12">
            <Link to={ROUTES.MACHINE_CONFIG}
                  className={`border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-gray-200 px-4 py-2 rounded flex items-center gap-2 ${!isConfigEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => !isConfigEnabled && e.preventDefault()}>
                <Cog6ToothIcon className="w-5 h-5"/>
                Machine Config
            </Link>
        </div>
    );
} 