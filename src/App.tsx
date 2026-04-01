import { useState, useCallback } from 'react';
import Desktop from './components/ui/Desktop';
import BootScreen from './components/system/BootScreen';
import ErrorBoundary from './components/system/ErrorBoundary';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  const handleBootComplete = useCallback(() => {
    console.log('Boot sequence complete, transitioning to Desktop');
    setIsBooting(false);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#008080]">
        {isBooting ? (
          <BootScreen onComplete={handleBootComplete} />
        ) : (
          <Desktop />
        )}
      </div>
    </ErrorBoundary>
  );
}
