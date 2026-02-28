import React from 'react';
import { TranslationStatus } from '../hooks/useTranslationState';

interface Props {
  status: TranslationStatus;
}

const STATUS_MAP: Record<TranslationStatus, { text: string; className: string }> = {
  idle: { text: 'Ready to translate', className: 'idle' },
  translating: { text: 'Translating...', className: 'translating' },
  done: { text: 'Translation complete', className: 'done' },
  error: { text: 'Translation failed', className: 'error' },
};

export function StatusIndicator({ status }: Props) {
  const info = STATUS_MAP[status];

  return (
    <div className={`status-indicator ${info.className}`}>
      {info.text}
    </div>
  );
}
