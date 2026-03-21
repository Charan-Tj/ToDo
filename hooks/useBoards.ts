"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { Board } from "@/lib/types";

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      const data = await db.getBoards();
      setBoards(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return { boards, loading, error, refresh: fetchBoards };
}
