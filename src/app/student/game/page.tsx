'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { getLanguageLabel, LANGUAGE_OPTIONS } from '@/components/LanguageSelect'
import WordleGame from '@/components/WordleGame'
import SnakeGame from '@/components/SnakeGame'

type GameType = 'wordle' | 'snake'
type GameStage = 'setup' | 'playing' | 'result'

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

export default function GamePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [filteredVocabularies, setFilteredVocabularies] = useState<Vocabulary[]>([])
  
  const [stage, setStage] = useState<GameStage>('setup')
  const [selectedGameType, setSelectedGameType] = useState<GameType>('wordle')
  const [selectedLangUse, setSelectedLangUse] = useState('')
  const [selectedLangExp, setSelectedLangExp] = useState('')
  const [selectedVocabId, setSelectedVocabId] = useState('')
  const [selectedVocab, setSelectedVocab] = useState<any>(null)
  
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

  const handleStartGame = () => {
    if (!selectedVocab || !selectedVocab.words || selectedVocab.words.length === 0) {
      alert('請選擇有效的單字本')
      return
    }

    // 從設定頁面開始新遊戲時，清除之前的遊戲狀態
    // 使用與 WordleGame 相同的 key 格式
    if (typeof window !== 'undefined') {
      const storageKey = `wordle-game-${selectedLangUse}-${selectedLangExp}`
      sessionStorage.removeItem(storageKey)
    }
    
    setResetGame(true)
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

  const handleBack = () => {
    setStage('setup')
    setEarnedPoints(null)
    setTotalPoints(null)
  }

  const handleReset = () => {
    setStage('setup')
    setEarnedPoints(null)
    setTotalPoints(null)
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

  if (stage === 'setup') {
  return (
    <Box>
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              單字遊戲
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              選擇遊戲類型並開始遊戲
      </Typography>

            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>遊戲類型</InputLabel>
              <Select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value as GameType)}
                label="遊戲類型"
              >
                <MenuItem value="wordle">猜謎遊戲 (Wordle 風格)</MenuItem>
                <MenuItem value="snake">貪食蛇遊戲</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleStartGame}
              disabled={!selectedVocab || !selectedLangUse || !selectedLangExp}
              sx={{ mt: 2 }}
            >
              開始遊戲
            </Button>
      </Paper>
    </Box>
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
          <Box sx={{ mt: 3, mb: 2 }}>
            {earnedPoints !== null && (
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                獲得點數: +{earnedPoints} 點
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
            <Button variant="outlined" onClick={() => setStage('setup')}>
              返回設定
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
