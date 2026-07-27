"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesAPI, Note } from "@/services/notes_ai";

const NOTES_KEY = ["notes"];

export function useNotes() {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: () => notesAPI.getAll(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: Partial<Note>) => notesAPI.create(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, params }: { noteId: string; params: Partial<Note> }) =>
      notesAPI.update(noteId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}