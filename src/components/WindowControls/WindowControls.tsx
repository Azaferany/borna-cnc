import {useLocation, Link} from 'react-router';
import {ROUTES} from '../../app/routes';
import {HomeIcon} from '@heroicons/react/24/outline';

export const WindowControls = () => {
    const location = useLocation();
    const isHomePage = location.pathname === ROUTES.HOME;

    const handleMinimize = () => {
        if (window.electron) {
            window.electron.minimize();
        }
    };

    const handleClose = () => {
        if (window.electron) {
            window.electron.close();
        }
    };

    return (
        <div
            className="fixed top-0 right-0 z-50 flex items-center bg-gradient-to-l from-slate-200/95 via-slate-300/90 to-slate-400/85 backdrop-blur-xl border border-slate-400/60 rounded-bl-lg shadow-2xl no-drag z-[9999999999]">
            {!isHomePage && (
                <Link
                    to={ROUTES.HOME}
                    className="p-3 hover:bg-gradient-to-br hover:from-indigo-400/30 hover:to-indigo-600/20 active:bg-gradient-to-br active:from-indigo-500/40 active:to-indigo-700/30 transition-all duration-200 group relative rounded-sm border border-transparent hover:border-indigo-400/30 active:border-indigo-500/40 shadow-sm hover:shadow-md active:shadow-lg cursor-pointer"
                    title="Home"
                >
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-indigo-400/15 to-indigo-600/15 opacity-0 group-hover:opacity-100 group-active:opacity-120 transition-opacity duration-200 rounded-sm"></div>
                    <HomeIcon
                        className="w-4 h-4 text-indigo-700 group-hover:text-indigo-800 group-active:text-indigo-900 transition-colors relative z-10 drop-shadow-sm"/>
                </Link>
            )}
            <button
                onClick={handleMinimize}
                className="p-3 hover:bg-gradient-to-br hover:from-emerald-400/30 hover:to-emerald-600/20 active:bg-gradient-to-br active:from-emerald-500/40 active:to-emerald-700/30 transition-all duration-200 group relative rounded-sm border border-transparent hover:border-emerald-400/30 active:border-emerald-500/40 shadow-sm hover:shadow-md active:shadow-lg cursor-pointer"
                title="Minimize"
            >
                <div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 to-emerald-600/15 opacity-0 group-hover:opacity-100 group-active:opacity-120 transition-opacity duration-200 rounded-sm"></div>
                <svg
                    className="w-4 h-4 text-emerald-700 group-hover:text-emerald-800 group-active:text-emerald-900 transition-colors relative z-10 drop-shadow-sm"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4"/>
                </svg>
            </button>
            <button
                onClick={handleClose}
                className="p-3 hover:bg-gradient-to-br hover:from-red-400/30 hover:to-red-600/20 active:bg-gradient-to-br active:from-red-500/40 active:to-red-700/30 transition-all duration-200 group relative rounded-sm border border-transparent hover:border-red-400/30 active:border-red-500/40 shadow-sm hover:shadow-md active:shadow-lg cursor-pointer"
                title="Close"
            >
                <div
                    className="absolute inset-0 bg-gradient-to-br from-red-400/15 to-red-600/15 opacity-0 group-hover:opacity-100 group-active:opacity-120 transition-opacity duration-200 rounded-sm"></div>
                <svg
                    className="w-4 h-4 text-red-700 group-hover:text-red-800 group-active:text-red-900 transition-colors relative z-10 drop-shadow-sm"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    );
}; 