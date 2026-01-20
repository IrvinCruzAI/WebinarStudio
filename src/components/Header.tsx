import React from 'react';
import { Presentation, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mr-2">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">
              Webinar <span className="text-teal-600">Rev</span>
            </h1>
          </div>
        </div>
        <div>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
            Help
          </button>
        </div>
      </div>
      <div id="progress-indicator"></div>
    </header>
  );
};

export default Header;
