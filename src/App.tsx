import { useState, useCallback } from 'react';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';
import ErrorBoundary from './components/ErrorBoundary';

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
