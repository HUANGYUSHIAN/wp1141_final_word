'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material'

interface Word {
  id?: string
  word: string
  spelling?: string | null
  explanation: string
  partOfSpeech?: string | null
  sentence?: string | null
}

interface Guess {
  word: string
  states: LetterState[]
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty'

interface WordleGameProps {
  words: Word[]
  langUse: string
  langExp: string
  onGameEnd: (won: boolean, score: number) => void
  onBack: () => void
}

// 檢查是否為日文的輔助函數
const isJapaneseLanguage = (lang: string): boolean => {
  return lang === 'Japanese' || lang === 'ja' || lang === 'jpn'
}

export default function WordleGame({ words, langUse, langExp, onGameEnd, onBack }: WordleGameProps) {
  const [targetWord, setTargetWord] = useState<Word | null>(null)
  const [targetWordText, setTargetWordText] = useState('')
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [maxAttempts] = useState(6)
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({})
  const [score, setScore] = useState(0)
  const [kanaMode, setKanaMode] = useState<'hiragana' | 'katakana'>('hiragana')

  useEffect(() => {
    if (words.length === 0) {
      alert('單字本中沒有單字')
      onBack()
      return
    }

    // 隨機選擇一個單字
    const availableWords = words.filter((w: Word) => w.word && w.word.trim().length > 0)
    if (availableWords.length === 0) {
      alert('單字本中沒有有效的單字')
      onBack()
      return
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)]
    const isJapanese = isJapaneseLanguage(langUse)
    const wordText = isJapanese ? randomWord.word.trim() : randomWord.word.trim().toLowerCase()
    
    setTargetWord(randomWord)
    setTargetWordText(wordText)
    setGuesses([])
    setCurrentGuess('')
    setGameWon(false)
    setGameLost(false)
    setLetterStates({})
    setScore(0)
    setKanaMode('hiragana')
  }, [words, langUse, onBack])

  const evaluateGuess = (guess: string, target: string): LetterState[] => {
    const states: LetterState[] = new Array(guess.length).fill('absent')
    const isJapanese = isJapaneseLanguage(langUse)
    
    const targetChars = isJapanese ? Array.from(target) : target.split('')
    const guessChars = isJapanese ? Array.from(guess) : guess.split('')
    const targetCounts: Record<string, number> = {}
    const guessCounts: Record<string, number> = {}

    targetChars.forEach(char => {
      targetCounts[char] = (targetCounts[char] || 0) + 1
    })

    guessChars.forEach((char, index) => {
      if (char === targetChars[index]) {
        states[index] = 'correct'
        guessCounts[char] = (guessCounts[char] || 0) + 1
      }
    })

    guessChars.forEach((char, index) => {
      if (states[index] !== 'correct') {
        const correctCount = targetCounts[char] || 0
        const usedCount = guessCounts[char] || 0
        if (usedCount < correctCount) {
          states[index] = 'present'
          guessCounts[char] = (guessCounts[char] || 0) + 1
        }
      }
    })

    return states
  }

  const handleSubmitGuess = () => {
    if (currentGuess.length !== targetWordText.length) {
      const isJapanese = isJapaneseLanguage(langUse)
      alert(`請輸入 ${targetWordText.length} 個${isJapanese ? '字符' : '字母'}的單字`)
      return
    }

    const isJapanese = isJapaneseLanguage(langUse)
    const guess = isJapanese ? currentGuess.trim() : currentGuess.toLowerCase().trim()
    const states = evaluateGuess(guess, targetWordText)

    const newGuesses = [...guesses, { word: guess, states }]
    setGuesses(newGuesses)
    setCurrentGuess('')

    const newLetterStates = { ...letterStates }
    const guessChars = isJapanese ? Array.from(guess) : guess.split('')
    guessChars.forEach((char, index) => {
      const currentState = newLetterStates[char]
      const newState = states[index]

      if (!currentState || 
          (currentState === 'absent' && newState !== 'absent') ||
          (currentState === 'present' && newState === 'correct')) {
        newLetterStates[char] = newState
      }
    })
    setLetterStates(newLetterStates)

    if (guess === targetWordText) {
      setGameWon(true)
      const attemptsUsed = newGuesses.length
      const pointsEarned = Math.max(1, (maxAttempts - attemptsUsed + 1) * 100)
      setScore(pointsEarned)
      onGameEnd(true, pointsEarned)
    } else if (newGuesses.length >= maxAttempts) {
      setGameLost(true)
      onGameEnd(false, 0)
    }
  }

