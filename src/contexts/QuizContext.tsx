import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Question, UserAnswer, QuizResult } from '@/types/quiz';

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  answers: number[];
  timeRemaining: number;
  isQuizStarted: boolean;
  isQuizCompleted: boolean;
  userName: string;
  hintsRemaining: number;
  results: QuizResult[];
  isSubmitted: boolean;
  showAdmin: boolean;
}

type QuizAction =
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'START_QUIZ' }
  | { type: 'ANSWER_QUESTION'; payload: UserAnswer }
  | { type: 'SET_ANSWER'; payload: { questionIndex: number; answerIndex: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'COMPLETE_QUIZ'; payload: QuizResult }
  | { type: 'USE_HINT' }
  | { type: 'SUBMIT_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SET_SHOW_ADMIN'; payload: boolean };

const initialState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  answers: new Array(30).fill(-1), // -1 means no answer selected
  timeRemaining: 1800, // 30 minutes in seconds
  isQuizStarted: false,
  isQuizCompleted: false,
  userName: '',
  hintsRemaining: 5,
  results: [],
  isSubmitted: false,
  showAdmin: false
};