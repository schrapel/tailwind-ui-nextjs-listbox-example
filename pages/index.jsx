import React, { useState } from 'react';
import {
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxList,
  ListboxOption,
} from '../components/Listbox';

const golfers = [
  'Rory McIlroy',
  'Jon Rahm',
  'Brooks Koepka',
  'Justin Thomas',
  'Dustin Johnson',
  'Patrick Cantlay',
  'Webb Simpson',
  'Patrick Reed',
  'Adam Scott',
  'Tommy Fleetwood',
  'Tiger Woods',
  'Xander Schauffele',
  'Bryson DeChambeau',
  'Justin Rose',
  'Marc Leishman',
];

// TODO: Use twin.macro or classNames package for better dynamic class configuration.
export default function Home() {
  const [selectedGolfer, setSelectedGolfer] = useState('Tiger Woods');

  return (
    <div className="p-48 antialiased font-sans text-gray-900">
      <div className="max-w-xs mx-auto">
        <Listbox value={selectedGolfer} onChange={setSelectedGolfer} className="relative">
          <ListboxLabel className="sr-only">Select a Golfer</ListboxLabel>
          <ListboxButton className="w-full focus:outline-none">
            {({ isFocused, isOpen }) => (
              <span
                className={`inline-flex items-center justify-between w-full text-left rounded px-3 py-2 border ${isFocused || isOpen ? 'border-blue-300 shadow-outline-blue' : 'border-gray-300'}`}>
                {selectedGolfer}
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </ListboxButton>
          <ListboxList className="absolute mt-2 w-full max-h-56 overflow-y-auto focus:outline-none shadow rounded-md border py-1">
            {golfers.map((golfer) => (
              <ListboxOption key={golfer} value={golfer} className="cursor-default select-none">
                {({ isActive, isSelected }) => (
                  <div className={`relative px-3 py-2${isActive ? ' bg-red-500 text-white' : ''}`}>
                    {golfer}
                    {isSelected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                          className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-700'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                )}
              </ListboxOption>
            ))}
          </ListboxList>
        </Listbox>
      </div>
    </div>
  );
}
