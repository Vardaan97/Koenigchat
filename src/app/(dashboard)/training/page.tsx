'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, Flag, CheckCircle, XCircle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Message } from '@/types';

interface TrainingItem {
  id: string;
  message_id: string;
  user_input: string;
  original_response: string;
  improved_response?: string;
  quality_rating?: number;
  feedback_notes?: string;
  is_approved: boolean;
  created_at: string;
}

export default function TrainingPage() {
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [unreviewedMessages, setUnreviewedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avg_rating: 0,
    flagged_count: 0,
    unreviewed_count: 0,
  });
  const [activeTab, setActiveTab] = useState<'review' | 'training'>('review');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [suggestedResponse, setSuggestedResponse] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/chat/feedback?days=7');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Fetch unreviewed messages
      const messagesRes = await fetch('/api/training/unreviewed?limit=20');
      const messagesData = await messagesRes.json();
      setUnreviewedMessages(messagesData.data || []);

      // Fetch training examples
      const trainingRes = await fetch('/api/training/examples?limit=20');
      const trainingData = await trainingRes.json();
      setItems(trainingData.data || []);
    } catch (error) {
      console.error('Failed to fetch training data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRate = async (messageId: string, rating: number) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, rating }),
      });
      fetchData();
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  const handleFlag = async (messageId: string) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          flagged: true,
          flag_reason: 'Marked for improvement',
        }),
      });
      fetchData();
    } catch (error) {
      console.error('Flagging failed:', error);
    }
  };

  const handleSuggestImprovement = async () => {
    if (!selectedMessage || !suggestedResponse.trim()) return;

    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: selectedMessage.id,
          suggested_response: suggestedResponse,
          flagged: true,
          flag_reason: 'Improved response suggested',
        }),
      });
      setSelectedMessage(null);
      setSuggestedResponse('');
      fetchData();
    } catch (error) {
      console.error('Suggestion failed:', error);
    }
  };

  const handleApproveTraining = async (exampleId: string, approve: boolean) => {
    try {
      await fetch(`/api/training/examples/${exampleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: approve }),
      });
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Answer Training"
        description="Rate AI responses and improve chatbot quality"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Avg. Rating (7 days)"
            value={stats.avg_rating.toFixed(1)}
            icon={Star}
            iconColor="text-yellow-500"
          />
          <StatsCard
            title="Flagged Responses"
            value={stats.flagged_count}
            icon={Flag}
            iconColor="text-red-500"
          />
          <StatsCard
            title="Pending Review"
            value={stats.unreviewed_count}
            icon={MessageSquare}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Training Examples"
            value={items.length}
            icon={CheckCircle}
            iconColor="text-green-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'review' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('review')}
          >
            Review Responses
            {stats.unreviewed_count > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.unreviewed_count}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'training' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('training')}
          >
            Training Examples
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : activeTab === 'review' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unreviewed Messages List */}
            <div className="space-y-4">
              <h3 className="font-medium">Unreviewed AI Responses</h3>
              {unreviewedMessages.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm text-muted-foreground">
                      No pending responses to review
                    </p>
                  </CardContent>
                </Card>
              ) : (
                unreviewedMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      setSuggestedResponse('');
                    }}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRate(message.id, star);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-yellow-500"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlag(message.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-red-500"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Improvement Panel */}
            <div>
              <h3 className="font-medium mb-4">Suggest Improvement</h3>
              {selectedMessage ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Original Response</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm">{selectedMessage.content}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Suggest a better response:
                      </label>
                      <Textarea
                        value={suggestedResponse}
                        onChange={(e) => setSuggestedResponse(e.target.value)}
                        placeholder="Write a better, more concise response..."
                        rows={6}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSuggestImprovement} disabled={!suggestedResponse.trim()}>
                        Submit Improvement
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Select a message from the list to suggest improvements
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Training Examples Tab */
          <div className="space-y-4">
            <h3 className="font-medium">Training Examples for AI Improvement</h3>
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">No training examples yet</p>
                  <p className="text-sm text-muted-foreground">
                    Flag responses and suggest improvements to create training data
                  </p>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge variant={item.is_approved ? 'success' : 'secondary'}>
                        {item.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                      {item.quality_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{item.quality_rating}/5</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">User Input:</p>
                      <p className="text-sm bg-blue-50 rounded p-2">{item.user_input}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Original Response:</p>
                      <p className="text-sm bg-slate-50 rounded p-2">{item.original_response}</p>
                    </div>

                    {item.improved_response && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Improved Response:</p>
                        <p className="text-sm bg-green-50 rounded p-2">{item.improved_response}</p>
                      </div>
                    )}

                    {!item.is_approved && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApproveTraining(item.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveTraining(item.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
