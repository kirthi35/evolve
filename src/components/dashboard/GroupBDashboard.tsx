import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { 
  fetchContentForGroup, 
  fetchQuestionsForVideo, 
  submitUserResponses, 
  updateUserProgress,
  fetchUserProgressForGroup
} from '../../services/airtableService';
import type { Content, Question, QuestionnaireFormData, UserProgress } from '../../types/airtable';
import Questionnaire from './Questionnaire';
import StudyTimeline from './StudyTimeline';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const GroupBDashboard: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  const completedDays = userProgress.filter(p => p.fields.Completed).length;
  const currentDay = completedDays + 1;

  // Get current day's video (assuming 7 days total)
  const currentVideo = content[currentDay - 1];
  const totalDays = 7;

  const loadData = async () => {
    if (!user.uid) return;
    try {
      setIsLoading(true);
      const [groupBContent, progress] = await Promise.all([
        fetchContentForGroup('Group B'),
        fetchUserProgressForGroup(user.uid, 'Group B')
      ]);
      setContent(groupBContent);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading Group B data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.uid]);

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

  useEffect(() => {
    if (playerReady && currentVideo && playerRef.current && !player && !videoCompleted) {
      const newPlayer = new window.YT.Player(playerRef.current, {
        height: '315',
        width: '560',
        videoId: currentVideo.fields.YouTubeVideoID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3
        },
        events: {
          onStateChange: (event: any) => {
            // Video ended
            if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoComplete();
            }
          }
        }
      });
      setPlayer(newPlayer);
    }
  }, [playerReady, currentVideo, player, videoCompleted]);

  const handleVideoComplete = async () => {
    if (!currentVideo || !user.uid) return;

    try {
      setIsSubmitting(true);
      setVideoCompleted(true);

      // Update progress
      await updateUserProgress({
        UserID: user.uid,
        VideoID: currentVideo.id,
        WatchProgress: 100,
        Completed: true,
        DayNumber: currentDay
      });

      // Fetch questions for current video
      const questions = await fetchQuestionsForVideo(currentVideo.id);
      setCurrentQuestions(questions);
      setShowQuestionnaire(true);
    } catch (error) {
      console.error('Error handling video completion:', error);
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
        UserID: user.uid!,
        QuestionID: questionId,
        Answer: answer,
        VideoID: currentVideo.id
      }));

      await submitUserResponses(responses);

      // Check if all days are completed
      if (currentDay >= totalDays) {
        navigate('/complete');
      } else {
        // Reset for next day, and refetch progress
        setShowQuestionnaire(false);
        setCurrentQuestions([]);
        setPlayer(null);
        setVideoCompleted(false);
        await loadData(); // Refetch progress
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canWatchToday = () => {
    if (currentDay > totalDays) {
      return false;
    }
    const lastCompletedVideo = userProgress
      .filter(p => p.fields.Completed && p.fields.CompletedAt)
      .sort((a, b) => new Date(b.fields.CompletedAt!).getTime() - new Date(a.fields.CompletedAt!).getTime())[0];

    if (!lastCompletedVideo) {
      return true; // First day, can always watch.
    }

    const lastCompletedDate = new Date(lastCompletedVideo.fields.CompletedAt!);
    const today = new Date();

    // Check if the last completed video was today
    if (
      lastCompletedDate.getFullYear() === today.getFullYear() &&
      lastCompletedDate.getMonth() === today.getMonth() &&
      lastCompletedDate.getDate() === today.getDate()
    ) {
      return false; // Already completed a video today
    }

    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Content Available</h2>
          <p className="mt-2 text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  if (!canWatchToday()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDay > totalDays ? 'Study Complete!' : "Today's video completed"}
          </h2>
          <p className="mt-2 text-gray-600">
            {currentDay > totalDays
              ? 'You have completed all 7 days of the study.'
              : 'Please come back tomorrow for the next video.'}
          </p>
          {currentDay > totalDays && (
            <button
              onClick={() => navigate('/complete')}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Completion Page
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Group B Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Day {currentDay} of {totalDays}
          </p>
        </div>

        {!showQuestionnaire ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentVideo?.fields.Title}
            </h2>
            
            <div className="mb-6">
              <div ref={playerRef}></div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This video will play automatically. Please watch it completely to proceed to the questions.
              </p>
              
              {videoCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 font-medium">
                    Video completed! Please answer the questions below.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Questionnaire
            questions={currentQuestions}
            onSubmit={handleQuestionnaireSubmit}
            isLoading={isSubmitting}
          />
        )}

        <StudyTimeline currentDay={currentDay} totalDays={totalDays} />
      </div>
    </div>
  );
};

export default GroupBDashboard;
