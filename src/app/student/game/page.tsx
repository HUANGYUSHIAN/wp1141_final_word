'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { getLanguageLabel, LANGUAGE_OPTIONS } from '@/components/LanguageSelect'
import WordleGame from '@/components/WordleGame'
import SnakeGame from '@/components/SnakeGame'
import AIGame from '@/components/AIGame'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import ExtensionIcon from '@mui/icons-material/Extension'
import SmartToyIcon from '@mui/icons-material/SmartToy'

type GameType = 'wordle' | 'snake' | 'ai-king'
type GameStage = 'select' | 'setup' | 'playing' | 'result'

interface Vocabulary {
  vocabularyId: string
  name: string
  langUse: string
  langExp: string
  wordCount: number
}

interface Word {
  id?: string
  word: string
  spelling?: string | null
  explanation: string
  partOfSpeech?: string | null
  sentence?: string | null
}

const games = [
  {
    id: 'wordle' as GameType,
    name: '猜謎遊戲',
    description: 'Wordle 風格猜單字遊戲',
    icon: <ExtensionIcon sx={{ fontSize: 60 }} />,
    color: '#1976d2',
  },
  {
    id: 'snake' as GameType,
    name: '貪食蛇遊戲',
    description: '經典貪食蛇，邊玩邊學單字',
    icon: <SportsEsportsIcon sx={{ fontSize: 60 }} />,
    color: '#2e7d32',
  },
  {
    id: 'ai-king' as GameType,
    name: '電腦知識王',
    description: '與 AI 對戰，看誰答對更多',
    icon: <SmartToyIcon sx={{ fontSize: 60 }} />,
    color: '#ed6c02',
  },
]

