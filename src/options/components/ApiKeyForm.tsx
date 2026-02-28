import React, { useState } from 'react';
import { TranslationEngine } from '@/types/translation';
import { sendToBackground } from '@/shared/message-bus';
import { MessageResponse } from '@/types/messages';

interface Props {
  label: string;
  engine: TranslationEngine;
  apiKey: string;
  onSave: (key: string) => void;
}

export function ApiKeyForm({ label, engine, apiKey, onSave }: Props) {
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleSave = () => {
    onSave(key);
    setValidation(null);
  };

  const handleValidate = async () => {
    // Save first so the background can read it
    onSave(key);
    setValidating(true);
    setValidation(null);

    try {
      const response = await sendToBackground<{ valid: boolean; error?: string }>({
        type: 'VALIDATE_ENGINE',
        payload: { engine },
      }) as MessageResponse<{ valid: boolean; error?: string }>;

      if (response.success) {
        setValidation(response.data);
      } else {
        setValidation({ valid: false, error: response.error });
      }
    } catch (err) {
      setValidation({ valid: false, error: (err as Error).message });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="form-section">
      <h3>{label} API Key</h3>
      <div className="form-group">
        <div className="form-row">
          <input
            className="form-input"
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={`Enter your ${label} API key`}
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary" onClick={() => setShowKey(!showKey)}>
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <div className="form-row">
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={handleValidate} disabled={!key || validating}>
          {validating ? 'Validating...' : 'Validate'}
        </button>
      </div>
      {validation && (
        <div className={`validation-status ${validation.valid ? 'success' : 'error'}`}>
          {validation.valid ? 'API key is valid' : `Invalid: ${validation.error}`}
        </div>
      )}
    </div>
  );
}
