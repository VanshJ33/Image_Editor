import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { toast } from 'sonner';
import axios from 'axios';
import { Building2, Plus } from 'lucide-react';
import { getApiUrl, API_CONFIG, handleApiError } from '../../config/api';

const OrganizationInput = ({ onOrganizationVerified }) => {
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'create'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    if (mode === 'create') {
      await handleCreateOrganization();
    } else {
      await handleCheckOrganization();
    }
  };

  const handleCheckOrganization = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ORGANIZATION.CHECK(orgName.trim())));
      
      if (response.data.exists) {
        toast.success(`Organization "${orgName}" found!`);
        onOrganizationVerified(orgName.trim());
      } else {
        toast.error(`Organization "${orgName}" not found.`, {
          description: 'Switch to "Create New" mode to create it',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error checking organization:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage || 'Failed to verify organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    setIsCreating(true);
    
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ORGANIZATION.CREATE(orgName.trim())));
      
      if (response.data.success || response.data.message) {
        toast.success(`Organization "${orgName}" created successfully!`);
        onOrganizationVerified(orgName.trim());
      } else if (response.data.error === 'Organization already exists') {
        toast.info(`Organization "${orgName}" already exists!`);
        onOrganizationVerified(orgName.trim());
      } else {
        toast.error('Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      if (error.response?.data?.error === 'Organization already exists') {
        toast.info(`Organization "${orgName}" already exists!`);
        onOrganizationVerified(orgName.trim());
      } else {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage || 'Failed to create organization. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Image Editor
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {mode === 'create' 
              ? 'Create a new organization' 
              : 'Enter your organization name to continue'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              Login
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'create'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </div>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization Name
            </label>
            <Input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={mode === 'create' ? 'Enter new organization name' : 'Enter organization name'}
              className="w-full"
              disabled={isLoading || isCreating}
              autoFocus
            />
            {mode === 'create' && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                A new organization folder will be created in Cloudinary
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            disabled={(isLoading || isCreating) || !orgName.trim()}
          >
            {isLoading ? 'Verifying...' : isCreating ? 'Creating...' : mode === 'create' ? 'Create Organization' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OrganizationInput;

