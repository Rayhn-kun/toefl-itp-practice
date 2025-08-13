import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, HelpCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz } from '@/contexts/QuizContext';
import QuestionCard from '@/components/QuestionCard';
import UserNameInput from '@/components/UserNameInput';
import QuizResults from '@/components/QuizResults';
import { saveQuizResult } from '@/lib/supabase';

const Quiz: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('structure');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate progress
  const totalQuestions = state.questions.length;
  const answeredQuestions = state.userAnswers.filter(answer => answer !== null).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;
  
  // Filter questions by type
  const structureQuestions = state.questions.filter(q => q.type === 'Structure');
  const writtenExpressionQuestions = state.questions.filter(q => q.type === 'Written Expression');
  
  // Get current question based on active tab
  const getCurrentQuestion = () => {
    if (activeTab === 'structure') {
      const index = state.currentQuestionIndex < structureQuestions.length 
        ? state.currentQuestionIndex 
        : 0;
      return structureQuestions[index];
    } else {
      const index = state.currentQuestionIndex < writtenExpressionQuestions.length 
        ? state.currentQuestionIndex 
        : 0;
      return writtenExpressionQuestions[index];
    }
  };
  
  // Get current question index within its section
  const getCurrentQuestionIndexInSection = () => {
    if (activeTab === 'structure') {
      return state.currentQuestionIndex < structureQuestions.length 
        ? state.currentQuestionIndex 
        : 0;
    } else {
      return state.currentQuestionIndex < writtenExpressionQuestions.length 
        ? state.currentQuestionIndex 
        : 0;
    }
  };
  
  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: 0 });
  };
  
  // Handle next question
  const handleNextQuestion = () => {
    const currentSection = activeTab === 'structure' ? structureQuestions : writtenExpressionQuestions;
    if (getCurrentQuestionIndexInSection() < currentSection.length - 1) {
      dispatch({ 
        type: 'SET_CURRENT_QUESTION_INDEX', 
        payload: getCurrentQuestionIndexInSection() + 1 
      });
    }
  };
  
  // Handle previous question
  const handlePrevQuestion = () => {
    if (getCurrentQuestionIndexInSection() > 0) {
      dispatch({ 
        type: 'SET_CURRENT_QUESTION_INDEX', 
        payload: getCurrentQuestionIndexInSection() - 1 
      });
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    dispatch({ 
      type: 'SET_USER_ANSWER', 
      payload: { questionId, answer } 
    });
  };
  
  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (answeredQuestions < totalQuestions) {
      const unansweredCount = totalQuestions - answeredQuestions;
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate scores
      const structureScore = structureQuestions.reduce((score, question) => {
        const userAnswer = state.userAnswers.find(a => a?.questionId === question.id)?.answer;
        return userAnswer === question.correctAnswer ? score + 1 : score;
      }, 0);
      
      const writtenExpressionScore = writtenExpressionQuestions.reduce((score, question) => {
        const userAnswer = state.userAnswers.find(a => a?.questionId === question.id)?.answer;
        return userAnswer === question.correctAnswer ? score + 1 : score;
      }, 0);
      
      const totalScore = structureScore + writtenExpressionScore;
      const timeElapsed = 25 * 60 - state.timeRemaining;
      
      // Save results to context
      dispatch({ 
        type: 'SET_RESULTS', 
        payload: {
          totalScore,
          structureScore,
          writtenExpressionScore,
          timeElapsed
        }
      });
      
      // Save to database
      if (state.userName) {
        await saveQuizResult({
          userName: state.userName,
          score: totalScore,
          structureScore,
          writtenExpressionScore,
          timeElapsed,
          answers: state.userAnswers
        });
      }
      
      // Mark quiz as completed
      dispatch({ type: 'COMPLETE_QUIZ' });
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (state.isQuizStarted && !state.isQuizCompleted && state.timeRemaining > 0) {
      timer = setInterval(() => {
        dispatch({ type: 'DECREMENT_TIME' });
      }, 1000);
    } else if (state.timeRemaining <= 0 && !state.isQuizCompleted) {
      handleSubmitQuiz();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isQuizStarted, state.isQuizCompleted, state.timeRemaining]);
  
  // Warning when time is running low
  useEffect(() => {
    if (state.timeRemaining === 300) { // 5 minutes left
      toast.warning('5 minutes remaining!', {
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      });
    } else if (state.timeRemaining === 60) { // 1 minute left
      toast.warning('1 minute remaining!', {
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />
      });
    }
  }, [state.timeRemaining]);
  
  // If quiz not started, show username input
  if (!state.isQuizStarted) {
    return <UserNameInput />;
  }
  
  // If quiz completed, show results
  if (state.isQuizCompleted) {
    return <QuizResults />;
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Header with timer and progress */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium">
              Time Remaining: <span className={`font-bold ${state.timeRemaining < 300 ? 'text-red-500' : ''}`}>
                {formatTime(state.timeRemaining)}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {answeredQuestions}/{totalQuestions} Questions Answered
            </span>
            <Badge variant="outline" className="ml-2">
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
        </div>
        
        <Progress value={progressPercentage} className="h-2" />
        
        {/* Question tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structure">
              Structure ({structureQuestions.length} Questions)
            </TabsTrigger>
            <TabsTrigger value="written">
              Written Expression ({writtenExpressionQuestions.length} Questions)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structure" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <QuestionCard
                  question={getCurrentQuestion()}
                  questionNumber={getCurrentQuestionIndexInSection() + 1}
                  totalQuestions={structureQuestions.length}
                  userAnswer={state.userAnswers.find(a => a?.questionId === getCurrentQuestion()?.id)?.answer || ''}
                  onAnswerSelect={handleAnswerSelect}
                  onNextQuestion={handleNextQuestion}
                  onPrevQuestion={handlePrevQuestion}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="written" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <QuestionCard
                  question={getCurrentQuestion()}
                  questionNumber={getCurrentQuestionIndexInSection() + 1}
                  totalQuestions={writtenExpressionQuestions.length}
                  userAnswer={state.userAnswers.find(a => a?.questionId === getCurrentQuestion()?.id)?.answer || ''}
                  onAnswerSelect={handleAnswerSelect}
                  onNextQuestion={handleNextQuestion}
                  onPrevQuestion={handlePrevQuestion}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Submit button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleSubmitQuiz} 
            disabled={isSubmitting}
            className="w-full max-w-xs"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
        
        {/* Hint about unanswered questions */}
        {answeredQuestions < totalQuestions && (
          <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
            <HelpCircle className="h-4 w-4 mr-1" />
            <span>You have {totalQuestions - answeredQuestions} unanswered questions</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;