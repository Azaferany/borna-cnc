import {Cog6ToothIcon} from '@heroicons/react/24/outline';
import {Link} from "react-router";
import {ROUTES} from '../../app/routes';
import {useStore} from "../../app/store";

export function MachineConfigButton() {
    const status = useStore(x => x.status);
    const isSending = useStore(x => x.isSending);
    const isConfigEnabled = (status === "Idle" || status == "Alarm" || status == "NotConnected") && !isSending;


    return (
        <Link
            to={ROUTES.MACHINE_CONFIG}
            className={`p-3 hover:bg-gradient-to-br hover:from-blue-300/5 hover:to-blue-600/5 active:bg-gradient-to-br active:from-blue-500/40 active:to-blue-700/30 transition-all duration-200 group relative rounded-sm border border-transparent hover:border-blue-400/30 active:border-blue-500/40 shadow-sm hover:shadow-md active:shadow-lg ${!isConfigEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}

            title="Machine Configuration"
        >
            <Cog6ToothIcon
                className="w-4 h-4 text-blue-700 group-hover:text-green-800 group-active:text-green-900 transition-colors relative z-10 drop-shadow-sm"/>
        </Link>
    );
}