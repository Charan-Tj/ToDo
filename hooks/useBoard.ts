"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import { BoardData } from "@/lib/types";

export function useBoard(boardId: string) {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    try {
      const result = await db.getBoardData(boardId);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  return { data, loading, error, refresh: fetchBoardData };
}
