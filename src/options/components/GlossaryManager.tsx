import React, { useEffect, useState } from 'react';
import { GlossaryEntry } from '@/types/glossary';
import { getGlossary, saveGlossaryEntry, removeGlossaryEntry, clearGlossary, exportGlossaryAsCsv } from '@/shared/glossary-store';

export const GlossaryManager: React.FC = () => {
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newContext, setNewContext] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    loadGlossary();
  }, []);

  const loadGlossary = async () => {
    setIsLoading(true);
    const list = await getGlossary();
    setGlossary(list.sort((a, b) => b.timestamp - a.timestamp));
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    
    await saveGlossaryEntry({
      sourceTerm: newSource.trim(),
      targetTerm: newTarget.trim(),
      context: newContext.trim() || undefined,
      caseSensitive
    });
    
    setNewSource('');
    setNewTarget('');
    setNewContext('');
    setCaseSensitive(false);
    
    await loadGlossary();
  };

  const handleRemove = async (id: string) => {
    await removeGlossaryEntry(id);
    setGlossary(glossary.filter(v => v.id !== id));
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all glossary terms? This cannot be undone.')) {
      await clearGlossary();
      setGlossary([]);
    }
  };

  const handleExportCsv = () => {
    if (glossary.length === 0) return;
    const csvContent = exportGlossaryAsCsv(glossary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `linguaflow_glossary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading glossary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Custom Glossary</h2>
        <div className="space-x-2">
          <button
            onClick={handleExportCsv}
            disabled={glossary.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={glossary.length === 0}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        Define custom translation pairs to enforce consistent vocabulary (e.g., brand names, industry terms). LinguaFlow will prioritize these rules over general translations.
      </div>

      {/* Add New Entry Form */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Source Term</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Apple"
            value={newSource}
            onChange={e => setNewSource(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Target Term</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Apple (Company)"
            value={newTarget}
            onChange={e => setNewTarget(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Context (Optional)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Brand name"
            value={newContext}
            onChange={e => setNewContext(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="md:col-span-2 flex items-center h-9">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded text-blue-600 focus:ring-blue-500"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
            />
            <span>Case Sensitive</span>
          </label>
        </div>
        <div className="md:col-span-1">
          <button
            onClick={handleAdd}
            disabled={!newSource.trim() || !newTarget.trim()}
            className="w-full h-9 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {glossary.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">Your glossary is empty.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {glossary.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.sourceTerm}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-indigo-600 font-medium">{entry.targetTerm}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={entry.context}>
                      {entry.context || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.caseSensitive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Case Sensitive
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Any case</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
