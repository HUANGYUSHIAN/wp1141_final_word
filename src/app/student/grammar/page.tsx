"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Checkbox,
  IconButton,
  Fab,
  Drawer,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";

interface Chat {
  timestamp: number;
  content: string;
  direction: "user" | "ai";
}

export default function GrammarPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [grammarLang, setGrammarLang] = useState<"English" | "Japanese">("English");
  const [responseLang, setResponseLang] = useState<"Traditional Chinese" | "Japanese" | "English" | "Korean">("Traditional Chinese");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.userId) {
      loadChatHistory();
    }
  }, [session]);

  useEffect(() => {
    // 自動滾動到底部
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/student/grammar/history");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("載入聊天紀錄失敗:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Chat = {
      timestamp: Date.now(),
      content: input.trim(),
      direction: "user",
    };

    setChats((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/student/grammar/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          grammarLang,
          responseLang,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Chat = {
          timestamp: Date.now(),
          content: data.response || "grammar功能開發中",
          direction: "ai",
        };
        setChats((prev) => [...prev, aiMessage]);
      } else {
        const aiMessage: Chat = {
          timestamp: Date.now(),
          content: "grammar功能開發中",
          direction: "ai",
        };
        setChats((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);
      const aiMessage: Chat = {
        timestamp: Date.now(),
        content: "grammar功能開發中",
        direction: "ai",
      };
      setChats((prev) => [...prev, aiMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedChats.size === chats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(chats.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedChats.size === 0) return;

    if (!confirm(`確定要刪除 ${selectedChats.size} 則對話嗎？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const indices = Array.from(selectedChats).sort((a, b) => b - a);
      const newChats = chats.filter((_, index) => !selectedChats.has(index));

      // 更新到資料庫
      const response = await fetch("/api/student/grammar/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indices,
        }),
      });

      if (response.ok) {
        setChats(newChats);
        setSelectedChats(new Set());
      } else {
        alert("刪除失敗，請稍後再試");
      }
    } catch (error) {
      console.error("刪除對話失敗:", error);
      alert("刪除失敗，請稍後再試");
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", position: "relative" }}>
      {/* 主聊天區域 */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", mr: toolboxOpen ? "320px" : 0, transition: "margin-right 0.3s" }}>
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
          }}
          ref={chatContainerRef}
        >
          {chats.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                開始與文法家教對話吧！
              </Typography>
            </Box>
          ) : (
            <>
              {chats.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Checkbox
                    checked={selectedChats.size === chats.length && chats.length > 0}
                    indeterminate={selectedChats.size > 0 && selectedChats.size < chats.length}
                    onChange={handleSelectAll}
                  />
                  <Typography variant="body2" color="text.secondary">
                    全選 ({selectedChats.size}/{chats.length})
                  </Typography>
                  {selectedChats.size > 0 && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                    >
                      刪除 ({selectedChats.size})
                    </Button>
                  )}
                </Box>
              )}
              {chats.map((chat, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    ml: chat.direction === "ai" ? 0 : "auto",
                    mr: chat.direction === "ai" ? "auto" : 0,
                    maxWidth: "70%",
                    bgcolor:
                      chat.direction === "user" ? "primary.light" : "grey.200",
                    border: selectedChats.has(index) ? "2px solid" : "none",
                    borderColor: selectedChats.has(index) ? "primary.main" : "transparent",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Checkbox
                      checked={selectedChats.has(index)}
                      onChange={() => handleToggleSelect(index)}
                      sx={{ mt: -1, ml: -1 }}
                      size="small"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Chip
                          label={chat.direction === "user" ? "學生" : "AI"}
                          size="small"
                          color={chat.direction === "user" ? "primary" : "default"}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(chat.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body1">{chat.content}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </>
          )}
          {sending && (
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "grey.200",
                  maxWidth: "70%",
                }}
              >
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入訊息..."
            disabled={sending}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            發送
          </Button>
        </Box>
      </Box>

      {/* 右側工具箱 */}
      <Drawer
        anchor="right"
        open={toolboxOpen}
        onClose={() => setToolboxOpen(false)}
        variant="persistent"
        sx={{
          width: toolboxOpen ? 320 : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 320,
            boxSizing: "border-box",
            position: "relative",
            height: "100%",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">工具箱</Typography>
            <IconButton onClick={() => setToolboxOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>文法討論語言</InputLabel>
              <Select
                value={grammarLang}
                label="文法討論語言"
                onChange={(e) => setGrammarLang(e.target.value as "English" | "Japanese")}
              >
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Japanese">Japanese</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>回答語言</InputLabel>
              <Select
                value={responseLang}
                label="回答語言"
                onChange={(e) =>
                  setResponseLang(
                    e.target.value as "Traditional Chinese" | "Japanese" | "English" | "Korean"
                  )
                }
              >
                <MenuItem value="Traditional Chinese">繁體中文</MenuItem>
                <MenuItem value="Japanese">日文</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Korean">韓文</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Drawer>

      {/* 工具箱切換按鈕 */}
      {!toolboxOpen && (
        <Fab
          color="primary"
          aria-label="open toolbox"
          onClick={() => setToolboxOpen(true)}
          sx={{
            position: "fixed",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1000,
          }}
        >
          <SettingsIcon />
        </Fab>
      )}

      {/* 滾動按鈕 */}
      {chats.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: toolboxOpen ? 340 : 24,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            zIndex: 1000,
            transition: "right 0.3s",
          }}
        >
          <Fab
            size="small"
            color="primary"
            aria-label="scroll to top"
            onClick={scrollToTop}
            sx={{ boxShadow: 3 }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
          <Fab
            size="small"
            color="primary"
            aria-label="scroll to bottom"
            onClick={scrollToBottom}
            sx={{ boxShadow: 3 }}
          >
            <KeyboardArrowDownIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
}
