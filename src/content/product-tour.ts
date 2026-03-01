import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getSettings, saveSettings } from '@/shared/storage';

let isTourRunning = false;

export async function launchProductTour(force: boolean = false): Promise<void> {
  const settings = await getSettings();
  
  // Only auto-run once
  if (!force && settings.tourCompleted) return;
  if (isTourRunning) return;

  isTourRunning = true;

  const steps = [
    {
      element: '#immersive-translate-fab',
      popover: {
        title: 'Your Translation Hub',
        description: 'Click this floating button anytime to access translation settings, force a page translation, or view secondary engines.',
        side: 'left',
        align: 'end'
      }
    },
    {
      element: document.body, // Catch-all for a visual hover demonstration
      popover: {
        title: 'Hover to Translate',
        description: 'Hover mode is enabled! Simply hover your mouse over any foreign paragraph to instantly reveal its translation inline without clicking.',
        side: 'top',
        align: 'center'
      }
    }
  ];

  const tour = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    onDestroyStarted: () => {
      if (!tour.hasNextStep() || confirm("Are you sure you want to exit the tour?")) {
        tour.destroy();
        isTourRunning = false;
        
        // Mark as completed in storage
        getSettings().then(current => {
          saveSettings({ ...current, tourCompleted: true });
        });
      }
    }
  });

  tour.setSteps(steps as any);
  tour.drive();
}