  const handleKeyPress = (key: string) => {
    if (gameWon || gameLost) return

    if (key === 'Enter') {
      if (currentGuess.length === targetWordText.length) {
        handleSubmitGuess()
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (key === 'ToggleKana') {
      setKanaMode(prev => prev === 'hiragana' ? 'katakana' : 'hiragana')
    } else if (key.length === 1) {
      const isJapanese = isJapaneseLanguage(langUse)
      if (isJapanese) {
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(key)) {
          if (currentGuess.length < targetWordText.length) {
            setCurrentGuess(prev => prev + key)
          }
        }
      } else {
        if (/[a-zA-Z]/.test(key)) {
          if (currentGuess.length < targetWordText.length) {
            setCurrentGuess(prev => prev + key.toLowerCase())
          }
        }
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameWon || gameLost) return
      
      const isJapanese = isJapaneseLanguage(langUse)
      
      if (e.key === 'Enter') {
        e.preventDefault()
        if (currentGuess.length === targetWordText.length) {
          handleSubmitGuess()
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setCurrentGuess(prev => prev.slice(0, -1))
      } else if (!isJapanese && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault()
        if (currentGuess.length < targetWordText.length) {
          setCurrentGuess(prev => prev + e.key.toLowerCase())
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGuess, targetWordText, gameWon, gameLost, langUse])

  const getLetterColor = (state: LetterState) => {
    switch (state) {
      case 'correct':
        return '#6aaa64'
      case 'present':
        return '#c9b458'
      case 'absent':
        return '#787c7e'
      default:
        return '#d3d6da'
    }
  }

  const getLetterTextColor = (state: LetterState) => {
    return state === 'empty' ? '#000' : '#fff'
  }

  if (!targetWord) {
    return null
  }

  const currentRow = guesses.length
  const emptyRows = maxAttempts - guesses.length - (gameWon || gameLost ? 0 : 1)
  const isJapanese = isJapaneseLanguage(langUse)

  return (
    <Box>
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          {targetWord && (
            <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  提示
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {targetWord.explanation}
                </Typography>
                {targetWord.sentence && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    "{targetWord.sentence}"
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                  單字長度: {targetWordText.length} 個{isJapanese ? '字符' : '字母'}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Box sx={{ mb: 4 }}>
            {guesses.map((guess, rowIndex) => {
              const guessChars = isJapanese ? Array.from(guess.word) : guess.word.split('')
              return (
                <Grid container spacing={1} key={rowIndex} sx={{ mb: 1, justifyContent: 'center' }}>
                  {guessChars.map((char, colIndex) => (
                    <Grid item key={colIndex}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: getLetterColor(guess.states[colIndex]),
                          color: getLetterTextColor(guess.states[colIndex]),
                          fontWeight: 'bold',
                          fontSize: isJapanese ? '1.2rem' : '1.5rem',
                          borderRadius: 1,
                          border: '2px solid',
                          borderColor: guess.states[colIndex] === 'empty' ? '#d3d6da' : 'transparent',
                        }}
                      >
                        {isJapanese ? char : char.toUpperCase()}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )
            })}

            {!gameWon && !gameLost && (() => {
              const currentGuessChars = isJapanese ? Array.from(currentGuess) : currentGuess.split('')
              return (
                <Grid container spacing={1} sx={{ mb: 1, justifyContent: 'center' }}>
                  {Array.from({ length: targetWordText.length }).map((_, index) => (
                    <Grid item key={index}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'white',
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: isJapanese ? '1.2rem' : '1.5rem',
                          borderRadius: 1,
                          border: '2px solid #d3d6da',
                        }}
                      >
                        {isJapanese ? (currentGuessChars[index] || '') : (currentGuess[index]?.toUpperCase() || '')}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )
            })()}

            {Array.from({ length: emptyRows }).map((_, rowIndex) => (
              <Grid container spacing={1} key={`empty-${rowIndex}`} sx={{ mb: 1, justifyContent: 'center' }}>
                {Array.from({ length: targetWordText.length }).map((_, colIndex) => (
                  <Grid item key={colIndex}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: '2px solid #d3d6da',
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            ))}
          </Box>

          {!gameWon && !gameLost && (() => {
            if (isJapanese) {
              const hiraganaRows = [
                'あいうえお',
                'かきくけこ',
                'さしすせそ',
                'たちつてと',
                'なにぬねの',
                'はひふへほ',
                'まみむめも',
                'やゆよ',
                'らりるれろ',
                'わをん',
              ]
              
              const katakanaRows = [
                'アイウエオ',
                'カキクケコ',
                'サシスセソ',
                'タチツテト',
                'ナニヌネノ',
                'ハヒフヘホ',
                'マミムメモ',
                'ヤユヨ',
                'ラリルレロ',
                'ワヲン',
              ]
              
              const kanaRows = kanaMode === 'hiragana' ? hiraganaRows : katakanaRows
              
              return (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Button
                      variant={kanaMode === 'hiragana' ? 'contained' : 'outlined'}
                      onClick={() => setKanaMode('hiragana')}
                      size="small"
                    >
                      ひらがな
                    </Button>
                    <Button
                      variant={kanaMode === 'katakana' ? 'contained' : 'outlined'}
                      onClick={() => setKanaMode('katakana')}
                      size="small"
                    >
                      カタカナ
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    點擊下方按鈕輸入，或使用系統輸入法
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {kanaRows.map((row, rowIndex) => (
                      <Box key={rowIndex} sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {row.split('').map((kana) => (
                          <Button
                            key={kana}
                            variant="outlined"
                            onClick={() => handleKeyPress(kana)}
                            disabled={currentGuess.length >= targetWordText.length}
                            sx={{
                              minWidth: 45,
                              height: 45,
                              fontSize: '1.1rem',
                              bgcolor: letterStates[kana] ? getLetterColor(letterStates[kana]) : 'white',
                              color: letterStates[kana] ? '#fff' : '#000',
                              borderColor: letterStates[kana] ? 'transparent' : '#d3d6da',
                              '&:hover': {
                                bgcolor: letterStates[kana] ? getLetterColor(letterStates[kana]) : 'grey.100',
                              },
                            }}
                          >
                            {kana}
                          </Button>
                        ))}
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleKeyPress('Backspace')}
                        sx={{ minWidth: 80, height: 45 }}
                      >
                        ⌫ 刪除
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleKeyPress('Enter')}
                        disabled={currentGuess.length !== targetWordText.length}
                        sx={{ minWidth: 80, height: 45 }}
                      >
                        ✓ 確認
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )
            } else {
              return (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    使用鍵盤輸入或點擊下方按鈕
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row, rowIndex) => (
                      <Box key={rowIndex} sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {row.split('').map((letter) => (
                          <Button
                            key={letter}
                            variant="outlined"
                            onClick={() => handleKeyPress(letter)}
                            disabled={currentGuess.length >= targetWordText.length}
                            sx={{
                              minWidth: 40,
                              height: 50,
                              bgcolor: letterStates[letter] ? getLetterColor(letterStates[letter]) : 'white',
                              color: letterStates[letter] ? '#fff' : '#000',
                              borderColor: letterStates[letter] ? 'transparent' : '#d3d6da',
                              '&:hover': {
                                bgcolor: letterStates[letter] ? getLetterColor(letterStates[letter]) : 'grey.100',
                              },
                            }}
                          >
                            {letter.toUpperCase()}
                          </Button>
                        ))}
                        {rowIndex === 2 && (
                          <>
                            <Button
                              variant="outlined"
                              onClick={() => handleKeyPress('Backspace')}
                              sx={{ minWidth: 60, height: 50 }}
                            >
                              ⌫
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => handleKeyPress('Enter')}
                              disabled={currentGuess.length !== targetWordText.length}
                              sx={{ minWidth: 60, height: 50 }}
                            >
                              ✓
                            </Button>
                          </>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )
            }
          })()}

          {gameWon && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6">恭喜！你猜對了！</Typography>
              <Typography variant="body2">
                使用了 {guesses.length} / {maxAttempts} 次嘗試
              </Typography>
            </Alert>
          )}

          {gameLost && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">遊戲結束</Typography>
              <Typography variant="body2">
                正確答案是: <strong>{targetWordText.toUpperCase()}</strong>
              </Typography>
            </Alert>
          )}

          {(gameWon || gameLost) && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={onBack}>
                返回
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}

