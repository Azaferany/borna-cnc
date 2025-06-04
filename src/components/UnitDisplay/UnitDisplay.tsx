import { useStore } from '../../app/store';



export const UnitDisplay = () => {
    const activeModes = useStore(x => x.activeModes);
    return activeModes?.UnitsType === 'Inches' ? 'in' : 'mm';
}; 