import { Input, Label } from '@/components/ui';
import React from 'react';
const NumberInput = ({ id, label, value, onChange, placeholder, step, }) => {
    const handleChange = (e) => {
        const parsedValue = parseFloat(e.target.value);
        if (!isNaN(parsedValue)) {
            onChange(parsedValue);
        }
        else if (e.target.value === '') {
            onChange(NaN); // Allow clearing the input
        }
    };
    return (<div>
      <Label htmlFor={id}>{label}</Label>
      <Input type="number" id={id} value={value} onChange={handleChange} placeholder={placeholder} step={step}/>
    </div>);
};
export default NumberInput;
