"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

interface LLMUsageRecord {
  date: string;
  cost: number;
}

interface LLMUsageData {
  todayCost: number;
  totalCost: number;
  records: LLMUsageRecord[];
}

export default function StudentSettingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<LLMUsageData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.userId) {
      fetchLLMUsage();
    }
  }, [session]);

  const fetchLLMUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/llm-usage");
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      } else {
        setError("載入 LLM 使用狀況失敗");
      }
    } catch (error) {
      console.error("Error fetching LLM usage:", error);
      setError("載入 LLM 使用狀況失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        設定
      </Typography>

      {/* LLM 使用狀況 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          LLM 使用狀況
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : usageData ? (
          <Box>
            {/* 每日使用狀況摘要 */}
            <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Paper
                sx={{
                  p: 2,
                  flex: 1,
                  minWidth: 200,
                  bgcolor: "primary.light",
                  color: "white",
                }}
              >
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  今日使用
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${usageData.todayCost.toFixed(4)}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  p: 2,
                  flex: 1,
                  minWidth: 200,
                  bgcolor: "secondary.light",
                  color: "white",
                }}
              >
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  歷史總計
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${usageData.totalCost.toFixed(4)}
                </Typography>
              </Paper>
            </Box>

            {/* 歷史使用記錄表格 */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              歷史使用記錄（最近 30 天）
            </Typography>
            {usageData.records.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>日期</TableCell>
                      <TableCell align="right">使用金額（美金）</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageData.records
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((record) => (
                        <TableRow key={record.date}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString("zh-TW", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`$${record.cost.toFixed(4)}`}
                              size="small"
                              color={record.cost > 0 ? "primary" : "default"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                尚無使用記錄
              </Typography>
            )}
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
}



