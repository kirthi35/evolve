import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { fetchContent, fetchQuestions } from '../services/airtableService';
import type { ContentItem, Question } from '../types/airtable';

const AdminContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contentData, questionsData] = await Promise.all([
        fetchContent(),
        fetchQuestions()
      ]);
      setContent(contentData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionsForContent = (contentId: string): Question[] => {
    return questions.filter(q => q.fields.LinkedVideo?.includes(contentId));
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // const handleContentAdded = () => {
  //   loadData(); // Refresh the data
  // };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Library</h2>
          <p className="text-muted-foreground">
            Manage educational content and questions for both study groups
          </p>
        </div>
        <Button onClick={() => navigate('/admin/content/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>
            All uploaded content with questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-8">
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by uploading your first video content
              </p>
              <Button onClick={() => navigate('/admin/content/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Content
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {content.map((item) => {
                const contentQuestions = getQuestionsForContent(item.id);
                const videoId = extractYouTubeVideoId(item.fields.YouTubeURL);
                const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

                return (
                  <Card key={item.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">{item.fields.Title}</h3>
                            <Badge variant={item.fields.TargetGroup === 'Group A' ? 'default' : 'secondary'}>
                              {item.fields.TargetGroup}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Order: {item.fields.Order}</span>
                            <span>Questions: {contentQuestions.length}</span>
                            <span>Created: {new Date(item.createdTime || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.fields.YouTubeURL, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Watch Video
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Video Thumbnail */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Video Preview</h4>
                          {thumbnailUrl ? (
                            <div className="relative">
                              <img
                                src={thumbnailUrl}
                                alt={item.fields.Title}
                                className="w-full h-48 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(item.fields.YouTubeURL, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Play Video
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                              <Eye className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Questions and Answers */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Questions & Answers</h4>
                          {contentQuestions.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No questions for this content</p>
                          ) : (
                            <div className="space-y-3">
                              {contentQuestions.map((question, index) => (
                                <Card key={question.id} className="p-3">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">
                                      Q{index + 1}: {question.fields.QuestionText}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {question.fields.OptionA && (
                                        <div className="p-2 bg-muted rounded">
                                          <span className="font-medium">A:</span> {question.fields.OptionA}
                                        </div>
                                      )}
                                      {question.fields.OptionB && (
                                        <div className="p-2 bg-muted rounded">
                                          <span className="font-medium">B:</span> {question.fields.OptionB}
                                        </div>
                                      )}
                                      {question.fields.OptionC && (
                                        <div className="p-2 bg-muted rounded">
                                          <span className="font-medium">C:</span> {question.fields.OptionC}
                                        </div>
                                      )}
                                      {question.fields.OptionD && (
                                        <div className="p-2 bg-muted rounded">
                                          <span className="font-medium">D:</span> {question.fields.OptionD}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContentPage;