export default function GamePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [filteredVocabularies, setFilteredVocabularies] = useState<Vocabulary[]>([])
  
  const [stage, setStage] = useState<GameStage>('select')
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null)
  const [aiGameResult, setAiGameResult] = useState<{ playerScore: number; aiScore: number; wrongAnswers: any[] } | null>(null)
  const [selectedLangUse, setSelectedLangUse] = useState('')
  const [selectedLangExp, setSelectedLangExp] = useState('')
  const [selectedVocabId, setSelectedVocabId] = useState('')
  const [selectedVocab, setSelectedVocab] = useState<any>(null)
  const [openSetupDialog, setOpenSetupDialog] = useState(false)
  
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [resetGame, setResetGame] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    loadVocabularies()
    setLoading(false)
  }, [router, session])

  useEffect(() => {
    if (selectedLangUse && selectedLangExp) {
      const filtered = vocabularies.filter(
        vocab => vocab.langUse === selectedLangUse && vocab.langExp === selectedLangExp
      )
      setFilteredVocabularies(filtered)
      if (filtered.length === 0) {
        setSelectedVocabId('')
        setSelectedVocab(null)
      } else if (!filtered.find(v => v.vocabularyId === selectedVocabId)) {
        setSelectedVocabId('')
        setSelectedVocab(null)
      }
    } else {
      setFilteredVocabularies([])
      setSelectedVocabId('')
      setSelectedVocab(null)
    }
  }, [selectedLangUse, selectedLangExp, vocabularies, selectedVocabId])

  // 載入點數資訊
  useEffect(() => {
    if (stage === 'result') {
      const loadPoints = async () => {
        try {
          const response = await fetch('/api/student/game')
          if (response.ok) {
            const data = await response.json()
            setTotalPoints(data.points || 0)
          }
        } catch (error) {
          console.error('載入點數失敗:', error)
        }
      }
      loadPoints()
    }
  }, [stage])

  const loadVocabularies = async () => {
    try {
      const response = await fetch('/api/student/vocabularies')
      if (response.ok) {
        const data = await response.json()
        setVocabularies(data.vocabularies || [])
      }
    } catch (error) {
      console.error('載入單字本失敗:', error)
    }
  }

  const handleVocabChange = async (vocabId: string) => {
    setSelectedVocabId(vocabId)
    try {
      const response = await fetch(`/api/student/vocabularies/${vocabId}`)
      if (response.ok) {
        const data = await response.json()
        const vocab = data.vocabulary
        
        const wordsResponse = await fetch(`/api/student/vocabularies/${vocabId}/words?limit=1000`)
        if (wordsResponse.ok) {
          const wordsData = await wordsResponse.json()
          setSelectedVocab({
            ...vocab,
            words: wordsData.words || [],
          })
        } else {
          setSelectedVocab(vocab)
        }
      }
    } catch (error) {
      console.error('載入單字本詳情失敗:', error)
    }
  }

  const handleGameSelect = (gameType: GameType) => {
    setSelectedGameType(gameType)
    setOpenSetupDialog(true)
  }

  const handleStartGame = () => {
    if (!selectedVocab || !selectedVocab.words || selectedVocab.words.length === 0) {
      alert('請選擇有效的單字本')
      return
    }

    // 從設定頁面開始新遊戲時，清除之前的遊戲狀態
    if (typeof window !== 'undefined') {
      const storageKey = `wordle-game-${selectedLangUse}-${selectedLangExp}`
      sessionStorage.removeItem(storageKey)
    }
    
    setResetGame(true)
    setOpenSetupDialog(false)
    setStage('playing')
  }

  const handleGameEnd = async (won: boolean, score: number) => {
    setStage('result')
    
    // 計算點數（獲勝才有點數）
    if (won && score > 0) {
      const accuracy = 100
      const totalTime = 10000 // 估算時間
      
      try {
        const response = await fetch('/api/student/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accuracy,
            totalTime,
            questionCount: 1,
            correctCount: 1,
            earnedPoints: score, // 直接傳入獲得的點數（Wordle 固定 100 點）
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setEarnedPoints(data.earnedPoints)
          setTotalPoints(data.totalPoints)
        }
      } catch (error) {
        console.error('保存點數失敗:', error)
      }
    }
  }

  const handleAIGameEnd = async (playerScore: number, aiScore: number, wrongAnswers: any[]) => {
    setAiGameResult({ playerScore, aiScore, wrongAnswers })
    setStage('result')
    
    // 計算點數：玩家得分 - 電腦得分，如果>0則四捨五入取整數
    const finalScore = playerScore - aiScore
    const earnedPoints = finalScore > 0 ? Math.round(finalScore) : 0

    if (earnedPoints > 0) {
      try {
        const response = await fetch('/api/student/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accuracy: 100,
            totalTime: 200000, // 20題 * 10秒
            questionCount: 20,
            correctCount: 20 - wrongAnswers.length,
            earnedPoints,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setEarnedPoints(data.earnedPoints)
          setTotalPoints(data.totalPoints)
        }
      } catch (error) {
        console.error('保存點數失敗:', error)
      }
    } else {
      setEarnedPoints(0)
    }
  }

  const handleBack = () => {
    setStage('select')
    setEarnedPoints(null)
    setTotalPoints(null)
    setAiGameResult(null)
    setSelectedGameType(null)
    setSelectedVocab(null)
    setSelectedVocabId('')
    setSelectedLangUse('')
    setSelectedLangExp('')
  }

  const handleReset = () => {
    setStage('select')
    setEarnedPoints(null)
    setTotalPoints(null)
    setAiGameResult(null)
    setSelectedGameType(null)
    setSelectedVocab(null)
    setSelectedVocabId('')
    setSelectedLangUse('')
    setSelectedLangExp('')
  }

  const handlePlayAgain = () => {
    // 清除遊戲狀態，重新開始
    if (typeof window !== 'undefined') {
      const storageKey = `wordle-game-${selectedLangUse}-${selectedLangExp}`
      sessionStorage.removeItem(storageKey)
    }
    setResetGame(true)
    setEarnedPoints(null)
    setTotalPoints(null)
    setStage('playing')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (stage === 'select') {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          單字遊戲
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          選擇遊戲類型並開始遊戲
        </Typography>
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <CardActionArea onClick={() => handleGameSelect(game.id)} sx={{ flex: 1, p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                    }}
                  >
                    <Box
                      sx={{
                        color: game.color,
                        mb: 2,
                      }}
                    >
                      {game.icon}
                    </Box>
                    <Typography variant="h5" gutterBottom>
                      {game.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {game.description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 設定對話框 */}
        <Dialog open={openSetupDialog} onClose={() => setOpenSetupDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>設定遊戲</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>背誦語言</InputLabel>
                <Select
                  value={selectedLangUse}
                  onChange={(e) => setSelectedLangUse(e.target.value)}
                  label="背誦語言"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>解釋語言</InputLabel>
                <Select
                  value={selectedLangExp}
                  onChange={(e) => setSelectedLangExp(e.target.value)}
                  label="解釋語言"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>選擇單字本</InputLabel>
                <Select
                  value={selectedVocabId}
                  onChange={(e) => handleVocabChange(e.target.value)}
                  label="選擇單字本"
                  disabled={!selectedLangUse || !selectedLangExp}
                >
                  {filteredVocabularies.length > 0 ? (
                    filteredVocabularies.map((vocab) => (
                      <MenuItem key={vocab.vocabularyId} value={vocab.vocabularyId}>
                        {vocab.name} ({getLanguageLabel(vocab.langUse)} - {getLanguageLabel(vocab.langExp)})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      {selectedLangUse && selectedLangExp ? '沒有符合的單字本' : '請先選擇語言'}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSetupDialog(false)}>取消</Button>
            <Button
              variant="contained"
              onClick={handleStartGame}
              disabled={!selectedVocab || !selectedLangUse || !selectedLangExp}
            >
              開始遊戲
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  if (stage === 'playing') {
    if (!selectedVocab || !selectedVocab.words) {
      return (
        <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" color="error">
              無法載入單字本
            </Typography>
            <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
              返回
            </Button>
          </Paper>
        </Box>
      )
    }

    if (selectedGameType === 'wordle') {
      return (
        <WordleGame
          words={selectedVocab.words}
          langUse={selectedLangUse}
          langExp={selectedLangExp}
          onGameEnd={handleGameEnd}
          onBack={handleBack}
          resetGame={resetGame}
        />
      )
    } else if (selectedGameType === 'snake') {
      return (
        <SnakeGame
          words={selectedVocab.words}
          langUse={selectedLangUse}
          onGameEnd={(score) => handleGameEnd(true, score)}
          onBack={handleBack}
        />
      )
    } else if (selectedGameType === 'ai-king') {
      return (
        <AIGame
          words={selectedVocab.words}
          langUse={selectedLangUse}
          langExp={selectedLangExp}
          onGameEnd={handleAIGameEnd}
          onBack={handleBack}
        />
      )
    }
  }

  // 結果階段
  return (
    <Box>
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            遊戲結果
          </Typography>
          {selectedGameType === 'ai-king' && aiGameResult && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                你的得分: {aiGameResult.playerScore.toFixed(3)}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                電腦得分: {aiGameResult.aiScore.toFixed(3)}
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3, mb: 2 }}>
            {earnedPoints !== null && (
              <Typography variant="h6" color={earnedPoints > 0 ? 'primary' : 'text.secondary'} sx={{ mt: 2 }}>
                獲得點數: {earnedPoints > 0 ? `+${earnedPoints}` : earnedPoints} 點
              </Typography>
            )}
            {totalPoints !== null && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                總點數: {totalPoints} 點
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handlePlayAgain} sx={{ mr: 2 }}>
              再玩一次
            </Button>
            <Button variant="outlined" onClick={handleReset} sx={{ mr: 2 }}>
              重新開始
            </Button>
            <Button variant="outlined" onClick={handleBack}>
              返回遊戲選擇
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
