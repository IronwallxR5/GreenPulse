import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

export default function ServerNotice() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenNotice = localStorage.getItem('server_notice_shown');
    if (!hasSeenNotice) {
      // Add a slight delay before showing the notice
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('server_notice_shown', 'true');
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm fade-scale-in">
      <div className="surface-card flex items-start gap-4 p-4 shadow-warm-lg relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 rounded-full bg-forest-100 opacity-50 blur-xl"></div>
        
        <div className="flex-shrink-0 pt-0.5 relative z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600">
            <Info className="h-5 w-5" />
          </div>
        </div>
        
        <div className="flex-1 relative z-10">
          <h3 className="text-sm font-semibold text-warm-900 mb-1">Server Cold Start</h3>
          <p className="text-sm text-warm-600 leading-relaxed">
            Welcome! Our backend is hosted on Render's free tier. It may take <strong>2-3 minutes</strong> to spin up initially. Thanks for your patience!
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleDismiss}
              className="text-xs font-medium bg-forest-600 hover:bg-forest-700 text-white px-3 py-1.5 rounded-md transition-colors shadow-sm focus-ring"
            >
              Got it
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-50 rounded-md transition-colors z-10 focus-ring"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
