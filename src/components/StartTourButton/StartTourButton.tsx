import {useStore} from '../../app/store';
import {AcademicCapIcon} from '@heroicons/react/24/outline';
import {useNavigate} from 'react-router';
import {ROUTES} from '../../app/routes';

const StartTourButton: React.FC = () => {
    const {setTourOpen} = useStore();
    const navigate = useNavigate();

    const handleStartTour = () => {
        // Navigate to home page first, then start tour
        navigate(ROUTES.HOME);
        // Small delay to ensure navigation completes before starting tour
        setTimeout(() => {
            setTourOpen(true);
        }, 100);
    };

    return (
        <button
            onClick={handleStartTour}
            className="bg-purple-600/50 hover:bg-purple-500/50 text-white px-3 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
            title="Start guided tour"
        >
            <AcademicCapIcon className="w-5 h-5 mr-2"/>
            <span className="hidden sm:inline">Tour</span>
        </button>
    );
};

export default StartTourButton; 