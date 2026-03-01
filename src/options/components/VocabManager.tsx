import React, { useEffect, useState } from 'react';
import { VocabEntry } from '@/types/vocabulary';
import { getVocabulary, removeVocabEntry, clearVocabulary, exportVocabAsCsv } from '@/shared/vocab-store';

export const VocabManager: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    setIsLoading(true);
    const list = await getVocabulary();
    // Sort by newest first
    setVocabList(list.sort((a, b) => b.timestamp - a.timestamp));
    setIsLoading(false);
  };

  const handleRemove = async (id: string) => {
    await removeVocabEntry(id);
    setVocabList(vocabList.filter(v => v.id !== id));
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all saved vocabulary? This cannot be undone.')) {
      await clearVocabulary();
      setVocabList([]);
    }
  };

  const handleExportCsv = () => {
    if (vocabList.length === 0) return;
    const csvContent = exportVocabAsCsv(vocabList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `linguaflow_vocab_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading vocabulary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Saved Vocabulary</h2>
        <div className="space-x-2">
          <button
            onClick={handleExportCsv}
            disabled={vocabList.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={vocabList.length === 0}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {vocabList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">You haven't saved any words yet.</p>
          <p className="text-sm text-gray-400">
            Double-click a word or use the selection tooltip to save vocabulary.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word/Phrase</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vocabList.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.text}</div>
                    <div className="text-xs text-gray-500">
                      {entry.sourceLang.toUpperCase()} → {entry.targetLang.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{entry.translation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={entry.context}>
                      {entry.context || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
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
