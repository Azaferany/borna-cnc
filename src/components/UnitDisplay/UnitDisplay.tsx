import { useStore } from '../../app/store';
import {useShallow} from "zustand/react/shallow";



export const UnitDisplay = () => {
    const activeModes = useStore(useShallow(x => x.activeModes));
    return activeModes?.UnitsType === 'Inches' ? 'in' : 'mm';
}; 