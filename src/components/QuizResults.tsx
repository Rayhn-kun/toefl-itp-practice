import React, { useEffect, useState, useRef } from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target, RotateCcw, Share2, Download, CheckCircle, XCircle, Lightbulb, Image } from 'lucide-react';
import { toast } from 'sonner';
import { saveQuizResult, getQuizResults } from '@/lib/supabase';
import html2canvas from 'html2canvas';

const QuizResults: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [databaseResults, setDatabaseResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  if (!state.isQuizCompleted) return null;
  
  // Calculate score and other metrics only once at the top of the component
  const correctAnswers = state.answers.filter((answer, index) => {
    const question = state.questions[index];
    return question && answer === question.correct;
  });
  
  const score = correctAnswers.length;
  const percentage = Math.round((score / 30) * 100);
  
  // Calculate structure and written expression scores
  const structureScore = state.answers.slice(0, 15).filter((answer, index) => {
    const question = state.questions[index];
    return question && answer === question.correct;
  }).length;
  
  const writtenExpressionScore = state.answers.slice(15, 30).filter((answer, index) => {
    const question = state.questions[index + 15];
    return question && answer === question.correct;
  }).length;
  
  const structurePercentage = Math.round((structureScore / 15) * 100);
  const writtenExpressionPercentage = Math.round((writtenExpressionScore / 15) * 100);
  const timeElapsed = 1800 - state.timeRemaining;

  // Function to handle downloading screenshot of results
  const handleDownloadScreenshot = async () => {
    if (!resultsRef.current) {
      toast.error('Could not capture results');
      return;
    }

    try {
      toast.info('Capturing your results...');
      const canvas = await html2canvas(resultsRef.current);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `TOEFL-ITP-Results-${state.userName.replace(/\s+/g, '-')}.png`;
      link.click();
      toast.success('Results downloaded successfully!');
    } catch (error) {
      console.error('Error generating screenshot:', error);
      toast.error('Failed to download results');
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/10 pb-2">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            TOEFL ITP Quiz Results
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6" ref={resultsRef}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Hello, {state.userName}!</h2>
            <p className="text-muted-foreground">Here's how you performed on the TOEFL ITP practice quiz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Overall Score</h3>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold mb-2">{score}/30</div>
              <Progress value={percentage} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{percentage}% correct answers</p>
            </div>
            
            <div className="bg-card rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Structure</h3>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold mb-2">{structureScore}/15</div>
              <Progress value={structurePercentage} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{structurePercentage}% correct answers</p>
            </div>
            
            <div className="bg-card rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Written Expression</h3>
                <Lightbulb className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold mb-2">{writtenExpressionScore}/15</div>
              <Progress value={writtenExpressionPercentage} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{writtenExpressionPercentage}% correct answers</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Performance Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-md bg-card border">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Time Taken</p>
                  <p className="text-lg font-semibold">
                    {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-md bg-card border">
                <div className="flex items-center gap-1">
                  {percentage >= 70 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Performance Level</p>
                  <p className="text-lg font-semibold">
                    {percentage >= 90
                      ? 'Excellent'
                      : percentage >= 80
                      ? 'Very Good'
                      : percentage >= 70
                      ? 'Good'
                      : percentage >= 60
                      ? 'Satisfactory'
                      : percentage >= 50
                      ? 'Needs Improvement'
                      : 'Needs Significant Work'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => dispatch({ type: 'RESET_QUIZ' })}
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleDownloadScreenshot}
            >
              <Image className="h-4 w-4" />
              Download Results
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'My TOEFL ITP Quiz Results',
                    text: `I scored ${score}/30 (${percentage}%) on the TOEFL ITP practice quiz!`,
                  }).catch(err => {
                    console.error('Error sharing:', err);
                    toast.error('Could not share results');
                  });
                } else {
                  // Fallback for browsers that don't support the Web Share API
                  navigator.clipboard.writeText(
                    `I scored ${score}/30 (${percentage}%) on the TOEFL ITP practice quiz!`
                  );
                  toast.success('Results copied to clipboard!');
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;