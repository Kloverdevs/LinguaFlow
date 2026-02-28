import { useState, useCallback } from 'react';
import { sendToActiveTab } from '@/shared/message-bus';

export type TranslationStatus = 'idle' | 'translating' | 'done' | 'error';

export function useTranslationState() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<TranslationStatus>('idle');

  const toggle = useCallback(async () => {
    try {
      if (isActive) {
        await sendToActiveTab({ type: 'REMOVE_TRANSLATIONS' });
        setIsActive(false);
        setStatus('idle');
      } else {
        setStatus('translating');
        await sendToActiveTab({ type: 'TRANSLATE_PAGE' });
        setIsActive(true);
        setStatus('done');
      }
    } catch {
      setStatus('error');
    }
  }, [isActive]);

  return { isActive, status, toggle };
}
