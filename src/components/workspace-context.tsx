"use client";
import { createContext, useContext } from "react";
import type { Client, Playlist, View, Workspace } from "@/lib/types";
export type ModalState = { type: "client" | "trial" | "renew" | "playlist" | "details" | "delete-client" | "delete-playlist" | "help" | "password"; client?: Client; playlist?: Playlist } | null;
type Context = { data: Workspace; busy: boolean; view: View; navigate: (view: View) => void; openModal: (modal: ModalState) => void; mutate: (action: string, data?: Record<string, unknown>, id?: string) => Promise<boolean>; notify: (message: string, error?: boolean) => void };
export const WorkspaceContext = createContext<Context | null>(null);
export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error("Workspace unavailable"); return value; }
