import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import {
  fetchContentForGroup,
  fetchQuestionsForVideo,
  fetchAnswerOptions,
  submitUserResponses,
  upsertUserProgress,
  fetchUserProgress,
} from '../../services/airtableService';
import type { Content, UserProgress, QuestionnaireFormData } from '../../types/airtable';
import Questionnaire, { QuestionWithAnswerOptions } from './Questionnaire';
import { Skeleton } from '../ui/skeleton';
import StudyTimeline from './StudyTimeline';

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

const GroupBDashboard: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswerOptions[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  const getDaysSince = (dateString?: string): number => {
    if (!dateString) return 0;
    const givenDate = new Date(dateString);
    const today = new Date();
    givenDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - givenDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const journeyDay = useMemo(() => getDaysSince(user.airtableRecord?.createdTime) + 1, [user.airtableRecord]);
  const todaysVideo = useMemo(() => content.find(c => c.fields.ReleaseDay === journeyDay), [content, journeyDay]);
  const isTodaysVideoCompleted = useMemo(() => {
    if (!todaysVideo) return false;
    return userProgress.some(p => p.fields.Video?.[0] === todaysVideo.id && p.fields.Status === 'Completed');
  }, [userProgress, todaysVideo]);
  const totalDays = useMemo(() => Math.max(...content.map(c => c.fields.Order || 0), 7), [content]);

  useEffect(() => {
    const loadData = async () => {
      if (!user.airtableRecord) return;
      setIsLoading(true);
      try {
        const [groupBContent, progressRecords] = await Promise.all([
          fetchContentForGroup('Group B'),
          fetchUserProgress(user.airtableRecord.id),
        ]);
        setContent(groupBContent.sort((a, b) => (a.fields.Order || 0) - (b.fields.Order || 0)));
        setUserProgress(progressRecords);
      } catch (error) {
        console.error('Error loading Group B data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user.airtableRecord?.id) {
      loadData();
    }
  }, [user.airtableRecord]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        if (todaysVideo && playerRef.current && !isTodaysVideoCompleted) {
          createPlayer();
        }
      };
    } else if (todaysVideo && playerRef.current && !player && !isTodaysVideoCompleted) {
      createPlayer();
    }
  }, [todaysVideo, isTodaysVideoCompleted]);

  const createPlayer = () => {
    if (!todaysVideo || !window.YT || !window.YT.Player) return;
    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '315', width: '560',
      videoId: new URL(todaysVideo.fields.YouTubeURL).searchParams.get('v') || '',
      playerVars: { autoplay: 1, controls: 0, rel: 0, showinfo: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3 },
      events: { onStateChange: (event: any) => event.data === window.YT.PlayerState.ENDED && handleVideoComplete() },
    });
    setPlayer(newPlayer);
  };

  const handleVideoComplete = async () => {
    if (!todaysVideo || !user.airtableRecord) return;
    setIsSubmitting(true);
    try {
      await upsertUserProgress({
        userRecordId: user.airtableRecord.id,
        videoRecordId: todaysVideo.id,
        WatchPercentage: 100,
        Status: 'Completed',
      });
      const fetchedQuestions = await fetchQuestionsForVideo(todaysVideo.id);
      if (fetchedQuestions.length > 0) {
        const optionIds = fetchedQuestions.flatMap(q => q.fields.AnswerOptions || []);
        const options = await fetchAnswerOptions(optionIds);
        const questionsWithOptions = fetchedQuestions.map(q => ({
          ...q,
          answerOptions: options.filter(opt => q.fields.AnswerOptions?.includes(opt.id)),
        }));
        setQuestions(questionsWithOptions);
        setShowQuestionnaire(true);
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Error handling video completion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
    if (!user.airtableRecord) return;
    setIsSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        User: [user.airtableRecord!.id],
        Question: [questionId],
        SelectedAnswer: answer,
      }));
      await submitUserResponses(responses);
      if (journeyDay >= totalDays) {
        navigate('/complete');
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (journeyDay > totalDays) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold">Study Complete!</h2>
        <p>You have completed all days of the study.</p>
        <Button onClick={() => navigate('/complete')} className="mt-4">View Completion Page</Button>
      </div>
    );
  }

  if (isTodaysVideoCompleted && !showQuestionnaire) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold">Day {journeyDay} Complete</h2>
        <p>Please come back tomorrow for the next video.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Group B Dashboard</h1>
        <p className="text-muted-foreground">Day {journeyDay} of {totalDays}</p>
      </div>
      {!showQuestionnaire ? (
        todaysVideo ? (
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{todaysVideo.fields.Title}</h2>
            <div ref={playerRef} className="w-full aspect-video bg-black rounded" />
            <p className="text-center text-muted-foreground mt-4">
              Please watch the video to proceed. It cannot be replayed.
            </p>
          </div>
        ) : (
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold">No video for today.</h2>
            <p>Please check back later or contact support.</p>
          </div>
        )
      ) : (
        <Questionnaire
          questions={questions}
          onSubmit={handleQuestionnaireSubmit}
          isLoading={isSubmitting}
        />
      )}
      <div className="mt-8">
        <StudyTimeline currentDay={journeyDay} totalDays={totalDays} />
      </div>
    </div>
  );
};

export default GroupBDashboard;
