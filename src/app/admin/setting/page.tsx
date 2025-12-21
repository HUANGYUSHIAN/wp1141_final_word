"use client";

import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import { useState, useEffect } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import ExtensionIcon from "@mui/icons-material/Extension";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import SmartToyIcon from "@mui/icons-material/SmartToy";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminSettingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LLM 使用額度相關
  const [llmDialogOpen, setLlmDialogOpen] = useState(false);
  const [llmQuota, setLlmQuota] = useState(0.005);
  const [openAIBalance, setOpenAIBalance] = useState<number | null>(null);
  const [balanceType, setBalanceType] = useState<"remaining" | "total_used">("remaining");

  // 抽獎券參數相關
  const [lotteryDialogOpen, setLotteryDialogOpen] = useState(false);
  const [newPoints, setNewPoints] = useState(100);
  const [lotteryOptions, setLotteryOptions] = useState([
    { points: 50, winRate: 0.05 },
    { points: 100, winRate: 0.1 },
    { points: 200, winRate: 0.3 },
  ]);

  // 遊戲參數相關
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [gameTabValue, setGameTabValue] = useState(0);
  const [gameParams, setGameParams] = useState({
    wordle: { winPoints: 10, losePoints: 0 },
    snake: { pointsPerRound: 10, maxPointsPerGame: null, gridWidth: 30, gridHeight: 15 },
    aiKing: { aiMinTime: 2, aiMaxTime: 5, aiCorrectRate: 0.9, totalQuestions: 10, scoreMultiplier: 1 },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // 當 LLM 對話框打開時，重新獲取最新數據
  useEffect(() => {
    if (llmDialogOpen) {
      fetchSettings();
    }
  }, [llmDialogOpen]);

  // 當遊戲參數對話框打開時，重新獲取最新數據
  useEffect(() => {
    if (gameDialogOpen) {
      fetchSettings();
    }
  }, [gameDialogOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // 獲取 LLM 額度
      const llmResponse = await fetch("/api/admin/setting/llm-quota");
      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        setLlmQuota(llmData.LLM_quota || 0.005);
        setOpenAIBalance(llmData.openAIBalance);
        setBalanceType(llmData.balanceType || "remaining");
      }

      // 獲取遊戲參數
      const gameResponse = await fetch("/api/admin/setting/game-params");
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        setNewPoints(gameData.new_points || 100);
        if (gameData.gameParams?.lottery?.options) {
          setLotteryOptions(gameData.gameParams.lottery.options);
        }
        if (gameData.gameParams) {
          setGameParams({
            wordle: gameData.gameParams.wordle || { winPoints: 10, losePoints: 0 },
            snake: gameData.gameParams.snake || {
              pointsPerRound: 10,
              maxPointsPerGame: null,
              gridWidth: 30,
              gridHeight: 15,
            },
            aiKing: gameData.gameParams.aiKing || {
              aiMinTime: 2,
              aiMaxTime: 5,
              aiCorrectRate: 0.9,
              totalQuestions: 10,
              scoreMultiplier: 1,
            },
          });
        }
      }
    } catch (error) {
      console.error("載入設定失敗:", error);
      setError("載入設定失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLLMQuota = async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/setting/llm-quota", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ LLM_quota: llmQuota }),
      });

      if (response.ok) {
        setSuccess("LLM 額度設定已儲存");
        setTimeout(() => {
          setSuccess("");
          setLlmDialogOpen(false);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "儲存失敗");
      }
    } catch (error) {
      console.error("儲存 LLM 額度失敗:", error);
      setError("儲存失敗");
    }
  };

  const handleSaveLotteryParams = async () => {
    try {
      setError("");
      // 驗證抽獎選項
      if (lotteryOptions.length !== 3) {
        setError("抽獎選項必須固定為 3 個");
        return;
      }

      const gameParams = {
        lottery: {
          options: lotteryOptions,
          defaultPoints: lotteryOptions[0].points,
          defaultWinRate: lotteryOptions[0].winRate,
        },
      };

      const response = await fetch("/api/admin/setting/game-params", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameParams,
          new_points: newPoints,
        }),
      });

      if (response.ok) {
        setSuccess("抽獎券參數已儲存");
        setTimeout(() => {
          setSuccess("");
          setLotteryDialogOpen(false);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "儲存失敗");
      }
    } catch (error) {
      console.error("儲存抽獎券參數失敗:", error);
      setError("儲存失敗");
    }
  };

  const handleUpdateLotteryOption = (index: number, field: "points" | "winRate", value: number) => {
    const updated = [...lotteryOptions];
    updated[index] = { ...updated[index], [field]: value };
    setLotteryOptions(updated);
  };

  const handleSaveGameParams = async () => {
    try {
      setError("");
      
      // 获取当前的 gameParams（包含 lottery）
      const currentResponse = await fetch("/api/admin/setting/game-params");
      let currentGameParams: any = {};
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        currentGameParams = currentData.gameParams || {};
      }

      // 合并更新
      const updatedGameParams = {
        ...currentGameParams,
        wordle: gameParams.wordle,
        snake: gameParams.snake,
        aiKing: gameParams.aiKing,
      };

      const response = await fetch("/api/admin/setting/game-params", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameParams: updatedGameParams,
        }),
      });

      if (response.ok) {
        setSuccess("遊戲參數已儲存");
        setTimeout(() => {
          setSuccess("");
          setGameDialogOpen(false);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "儲存失敗");
      }
    } catch (error) {
      console.error("儲存遊戲參數失敗:", error);
      setError("儲存失敗");
    }
  };

  // 計算 AI King 平均得分
  const calculateAIAverageScore = () => {
    const { aiMinTime, aiMaxTime, aiCorrectRate, totalQuestions } = gameParams.aiKing;
    const averageTime = (aiMinTime + aiMaxTime) / 2;
    const remainingTime = 10 - averageTime; // TIME_LIMIT = 10
    const scorePerQuestion = 5 * remainingTime / 10; // 5 * remainingTime / TIME_LIMIT
    const averageScorePerQuestion = scorePerQuestion * aiCorrectRate;
    const totalAverageScore = averageScorePerQuestion * totalQuestions;
    return parseFloat(totalAverageScore.toFixed(2));
  };

  // 計算玩家最高得分（假設玩家每題都答對且立即答對，即剩餘時間最多）
  const calculatePlayerMaxScore = () => {
    const { totalQuestions } = gameParams.aiKing;
    const TIME_LIMIT = 10;
    // 假設玩家每題都立即答對（剩餘時間10秒），每題得分 = 5 * 10 / 10 = 5
    const maxScorePerQuestion = 5 * TIME_LIMIT / TIME_LIMIT; // 5
    const totalMaxScore = maxScorePerQuestion * totalQuestions;
    return parseFloat(totalMaxScore.toFixed(2));
  };

  // 計算玩家最高獲得點數（玩家最高得分 - 平均AI得分，然後乘以scalar A）
  const calculatePlayerMaxPoints = () => {
    const { scoreMultiplier } = gameParams.aiKing;
    const playerMaxScore = calculatePlayerMaxScore();
    const aiAverageScore = calculateAIAverageScore();
    const difference = playerMaxScore - aiAverageScore;
    const maxPoints = difference > 0 ? Math.round(difference * scoreMultiplier) : 0;
    return maxPoints;
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

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LLM 使用額度 Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardActionArea onClick={() => setLlmDialogOpen(true)}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <SettingsIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="h6">LLM 使用額度</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  設定每日 LLM 使用額度與查看 OpenAI 餘額
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* 抽獎券參數 Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardActionArea onClick={() => setLotteryDialogOpen(true)}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <CardGiftcardIcon sx={{ fontSize: 40, color: "secondary.main" }} />
                  <Typography variant="h6">抽獎券參數</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  設定抽獎點數選項與中獎率
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* 遊戲參數 Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardActionArea onClick={() => setGameDialogOpen(true)}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <ExtensionIcon sx={{ fontSize: 40, color: "warning.main" }} />
                  <Typography variant="h6">遊戲參數</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  設定各遊戲的點數計算方式
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* LLM 使用額度對話框 */}
      <Dialog open={llmDialogOpen} onClose={() => setLlmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>LLM 使用額度設定</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label={
                balanceType === "remaining"
                  ? "剩餘的 OpenAI 額度（美金）"
                  : "總消耗額度（美金）"
              }
              value={
                openAIBalance !== null
                  ? `$${openAIBalance.toFixed(4)}`
                  : "無法查詢"
              }
              disabled
              fullWidth
              helperText={
                balanceType === "remaining"
                  ? "從 OpenAI API 查詢的剩餘額度"
                  : "所有用戶至今使用的總額度（無法查詢 OpenAI 餘額時顯示）"
              }
            />
            <TextField
              label="每日 LLM 額度（美金）"
              type="number"
              value={llmQuota}
              onChange={(e) => setLlmQuota(parseFloat(e.target.value) || 0)}
              fullWidth
              inputProps={{ step: 0.001, min: 0 }}
              helperText="超過此額度時，禁止學生使用 AI 功能"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLlmDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveLLMQuota} variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 抽獎券參數對話框 */}
      <Dialog open={lotteryDialogOpen} onClose={() => setLotteryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>抽獎券參數設定</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="新用戶註冊時系統初始化的點數"
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="新手登入時免費贈送的兌換卷點數"
            />
            {lotteryOptions.map((option, index) => (
              <Box key={index} sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label={`選項 ${index + 1} - 點數`}
                  type="number"
                  value={option.points}
                  onChange={(e) =>
                    handleUpdateLotteryOption(index, "points", parseInt(e.target.value) || 0)
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label={`選項 ${index + 1} - 中獎率`}
                  type="number"
                  value={option.winRate}
                  onChange={(e) =>
                    handleUpdateLotteryOption(index, "winRate", parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  sx={{ flex: 1 }}
                  helperText={`${(option.winRate * 100).toFixed(1)}%`}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLotteryDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveLotteryParams} variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 遊戲參數對話框 */}
      <Dialog open={gameDialogOpen} onClose={() => setGameDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>遊戲參數設定</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={gameTabValue} onChange={(e, newValue) => setGameTabValue(newValue)}>
              <Tab label="猜謎遊戲 (Wordle)" />
              <Tab label="貪食蛇遊戲 (Snake)" />
              <Tab label="電腦知識王 (AI King)" />
            </Tabs>
          </Box>
          <TabPanel value={gameTabValue} index={0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="獲勝點數"
                type="number"
                value={gameParams.wordle.winPoints}
                onChange={(e) =>
                  setGameParams({
                    ...gameParams,
                    wordle: { ...gameParams.wordle, winPoints: parseInt(e.target.value) || 0 },
                  })
                }
                fullWidth
                helperText="答對一題獲得的點數"
              />
            </Box>
          </TabPanel>
          <TabPanel value={gameTabValue} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="每完成一輪的點數"
                type="number"
                value={gameParams.snake.pointsPerRound}
                onChange={(e) =>
                  setGameParams({
                    ...gameParams,
                    snake: { ...gameParams.snake, pointsPerRound: parseInt(e.target.value) || 0 },
                  })
                }
                fullWidth
                helperText="每完成一個單字獲得的點數"
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="遊戲區域寬度 (Nrow)"
                  type="number"
                  value={gameParams.snake.gridWidth}
                  onChange={(e) =>
                    setGameParams({
                      ...gameParams,
                      snake: { ...gameParams.snake, gridWidth: parseInt(e.target.value) || 30 },
                    })
                  }
                  sx={{ flex: 1 }}
                  helperText="貪食蛇遊戲區域的寬度（列數）"
                />
                <TextField
                  label="遊戲區域高度 (Ncol)"
                  type="number"
                  value={gameParams.snake.gridHeight}
                  onChange={(e) =>
                    setGameParams({
                      ...gameParams,
                      snake: { ...gameParams.snake, gridHeight: parseInt(e.target.value) || 15 },
                    })
                  }
                  sx={{ flex: 1 }}
                  helperText="貪食蛇遊戲區域的高度（行數）"
                />
              </Box>
            </Box>
          </TabPanel>
          <TabPanel value={gameTabValue} index={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="AI 最小答題時間（秒）"
                  type="number"
                  value={gameParams.aiKing.aiMinTime}
                  onChange={(e) =>
                    setGameParams({
                      ...gameParams,
                      aiKing: { ...gameParams.aiKing, aiMinTime: parseFloat(e.target.value) || 2 },
                    })
                  }
                  sx={{ flex: 1 }}
                  inputProps={{ step: 0.1, min: 0 }}
                />
                <TextField
                  label="AI 最大答題時間（秒）"
                  type="number"
                  value={gameParams.aiKing.aiMaxTime}
                  onChange={(e) =>
                    setGameParams({
                      ...gameParams,
                      aiKing: { ...gameParams.aiKing, aiMaxTime: parseFloat(e.target.value) || 5 },
                    })
                  }
                  sx={{ flex: 1 }}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Box>
              <TextField
                label="AI 答對率"
                type="number"
                value={gameParams.aiKing.aiCorrectRate}
                onChange={(e) =>
                  setGameParams({
                    ...gameParams,
                    aiKing: { ...gameParams.aiKing, aiCorrectRate: parseFloat(e.target.value) || 0.9 },
                  })
                }
                fullWidth
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                helperText={`${(gameParams.aiKing.aiCorrectRate * 100).toFixed(1)}%`}
              />
              <TextField
                label="回合數"
                type="number"
                value={gameParams.aiKing.totalQuestions}
                onChange={(e) =>
                  setGameParams({
                    ...gameParams,
                    aiKing: { ...gameParams.aiKing, totalQuestions: parseInt(e.target.value) || 10 },
                  })
                }
                fullWidth
                inputProps={{ min: 1 }}
                helperText="遊戲總題數"
              />
              <TextField
                label="分數倍數 (Scalar A)"
                type="number"
                value={gameParams.aiKing.scoreMultiplier}
                onChange={(e) =>
                  setGameParams({
                    ...gameParams,
                    aiKing: { ...gameParams.aiKing, scoreMultiplier: parseFloat(e.target.value) || 1 },
                  })
                }
                fullWidth
                inputProps={{ step: 0.1, min: 0 }}
                helperText="遊戲結束後，若玩家得分超過電腦，差值 × 此倍數並四捨五入取整數作為最終點數"
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="玩家最高得分"
                  value={calculatePlayerMaxScore().toFixed(2)}
                  disabled
                  sx={{ flex: 1 }}
                  helperText="假設玩家每題都答對且用時最短"
                />
                <TextField
                  label="平均 AI 得分"
                  value={calculateAIAverageScore().toFixed(2)}
                  disabled
                  sx={{ flex: 1 }}
                  helperText="根據上述參數計算的平均 AI 得分"
                />
                <TextField
                  label="玩家最高獲得點數"
                  value={calculatePlayerMaxPoints()}
                  disabled
                  sx={{ flex: 1 }}
                  helperText="(玩家最高得分 - 平均AI得分) × Scalar A"
                />
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGameDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveGameParams} variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
