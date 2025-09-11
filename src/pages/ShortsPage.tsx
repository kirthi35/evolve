import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Button } from '../components/ui/button';
import { ChevronUp, ChevronDown, Maximize, Minimize } from 'lucide-react';

const ShortsPage: React.FC = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Sample shorts data - in a real app, this would come from your API/Airtable
  const shorts = [
    {
      id: '8-fWbQAoqPI',
      title: 'Brian Balfour: How Granola B',
      description: 'AI Engineer insights'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Sample Short 2',
      description: 'Another educational video'
    },
    {
      id: 'ScMzIvxBSi4',
      title: 'Sample Short 3',
      description: 'More learning content'
    }
  ];

  const [currentShortIndex, setCurrentShortIndex] = useState(0);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto full-screen on mobile
      if (window.innerWidth < 768) {
        setIsFullScreen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextShort = () => {
    setCurrentShortIndex((prev) => (prev + 1) % shorts.length);
  };

  const prevShort = () => {
    setCurrentShortIndex((prev) => (prev - 1 + shorts.length) % shorts.length);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle touch events for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && currentShortIndex < shorts.length - 1) {
      nextShort();
    }
    if (isDownSwipe && currentShortIndex > 0) {
      prevShort();
    }
  };

  const breadcrumbs = [
    { label: 'Content', href: '/content' },
    { label: 'Shorts' }
  ];

  const currentShort = shorts[currentShortIndex];

  // Full screen mobile layout
  if (isFullScreen && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header with minimize button */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="text-white hover:bg-white/20"
            >
              <Minimize className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium">{currentShort.title}</span>
          </div>
        </div>

        {/* Video container - takes full height */}
        <div 
          className="flex-1 relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${currentShort.id}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
            title={currentShort.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />

          {/* Navigation overlay */}
          {shorts.length > 1 && (
            <>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevShort}
                  className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                  disabled={currentShortIndex === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={nextShort}
                  className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                  disabled={currentShortIndex === shorts.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Swipe indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-xs text-center">
                <p>Swipe up/down to navigate</p>
                <p>{currentShortIndex + 1} of {shorts.length}</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop or non-fullscreen mobile layout
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col items-center space-y-4">
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={toggleFullScreen}
            className="flex items-center space-x-2"
          >
            <Maximize className="h-4 w-4" />
            <span className="hidden sm:inline">Full Screen</span>
          </Button>
          {shorts.length > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevShort}
                disabled={currentShortIndex === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentShortIndex + 1} of {shorts.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextShort}
                disabled={currentShortIndex === shorts.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Video container */}
        <div className="relative w-full max-w-sm mx-auto">
          <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${currentShort.id}?rel=0&modestbranding=1`}
              title={currentShort.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          
          {/* Video info */}
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-lg">{currentShort.title}</h3>
            {currentShort.description && (
              <p className="text-muted-foreground text-sm mt-1">{currentShort.description}</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ShortsPage;
