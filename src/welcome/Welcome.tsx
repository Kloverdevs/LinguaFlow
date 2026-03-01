import React, { useState } from 'react';
import { getSettings, saveSettings } from '@/shared/storage';
import { TranslationEngine } from '@/types/translation';

const Welcome: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<TranslationEngine>(TranslationEngine.OPENAI);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const completeSetup = async (launchTour: boolean = false) => {
    const settings = await getSettings();
    const updatedSettings = {
      ...settings,
      onboardingCompleted: true,
      engineConfigs: {
        ...settings.engineConfigs,
        [selectedEngine]: {
          ...(settings.engineConfigs[selectedEngine] || {}),
          apiKey: apiKey || settings.engineConfigs[selectedEngine]?.apiKey || ''
        }
      }
    };
    
    if (apiKey) {
      updatedSettings.engine = selectedEngine;
    }
    
    await saveSettings(updatedSettings);
    
    if (launchTour) {
      // Launch tour by opening a dummy page (e.g. google) with the hash OR just using the active tab
      chrome.tabs.create({ url: 'https://example.com#linguaflow-tour' });
    }
    
    window.close();
  };

  const steps = [
    {
      title: "Welcome to LinguaFlow",
      desc: "Bilingual, fully immersive translation that replaces text seamlessly while preserving the webpage's original layout.",
      visual: (
        <div className="wf-hero-card">
          <div className="wf-hero-t">T</div>
          <div className="wf-hero-lines">
            <div className="wf-hero-line wf-hero-line-1"></div>
            <div className="wf-hero-line wf-hero-line-2"></div>
            <div className="wf-hero-line wf-hero-line-3"></div>
          </div>
        </div>
      )
    },
    {
      title: "How to translate",
      desc: "Press Alt + A any time to toggle translation. Or, select text and simply hover over 'Translate' to see definitions and secondary engine comparisons.",
      visual: (
        <div className="wf-demo-block">
          <div className="wf-demo-row">
            <span className="wf-demo-orig">Bonjour le monde</span>
            <span className="wf-demo-arrow">→</span>
            <span className="wf-demo-trans">Hello world</span>
          </div>
        </div>
      )
    },
    {
      title: "Plug in your API Key",
      desc: "LinguaFlow translates perfectly via Google or DeepL for free. For maximum quality, plug in an OpenAI or Anthropic API key now natively.",
      visual: (
        <div className="wf-api-setup">
          <div className="wf-engine-picker">
            <button 
              className={`wf-engine-btn ${selectedEngine === TranslationEngine.OPENAI ? 'active' : ''}`}
              onClick={() => setSelectedEngine(TranslationEngine.OPENAI)}
            >OpenAI</button>
            <button 
              className={`wf-engine-btn ${selectedEngine === TranslationEngine.CLAUDE ? 'active' : ''}`}
              onClick={() => setSelectedEngine(TranslationEngine.CLAUDE)}
            >Claude</button>
          </div>
          <input 
            type="password" 
            placeholder={`Enter your ${selectedEngine === TranslationEngine.OPENAI ? 'sk-...' : 'sk-ant-...'} key (optional)`}
            className="wf-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="wf-input-hint">Your key is stored 100% locally on your device.</p>
        </div>
      )
    }
  ];

  return (
    <div className="welcome-container">
      <div className="welcome-blobs">
        <div className="welcome-blob welcome-blob-1"></div>
        <div className="welcome-blob welcome-blob-2"></div>
      </div>
      
      <div className="welcome-card glassmorphic">
        <div className="welcome-visual-area">
          {steps[currentStep].visual}
        </div>
        
        <div className="welcome-content-area">
          <div className="welcome-dots">
            {steps.map((_, i) => (
              <span key={i} className={`welcome-dot ${i === currentStep ? 'active' : ''}`} />
            ))}
          </div>
          
          <h2 className="welcome-title">{steps[currentStep].title}</h2>
          <p className="welcome-desc">{steps[currentStep].desc}</p>
          
          <div className="welcome-actions">
            {currentStep > 0 && (
              <button className="welcome-btn secondary" onClick={handleBack}>Back</button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button className="welcome-btn primary" onClick={handleNext}>Next</button>
            ) : (
              <>
                <button className="welcome-btn primary cta-glow" onClick={() => completeSetup(true)}>
                  Take the Tour
                </button>
                <button className="welcome-btn secondary" onClick={() => completeSetup(false)}>
                  Done
                </button>
              </>
            )}
          </div>
          
          {currentStep < steps.length - 1 && (
            <button className="welcome-skip" onClick={() => completeSetup(false)}>Skip setup</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
