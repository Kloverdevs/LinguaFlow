import React, { useState, useEffect } from 'react';
import { sendToBackground } from '@/shared/message-bus';
import { MessageResponse } from '@/types/messages';

export function CacheManager() {
  const [count, setCount] = useState<number>(0);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    try {
      const response = await sendToBackground<{ count: number }>({
        type: 'GET_CACHE_STATS',
      }) as MessageResponse<{ count: number }>;

      if (response.success) {
        setCount(response.data.count);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      await sendToBackground({ type: 'CLEAR_CACHE' });
      setCount(0);
    } catch {
      // Ignore
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-name">Translation Cache</span>
        <span className="setting-desc">{count} cached translations</span>
      </div>
      <button
        className="cache-clear-btn"
        onClick={handleClear}
        disabled={clearing || count === 0}
      >
        {clearing ? 'Clearing...' : 'Clear'}
      </button>
    </div>
  );
}
