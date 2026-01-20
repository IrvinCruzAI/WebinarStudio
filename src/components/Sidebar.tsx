import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, History, Clock, Plus } from 'lucide-react';
import JobItem from './JobItem';
import { useJobContext, useJobContextReact } from '../context/JobContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { jobs, deleteJob } = useJobContext();
  const { setActiveJob } = useJobContextReact();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    setActiveJob(null);
    navigate('/');
    onClose();
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteJob(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-20 w-72 bg-white dark:bg-gray-800 shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium flex items-center">
          <History className="h-5 w-5 mr-2" />
          Job History
        </h2>
        <button
          onClick={handleCreateNew}
          className="px-3 py-1 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> Create New
        </button>
        <button 
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Delete Job?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >Cancel</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
        {jobs.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No job history yet</p>
            <p className="text-sm mt-2">Your webinar projects will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {jobs.map((job) => (
              <JobItem 
                key={job.id} 
                job={job} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
          <span className="text-gray-400 dark:text-gray-500">
            Webinar Rev - Internal MVP
          </span>
        </div>
      </div>
    </div>
  );
};


export default Sidebar