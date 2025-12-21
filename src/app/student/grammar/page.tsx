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
  quickReplies?: string[]; // Quick Replies 選項
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
  // 程度設定：English 用 CEFR (A1-A2-B1-B2-C1-C2)，Japanese 用 JLPT (N5-N4-N3-N2-N1)
  const [level, setLevel] = useState<string>("A1"); // default 最低階
  const [mode, setMode] = useState<"ask" | "recommend">("ask"); // 詢問或推薦模式
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.userId) {
      loadChatHistory();
    }
    // 當 grammarLang 改變時，重置 level 為最低階
    if (grammarLang === "English") {
      setLevel("A1");
    } else {
      setLevel("N5");
    }
  }, [session, grammarLang]);

  useEffect(() => {
    // 自動滾動到底部
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/grammar/history");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        // 如果 API 调用失败，不显示错误，只使用空数组
        console.warn("載入聊天紀錄失敗，使用空紀錄");
        setChats([]);
      }
    } catch (error) {
      // 网络错误或数据库连接错误时，不阻塞页面，使用空数组
      console.warn("載入聊天紀錄失敗:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (messageText?: string, modeType?: "ask" | "recommend") => {
    const message = messageText || input.trim();
    if (!message || sending) return;

    const userMessage: Chat = {
      timestamp: Date.now(),
      content: message,
      direction: "user",
    };

    setChats((prev) => [...prev, userMessage]);
    if (!messageText) {
      setInput("");
    }
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
          level,
          mode: modeType || mode,
          chatHistory: chats.map((c) => ({
            role: c.direction === "user" ? "user" : "assistant",
            content: c.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Chat = {
          timestamp: Date.now(),
          content: data.response || "grammar功能開發中",
          direction: "ai",
          quickReplies: data.quickReplies || [],
        };
        setChats((prev) => [...prev, aiMessage]);
      } else {
        const errorData = await response.json();
        const aiMessage: Chat = {
          timestamp: Date.now(),
          content: errorData.error || "grammar功能開發中",
          direction: "ai",
        };
        setChats((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);
      const aiMessage: Chat = {
        timestamp: Date.now(),
        content: "發送訊息失敗，請稍後再試",
        direction: "ai",
      };
      setChats((prev) => [...prev, aiMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleRecommend = () => {
    const recommendMessage = grammarLang === "English" 
      ? "我不知道今天要學什麼英文文法"
      : "私は今日何の日本語文法を学べばいいか分かりません";
    handleSend(recommendMessage, "recommend");
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
            bgcolor: "black",
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
              <Typography variant="body1" sx={{ color: "white" }}>
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
                    sx={{
                      color: "white",
                      "&.Mui-checked": {
                        color: "white",
                      },
                      "&.MuiCheckbox-indeterminate": {
                        color: "white",
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: "white" }}>
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
                      chat.direction === "user" ? "primary.light" : "white",
                    color:
                      chat.direction === "user" ? "white" : "black",
                    border: selectedChats.has(index) ? "2px solid" : "none",
                    borderColor: selectedChats.has(index) ? "primary.main" : "transparent",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Checkbox
                      checked={selectedChats.has(index)}
                      onChange={() => handleToggleSelect(index)}
                      sx={{ 
                        mt: -1, 
                        ml: -1,
                        color: "black",
                        "&.Mui-checked": {
                          color: "black",
                        },
                      }}
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
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: chat.direction === "user" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)"
                          }}
                        >
                          {new Date(chat.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: "pre-wrap",
                          "& ol, & ul": { pl: 2 },
                          "& li": { mb: 0.5 },
                          color: chat.direction === "user" ? "white" : "black",
                        }}
                      >
                        {chat.content}
                      </Typography>
                      {chat.direction === "ai" && chat.quickReplies && chat.quickReplies.length > 0 && (
                        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {chat.quickReplies.map((reply, idx) => (
                            <Button
                              key={idx}
                              variant="outlined"
                              size="small"
                              onClick={() => handleSend(reply, "ask")}
                              disabled={sending}
                            >
                              {reply}
                            </Button>
                          ))}
                        </Box>
                      )}
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
                  bgcolor: "white",
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
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={mode === "ask" ? "contained" : "outlined"}
              onClick={() => setMode("ask")}
              disabled={sending}
              sx={{ flex: 1 }}
            >
              詢問
            </Button>
            <Button
              variant={mode === "recommend" ? "contained" : "outlined"}
              onClick={() => setMode("recommend")}
              disabled={sending}
              sx={{ flex: 1 }}
            >
              推薦
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mode === "ask" ? "輸入文法問題..." : "點擊推薦按鈕或輸入問題..."}
              disabled={sending || mode === "recommend"}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={() => mode === "recommend" ? handleRecommend() : handleSend()}
              disabled={(!input.trim() && mode === "ask") || sending}
            >
              {mode === "recommend" ? "推薦" : "發送"}
            </Button>
          </Box>
          {mode === "recommend" && (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleRecommend}
              disabled={sending}
            >
              {grammarLang === "English" 
                ? "我不知道今天要學什麼英文文法"
                : "私は今日何の日本語文法を学べばいいか分かりません"}
            </Button>
          )}
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
            <FormControl fullWidth disabled={grammarLang !== "English"}>
              <InputLabel id="english-level-label">英文程度</InputLabel>
              <Select
                labelId="english-level-label"
                value={grammarLang === "English" ? level : ""}
                label="英文程度"
                onChange={(e) => {
                  if (grammarLang === "English") {
                    setLevel(e.target.value);
                  }
                }}
              >
                <MenuItem value="A1">A1 (初級)</MenuItem>
                <MenuItem value="A2">A2 (初級)</MenuItem>
                <MenuItem value="B1">B1 (中級)</MenuItem>
                <MenuItem value="B2">B2 (中級)</MenuItem>
                <MenuItem value="C1">C1 (高級)</MenuItem>
                <MenuItem value="C2">C2 (高級)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={grammarLang !== "Japanese"}>
              <InputLabel id="japanese-level-label">日文程度</InputLabel>
              <Select
                labelId="japanese-level-label"
                value={grammarLang === "Japanese" ? level : ""}
                label="日文程度"
                onChange={(e) => {
                  if (grammarLang === "Japanese") {
                    setLevel(e.target.value);
                  }
                }}
              >
                <MenuItem value="N5">N5 (初級)</MenuItem>
                <MenuItem value="N4">N4 (初級)</MenuItem>
                <MenuItem value="N3">N3 (中級)</MenuItem>
                <MenuItem value="N2">N2 (中級)</MenuItem>
                <MenuItem value="N1">N1 (高級)</MenuItem>
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
