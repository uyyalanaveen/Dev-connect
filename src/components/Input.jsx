import React from 'react';

const Input = (props) => {
    return (
        <div className="md:w-full flex flex-col gap-4">
            <input
                type={props.type}
                placeholder={props.name}
                required
                onChange={props.onChange} 
                className="w-full bg-transparent
                    text-white placeholder-gray-400 border
                    border-gray-600 
                    rounded-md p-3 focus:outline-none
                    focus:ring-1 focus:ring-blue-500 transition duration-100"
            />
        </div>
    );
};

export default Input;
