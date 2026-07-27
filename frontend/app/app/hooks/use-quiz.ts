"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizAPI, QuizDifficulty, QuizQuestionType } from "@/services/quiz_ai";

const QUIZZES_KEY = ["quizzes"];

export function useQuizzes() {
  return useQuery({
    queryKey: QUIZZES_KEY,
    queryFn: () => quizAPI.getAll(),
  });
}

export function useQuizIntro(quizId: string | null) {
  return useQuery({
    queryKey: ["quiz-intro", quizId],
    queryFn: () => quizAPI.getIntro(quizId as string),
    enabled: !!quizId,
  });
}

export function useQuizDetail(quizId: string | null) {
  return useQuery({
    queryKey: ["quiz-detail", quizId],
    queryFn: () => quizAPI.getDetail(quizId as string),
    enabled: !!quizId,
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      documentId?: string | null;
      noteId?: string | null;
      numQuestions?: number;
      difficulty?: QuizDifficulty;
      questionType?: QuizQuestionType;
    }) => quizAPI.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZZES_KEY });
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      answers,
      timeTakenSeconds,
    }: {
      quizId: string;
      answers: Record<string, number>;
      timeTakenSeconds?: number;
    }) => quizAPI.submit(quizId, answers, timeTakenSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZZES_KEY });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZZES_KEY });
    },
  });
}