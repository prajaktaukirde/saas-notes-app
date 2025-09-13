'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, LogOut, Crown, Users } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    
    setUser(JSON.parse(userData));
  }, []);

  // Get auth token for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Fetch notes
  const { data: notesData = { notes: [] }, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const response = await fetch('/api/notes', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const notes = notesData.notes || [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async ({ title, content }) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowCreateModal(false);
      setNoteTitle('');
      setNoteContent('');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Upgrade tenant mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tenants/${user.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upgrade');
      }
      return response.json();
    },
    onSuccess: () => {
      // Update user data in localStorage
      const updatedUser = { ...user, tenant: { ...user.tenant, plan: 'pro' } };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Successfully upgraded to Pro plan!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleCreateNote = () => {
    if (!noteTitle.trim()) {
      alert('Please enter a note title');
      return;
    }
    createNoteMutation.mutate({ title: noteTitle, content: noteContent });
  };

  const handleUpdateNote = () => {
    if (!noteTitle.trim()) {
      alert('Please enter a note title');
      return;
    }
    updateNoteMutation.mutate({ 
      id: editingNote.id, 
      title: noteTitle, 
      content: noteContent 
    });
  };

  const handleDeleteNote = (id) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(id);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content || '');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleUpgrade = () => {
    if (confirm('Upgrade to Pro plan? This will remove the 3-note limit.')) {
      upgradeMutation.mutate();
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-300 font-jetbrains-mono">Loading...</div>
    </div>;
  }

  const isAtNoteLimit = user.tenant.plan === 'free' && notes.length >= 3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E]">
      {/* Header */}
      <header className="bg-white dark:bg-[#262626] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
              SaaS Notes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-jetbrains-mono">
              {user.tenant.name} • {user.email} • {user.role}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Plan Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.tenant.plan === 'pro' 
                ? 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {user.tenant.plan === 'pro' ? (
                <span className="flex items-center space-x-1">
                  <Crown size={12} />
                  <span>Pro Plan</span>
                </span>
              ) : (
                'Free Plan'
              )}
            </div>

            {/* Upgrade Button */}
            {user.tenant.plan === 'free' && user.role === 'admin' && (
              <button
                onClick={handleUpgrade}
                disabled={upgradeMutation.isLoading}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 font-jetbrains-mono"
              >
                {upgradeMutation.isLoading ? 'Upgrading...' : 'Upgrade to Pro'}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Notes Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
              Notes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-jetbrains-mono">
              {user.tenant.plan === 'free' ? `${notes.length}/3 notes used` : `${notes.length} notes`}
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isAtNoteLimit}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-jetbrains-mono"
          >
            <Plus size={20} />
            <span>Create Note</span>
          </button>
        </div>

        {/* Note Limit Warning */}
        {isAtNoteLimit && (
          <div className="mb-6 bg-orange-100 dark:bg-orange-900 border border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-200 px-4 py-3 rounded-lg font-jetbrains-mono">
            <div className="flex items-center justify-between">
              <span>You've reached the 3-note limit for the Free plan.</span>
              {user.role === 'admin' && (
                <button
                  onClick={handleUpgrade}
                  className="ml-4 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-300 font-jetbrains-mono">Loading notes...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 font-jetbrains-mono">Error loading notes</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-300 font-jetbrains-mono mb-4">No notes yet</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-jetbrains-mono"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-[#262626] rounded-xl shadow-2xl dark:shadow-none dark:ring-1 dark:ring-gray-700 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
                    {note.title}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm font-jetbrains-mono mb-4 line-clamp-3">
                  {note.content || 'No content'}
                </p>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 font-jetbrains-mono">
                  By {note.author_email} • {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#262626] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 font-jetbrains-mono">
              Create New Note
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono">
                  Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                  placeholder="Enter note title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono">
                  Content
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                  placeholder="Enter note content"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-jetbrains-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={createNoteMutation.isLoading}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 font-jetbrains-mono"
              >
                {createNoteMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#262626] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 font-jetbrains-mono">
              Edit Note
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono">
                  Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                  placeholder="Enter note title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono">
                  Content
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                  placeholder="Enter note content"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingNote(null);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-jetbrains-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNote}
                disabled={updateNoteMutation.isLoading}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 font-jetbrains-mono"
              >
                {updateNoteMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}