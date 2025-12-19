"use client";

import { Box, Typography, Paper, TextField, Button, Alert } from "@mui/material";
import { useState, useEffect } from "react";

export default function AdminSettingPage() {
  const [settings, setSettings] = useState({
    LLM_quota: 0.005,
    new_points: 100,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/setting");
      if (response.ok) {
        const data = await response.json();
        setSettings({
          LLM_quota: data.LLM_quota || 0.005,
          new_points: data.new_points || 100,
        });
      }
    } catch (error) {
      console.error("載入設定失敗:", error);
      setError("載入設定失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/setting", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "儲存失敗");
      }
    } catch (error) {
      console.error("儲存設定失敗:", error);
      setError("儲存設定失敗");
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          系統設定
        </Typography>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        系統設定
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          設定已儲存
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              每日 LLM 額度
            </Typography>
            <TextField
              type="number"
              label="每日 LLM 額度（美金）"
              value={settings.LLM_quota}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  LLM_quota: parseFloat(e.target.value) || 0,
                })
              }
              fullWidth
              inputProps={{ step: 0.001, min: 0 }}
              helperText="超過此額度時，禁止學生使用 AI 生成單字本、AI 助手等功能（單位：美金）"
            />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              初始使用者兌換卷點數
            </Typography>
            <TextField
              type="number"
              label="初始點數"
              value={settings.new_points}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  new_points: parseInt(e.target.value) || 0,
                })
              }
              fullWidth
              helperText="新手登入時免費贈送的兌換卷點數"
            />
          </Box>

          <Button variant="contained" onClick={handleSave}>
            儲存設定
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
