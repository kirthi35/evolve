import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { 
  fetchContentForGroup, 
  fetchQuestionsForVideo, 
  submitUserResponses, 
  upsertUserProgress,
  fetchUserProgress
} from '../../services/airtableService';
import type { ContentItem, QuestionnaireFormData, AnswerOption } from '../../types/airtable';
import Questionnaire, { type QuestionWithAnswerOptions } from './Questionnaire';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const GroupADashboard: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<QuestionWithAnswerOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Callback ref to ensure we know when the element is available
  const setPlayerRef = (element: HTMLDivElement | null) => {
    playerRef.current = element;
    if (element) {
      console.log('Player ref element is now available');
      // Trigger player creation when element becomes available
      setTimeout(() => {
        if (playerReady && currentVideo && !player && playerRef.current) {
          console.log('Triggering player creation from callback ref');
          createPlayerFromRef();
        }
      }, 50);
    }
  };
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  const currentVideo = content[currentVideoIndex];

  // Function to create player (extracted for reuse)
  const createPlayerFromRef = () => {
    if (!playerRef.current || !currentVideo) return;
    
    const videoId = extractYouTubeVideoId(currentVideo.fields.YouTubeURL);
    
    console.log('Creating YouTube player with video ID:', videoId);
    
    if (!videoId) {
      console.error('Could not extract video ID from URL:', currentVideo.fields.YouTubeURL);
      return;
    }
    
    let lastSavedProgress = 0; // Track last saved progress to avoid redundant saves
    let progressInterval: NodeJS.Timeout | null = null; // Track the interval
    let isSavingProgress = false; // Prevent concurrent saves
    
    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        controls: 1,
        rel: 0,
        showinfo: 0,
        modestbranding: 1
      },
      events: {
        onStateChange: (event: any) => {
          console.log('YouTube player state changed:', event.data);
          
          if (event.data === window.YT.PlayerState.PLAYING) {
            console.log('Video started playing - starting progress tracking');
            // Clear any existing interval first
            if (progressInterval) {
              clearInterval(progressInterval);
            }
            
            // Start tracking progress
            progressInterval = setInterval(async () => {
              if (newPlayer && newPlayer.getCurrentTime && newPlayer.getDuration) {
                const currentTime = newPlayer.getCurrentTime();
                const duration = newPlayer.getDuration();
                const progress = (currentTime / duration) * 100;
                setWatchProgress(progress);
                
                // Save progress every 10% increment and at key milestones
                const shouldSave = progress > 0 && (
                  Math.floor(progress / 10) > Math.floor(lastSavedProgress / 10) || // Every 10%
                  (progress >= 25 && lastSavedProgress < 25) || // 25% milestone
                  (progress >= 50 && lastSavedProgress < 50) || // 50% milestone
                  (progress >= 75 && lastSavedProgress < 75) || // 75% milestone
                  (progress >= 90 && lastSavedProgress < 90)    // 90% milestone
                );
                
                if (shouldSave && user.airtableRecord && !isSavingProgress) {
                  try {
                    isSavingProgress = true;
                    console.log(`Saving progress: ${Math.floor(progress)}% (last saved: ${Math.floor(lastSavedProgress)}%)`);
                    await upsertUserProgress({
                      userRecordId: user.airtableRecord.id,
                      videoRecordId: currentVideo.id,
                      WatchPercentage: Math.floor(progress),
                      Status: progress >= 90 ? 'Completed' : 'In Progress'
                    });
                    lastSavedProgress = progress;
                    console.log(`Progress saved successfully: ${Math.floor(progress)}%`);
                  } catch (error) {
                    console.error('Error saving progress:', error);
                  } finally {
                    isSavingProgress = false;
                  }
                }
                
                if (progress >= 90) {
                  console.log('Video completed - clearing progress interval');
                  if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                  }
                }
              }
            }, 1000);
          } else if (event.data === window.YT.PlayerState.PAUSED || 
                     event.data === window.YT.PlayerState.ENDED ||
                     event.data === window.YT.PlayerState.CUED) {
            // Clear interval when video is paused, ended, or cued
            console.log('Video paused/ended/cued - clearing progress interval');
            if (progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }
          }
        }
      }
    });
    setPlayer(newPlayer);
    console.log('YouTube player created and set');
  };

  // Function to extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      // Handle youtu.be short URLs
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.substring(1); // Remove the leading '/'
      }
      
      // Handle youtube.com URLs
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        // Standard watch URLs
        const vParam = urlObj.searchParams.get('v');
        if (vParam) return vParam;
        
        // Handle /embed/ URLs
        if (urlObj.pathname.startsWith('/embed/')) {
          return urlObj.pathname.substring(7); // Remove '/embed/'
        }
        
        // Handle /shorts/ URLs
        if (urlObj.pathname.startsWith('/shorts/')) {
          return urlObj.pathname.substring(8); // Remove '/shorts/'
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting YouTube video ID:', error);
      return '';
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      try {
        const groupAContent = await fetchContentForGroup('Group A');
        setContent(groupAContent);
        
        // Load existing progress if user is available
        if (user.airtableRecord && groupAContent.length > 0) {
          try {
            const userProgressRecords = await fetchUserProgress(user.airtableRecord.id);
            const currentVideoProgress = userProgressRecords.find(
              p => p.fields.Video?.[0] === groupAContent[currentVideoIndex]?.id
            );
            if (currentVideoProgress) {
              setWatchProgress(currentVideoProgress.fields.WatchPercentage);
              console.log(`Loaded existing progress: ${currentVideoProgress.fields.WatchPercentage}%`);
            }
          } catch (error) {
            console.error('Error loading user progress:', error);
          }
        }
      } catch (error) {
        console.error('Error loading Group A content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [user.airtableRecord, currentVideoIndex]);

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  // useEffect to create player when conditions are met
  useEffect(() => {
    console.log('Player useEffect triggered:', { playerReady, currentVideo: !!currentVideo, playerRefCurrent: !!playerRef.current, player: !!player });
    
    if (playerReady && currentVideo && !player && playerRef.current) {
      createPlayerFromRef();
    }
  }, [playerReady, currentVideo, player]);

  // Additional useEffect to trigger when playerRef becomes available
  useEffect(() => {
    if (playerRef.current && playerReady && currentVideo && !player) {
      console.log('DOM element now available, triggering player creation');
      // This will trigger the above useEffect by changing a dependency
    }
  }, [playerRef.current, playerReady, currentVideo, player]);

  const handleProceedToQuestions = async () => {
    if (!currentVideo || !user.uid) return;

    try {
      setIsSubmitting(true);
      
      // Update progress to 100%
      await upsertUserProgress({
        userRecordId: user.airtableRecord!.id,
        videoRecordId: currentVideo.id,
        WatchPercentage: 100,
        Status: 'Completed'
      });

      // Fetch questions for current video
      const questions = await fetchQuestionsForVideo(currentVideo.id);
      
      // Convert questions to QuestionWithAnswerOptions format using built-in options
      const questionsWithOptions: QuestionWithAnswerOptions[] = questions.map(q => ({
        ...q,
        answerOptions: [
          { id: `${q.id}-a`, fields: { Question: [q.id], OptionText: q.fields.OptionA } },
          { id: `${q.id}-b`, fields: { Question: [q.id], OptionText: q.fields.OptionB } },
          { id: `${q.id}-c`, fields: { Question: [q.id], OptionText: q.fields.OptionC } },
          { id: `${q.id}-d`, fields: { Question: [q.id], OptionText: q.fields.OptionD } },
        ] as AnswerOption[]
      }));
      
      setCurrentQuestions(questionsWithOptions);
      setShowQuestionnaire(true);
    } catch (error) {
      console.error('Error proceeding to questions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
    if (!currentVideo || !user.uid) return;

    try {
      setIsSubmitting(true);

      // Submit responses
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        User: [user.airtableRecord!.id],
        Question: [questionId],
        SelectedAnswer: answer,
      }));

      await submitUserResponses(responses);

      // Move to next video or complete
      if (currentVideoIndex < content.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
        setWatchProgress(0);
        setShowQuestionnaire(false);
        setCurrentQuestions([]);
        setPlayer(null);
      } else {
        // All videos completed
        navigate('/complete');
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold">No Content Available</h2>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">Please contact support for assistance.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold">Group A Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Video {currentVideoIndex + 1} of {content.length}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 xl:col-span-3">
          {!showQuestionnaire ? (
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl">{currentVideo?.fields.Title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden min-h-[300px] md:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px]">
                  <div ref={setPlayerRef} className="absolute inset-0"></div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>Watch Progress</span>
                    <span>{Math.round(watchProgress)}%</span>
                  </div>
                  <Progress value={Math.min(watchProgress, 100)} className="h-2" />
                </div>

                <Button
                  onClick={handleProceedToQuestions}
                  disabled={watchProgress < 90 || isSubmitting}
                  className="w-full py-3 text-sm md:text-base"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Questions'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Questionnaire
              questions={currentQuestions}
              onSubmit={handleQuestionnaireSubmit}
              isLoading={isSubmitting}
            />
          )}
        </div>

        {/* Upcoming Videos Sidebar */}
        <div className="lg:col-span-1 xl:col-span-1">
          <Card className="h-fit sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Upcoming Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
              {content.map((video, index) => (
                <div
                  key={video.id}
                  className={`p-3 rounded-lg border ${
                    index === currentVideoIndex
                      ? 'border-primary bg-primary/5'
                      : index < currentVideoIndex
                      ? 'border-green-500 bg-green-50'
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <h4 className="font-medium text-xs md:text-sm leading-tight">
                    {index + 1}. {video.fields.Title}
                  </h4>
                  <Badge 
                    variant={
                      index < currentVideoIndex
                        ? 'default'
                        : index === currentVideoIndex
                        ? 'secondary'
                        : 'outline'
                    }
                    className="mt-2 text-xs"
                  >
                    {index < currentVideoIndex
                      ? 'Completed'
                      : index === currentVideoIndex
                      ? 'Current'
                      : 'Locked'
                    }
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroupADashboard;
