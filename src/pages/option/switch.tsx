import React from 'react';
import './css/switch.css';

interface SwitchProps {
    isOn: boolean;
    handleToggle: () => void;
}

const Switch: React.FC<SwitchProps> = ({ isOn, handleToggle }) => {
    return (
        <label className="switch" htmlFor="switch">
        <input
            id="switch"
            type="checkbox"
            checked={isOn}
            onChange={handleToggle}
        />
        <span className="slider round"></span>
    </label>
    );
};

export default Switch;