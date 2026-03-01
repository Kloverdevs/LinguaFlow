import React, { useState } from 'react';
import { useSettings } from '../../popup/hooks/useSettings';
import { SiteRule } from '@/types/settings';
import { ENGINES } from '@/constants/engines';
import { TARGET_LANGUAGES } from '@/constants/languages';
import { TranslationEngine } from '@/types/translation';

export const SiteRulesManager: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [newDomain, setNewDomain] = useState('');
  const [newEngine, setNewEngine] = useState<TranslationEngine | ''>('');
  const [newLang, setNewLang] = useState<string>('');

  if (!settings) return null;

  const rules = settings.siteRules || [];

  const handleAddRule = () => {
    if (!newDomain.trim()) return;
    
    // Clean domain (remove http://, www., paths)
    let cleanDomain = newDomain.trim().toLowerCase();
    try {
      if (!cleanDomain.startsWith('http')) {
        cleanDomain = 'https://' + cleanDomain;
      }
      const url = new URL(cleanDomain);
      cleanDomain = url.hostname.replace(/^www\./, '');
    } catch (e) {
      // Fallback if URL parsing fails
      cleanDomain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }

    // Don't add duplicates
    if (rules.some(r => r.domain === cleanDomain)) {
      alert('A rule for this domain already exists.');
      return;
    }

    const newRule: SiteRule = {
      domain: cleanDomain,
      ...(newEngine ? { engine: newEngine as TranslationEngine } : {}),
      ...(newLang ? { targetLang: newLang } : {}),
    };

    updateSettings({ siteRules: [...rules, newRule] });
    setNewDomain('');
    setNewEngine('');
    setNewLang('');
  };

  const handleRemoveRule = (domain: string) => {
    updateSettings({ siteRules: rules.filter(r => r.domain !== domain) });
  };

  return (
    <div className="space-y-4 text-gray-800">
      <div className="text-sm text-gray-500 mb-4">
        Customize translation behavior for specific websites. Site rules override your global target language and engine settings.
      </div>
      
      {/* Add Rule Form */}
      <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
        <input
          type="text"
          placeholder="e.g. wikipedia.org"
          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
        />
        <select
          className="p-2 border border-gray-300 rounded text-sm bg-white outline-none"
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
        >
          <option value="">Default Language</option>
          {TARGET_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
        <select
          className="p-2 border border-gray-300 rounded text-sm bg-white outline-none max-w-[150px]"
          value={newEngine}
          onChange={(e) => setNewEngine(e.target.value as TranslationEngine)}
        >
          <option value="">Default Engine</option>
          {ENGINES.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button
          onClick={handleAddRule}
          disabled={!newDomain.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="mt-4 border border-gray-200 rounded-md overflow-hidden bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Lang</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Engine</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.domain} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{rule.domain}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {rule.targetLang 
                      ? TARGET_LANGUAGES.find(l => l.code === rule.targetLang)?.name || rule.targetLang 
                      : <span className="text-gray-400 italic">Global Default</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {rule.engine 
                      ? ENGINES.find(e => e.id === rule.engine)?.name || rule.engine 
                      : <span className="text-gray-400 italic">Global Default</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemoveRule(rule.domain)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-gray-400 italic border border-dashed border-gray-300 rounded-md bg-gray-50">
          No custom site rules defined.
        </div>
      )}
    </div>
  );
};
