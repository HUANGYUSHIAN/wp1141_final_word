'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { examiner, Question, QuestionType, Word } from '@/lib/utils/examiner'
import { speakAsync } from '@/lib/utils/speechUtils'
import { normalizeLanguage } from '@/lib/utils/languageUtils'

interface AIGameProps {
  words: Word[]
  langUse: string
  langExp: string
  onGameEnd: (playerScore: number, aiScore: number, wrongAnswers: WrongAnswer[]) => void
  onBack: () => void
}

interface WrongAnswer {
  question: Question
  userAnswer: number
  correctAnswer: number
  timeSpent: number
}

type GameStage = 'playing' | 'result'

export default function AIGame({ words, langUse, langExp, onGameEnd, onBack }: AIGameProps) {
  const [stage, setStage] = useState<GameStage>('playing')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [answers, setAnswers] = useState<Array<{ question: Question; userAnswer: number; timeSpent: number; isCorrect: boolean }>>([])
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [aiAnswerTime, setAiAnswerTime] = useState<number | null>(null)
  const [aiAnswered, setAiAnswered] = useState(false)

  const TOTAL_QUESTIONS = 20
  const TIME_LIMIT = 10
  const AI_CORRECT_RATE = 0.9
  const AI_MIN_TIME = 2
  const AI_MAX_TIME = 5

  // 生成题目
  useEffect(() => {
    const generatedQuestions: Question[] = []
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      // 混合选项：随机选择 0-4 中的一种类型
      const actualQuestionType = Math.floor(Math.random() * 5) as QuestionType
      const question = examiner(words, actualQuestionType)
      if (question) {
        generatedQuestions.push(question)
      }
    }
    setQuestions(generatedQuestions)
    setTimeLeft(TIME_LIMIT)
  }, [])

  // 倒计时
  useEffect(() => {
    if (stage !== 'playing' || currentQuestionIndex >= questions.length) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到，自动选择（视为答错）
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [stage, currentQuestionIndex, questions.length])

  // AI 答题逻辑
  useEffect(() => {
    if (stage !== 'playing' || currentQuestionIndex >= questions.length || aiAnswered || currentAnswer !== null) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // AI 在 2-5 秒之间随机时间回答
    const aiTime = Math.random() * (AI_MAX_TIME - AI_MIN_TIME) + AI_MIN_TIME
    setAiAnswerTime(Math.round(aiTime * 10) / 10)

    const aiTimer = setTimeout(() => {
      // 如果玩家已经答题，不再计算 AI 得分
      if (currentAnswer !== null) {
        setAiAnswered(true)
        return
      }

      // 90% 机会答对
      const isCorrect = Math.random() < AI_CORRECT_RATE
      const aiAnswer = isCorrect 
        ? currentQuestion.correctAnswer 
        : Math.floor(Math.random() * 4)
      
      // 计算 AI 得分（剩余时间）
      const remainingTime = TIME_LIMIT - aiTime
      if (isCorrect && remainingTime > 0) {
        const score = Math.round((5 * remainingTime / TIME_LIMIT) * 1000) / 1000
        setAiScore((prev) => prev + score)
      }

      setAiAnswered(true)
    }, aiTime * 1000)

    return () => clearTimeout(aiTimer)
  }, [stage, currentQuestionIndex, questions.length, aiAnswered, currentAnswer])

  const handleTimeUp = () => {
    if (currentAnswer !== null) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // 时间到，立即标记 AI 已回答（停止 AI 计时）
    setAiAnswered(true)
    setAiAnswerTime(null)

    // 时间到，视为答错
    const answerRecord = {
      question: currentQuestion,
      userAnswer: -1,
      timeSpent: TIME_LIMIT * 1000,
      isCorrect: false,
    }

    setAnswers((prev) => [...prev, answerRecord])
    setCurrentAnswer(-1)
    setFeedback('wrong')

    setTimeout(() => {
      nextQuestion()
    }, 1000)
  }

  const handleAnswer = (answerIndex: number) => {
    if (currentAnswer !== null) return

    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
    }

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // 玩家答题后，立即标记 AI 已回答（停止 AI 计时）
    setAiAnswered(true)
    setAiAnswerTime(null)

    const timeSpent = (TIME_LIMIT - timeLeft) * 1000
    const isCorrect = answerIndex === currentQuestion.correctAnswer

    const answerRecord = {
      question: currentQuestion,
      userAnswer: answerIndex,
      timeSpent,
      isCorrect,
    }

    setAnswers((prev) => [...prev, answerRecord])
    setCurrentAnswer(answerIndex)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    // 计算得分
    if (isCorrect) {
      const remainingTime = timeLeft
      const score = Math.round((5 * remainingTime / TIME_LIMIT) * 1000) / 1000
      setPlayerScore((prev) => prev + score)
    }

    setTimeout(() => {
      nextQuestion()
    }, 1000)
  }

  const nextQuestion = () => {
    setFeedback(null)
    setCurrentAnswer(null)
    setAiAnswered(false)
    setAiAnswerTime(null)
    setTimeLeft(TIME_LIMIT)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      finishGame()
    }
  }

  const finishGame = () => {
    const wrongAnswersList: WrongAnswer[] = answers
      .filter((a) => !a.isCorrect)
      .map((a) => ({
        question: a.question,
        userAnswer: a.userAnswer,
        correctAnswer: a.question.correctAnswer,
        timeSpent: a.timeSpent,
      }))

    setWrongAnswers(wrongAnswersList)
    setStage('result')
    onGameEnd(playerScore, aiScore, wrongAnswersList)
  }

  const handleSpeak = async () => {
    if (questions.length === 0) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    setIsSpeaking(true)

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const langUseCode = normalizeLanguage(langUse)

      if (currentQuestion.questionType === 0 || currentQuestion.questionType === 2) {
        const processedSentence = currentQuestion.question || ''
        if (processedSentence) {
          await speakAsync(langUseCode, processedSentence, 0.8)
        }
      } else if (currentQuestion.questionType === 3 || currentQuestion.questionType === 4) {
        const questionText = currentQuestion.question || ''
        const parts = questionText.split(' ')
        if (parts.length >= 2) {
          const sentence = parts.slice(0, -1).join(' ')
          await speakAsync(langUseCode, sentence, 0.8)
        }
      }

      setIsSpeaking(false)
    } catch (error) {
      console.error('語音播放失敗:', error)
      setIsSpeaking(false)
    }
  }

  if (stage === 'result') {
    const finalScore = Math.round(playerScore - aiScore)
    const earnedPoints = finalScore > 0 ? Math.round(finalScore) : 0

    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            遊戲結束
          </Typography>

          <Box sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
              <Card sx={{ p: 2, textAlign: 'center', minWidth: 150 }}>
                <Typography variant="h6" color="text.secondary">
                  你的得分
                </Typography>
                <Typography variant="h4" color="primary">
                  {playerScore.toFixed(3)}
                </Typography>
              </Card>
              <Card sx={{ p: 2, textAlign: 'center', minWidth: 150 }}>
                <Typography variant="h6" color="text.secondary">
                  電腦得分
                </Typography>
                <Typography variant="h4" color="secondary">
                  {aiScore.toFixed(3)}
                </Typography>
              </Card>
              <Card sx={{ p: 2, textAlign: 'center', minWidth: 150 }}>
                <Typography variant="h6" color="text.secondary">
                  獲得點數
                </Typography>
                <Typography variant="h4" color={earnedPoints > 0 ? 'success.main' : 'text.secondary'}>
                  {earnedPoints}
                </Typography>
              </Card>
            </Box>

            {wrongAnswers.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  錯誤題目 ({wrongAnswers.length} 題)
                </Typography>
                {wrongAnswers.map((wrong, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>題目：</strong>
                      {wrong.question.question}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`你的答案：${wrong.question.options[wrong.userAnswer] || '未作答'}`}
                        color="error"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`正確答案：${wrong.question.options[wrong.correctAnswer]}`}
                        color="success"
                        size="small"
                      />
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={onBack}>
              返回
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  if (questions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) {
    return null
  }

  const progress = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100

  return (
    <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        {/* 进度条 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              進度: {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              你的得分: {playerScore.toFixed(3)} | 電腦得分: {aiScore.toFixed(3)}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
        </Box>

        {/* 倒计时 */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography
            variant="h2"
            color={timeLeft <= 3 ? 'error.main' : 'primary.main'}
            sx={{ fontWeight: 'bold' }}
          >
            {timeLeft}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            剩餘時間（秒）
          </Typography>
        </Box>

        {/* 题目 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">題目</Typography>
              {(currentQuestion.questionType === 3 || currentQuestion.questionType === 4) && (
                <Button
                  startIcon={<VolumeUpIcon />}
                  onClick={handleSpeak}
                  variant="outlined"
                  disabled={isSpeaking}
                >
                  {isSpeaking ? '播放中...' : '播放題目'}
                </Button>
              )}
            </Box>
            {currentQuestion.questionType !== 3 && currentQuestion.questionType !== 4 ? (
              <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
                {currentQuestion.questionHighlight ? (
                  <>
                    {currentQuestion.question.substring(0, currentQuestion.questionHighlight.startIndex)}
                    <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {currentQuestion.questionHighlight.word}
                    </Box>
                    {currentQuestion.question.substring(currentQuestion.questionHighlight.endIndex)}
                  </>
                ) : (
                  currentQuestion.question
                )}
              </Typography>
            ) : (
              <Box sx={{ mt: 2, mb: 3, minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  請點擊播放按鈕聽題目
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 选项 */}
        <Box sx={{ mb: 3 }}>
          <RadioGroup
            value={currentAnswer !== null ? currentAnswer.toString() : ''}
            onChange={(e) => handleAnswer(parseInt(e.target.value))}
          >
            {currentQuestion.options.map((option, index) => {
              const highlights = currentQuestion.optionsHighlight?.[index] || []
              let displayOption = option

              if (highlights.length > 0 && option) {
                const parts: React.ReactNode[] = []
                let lastIndex = 0
                highlights.forEach((highlight) => {
                  if (highlight.startIndex > lastIndex) {
                    parts.push(option.substring(lastIndex, highlight.startIndex))
                  }
                  parts.push(
                    <Box key={highlight.startIndex} component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {highlight.word}
                    </Box>
                  )
                  lastIndex = highlight.endIndex
                })
                if (lastIndex < option.length) {
                  parts.push(option.substring(lastIndex))
                }
                displayOption = parts as any
              }

              return (
                <FormControlLabel
                  key={index}
                  value={index.toString()}
                  control={<Radio />}
                  label={
                    <Typography variant="body1">
                      {typeof displayOption === 'string' ? displayOption : displayOption}
                    </Typography>
                  }
                  disabled={currentAnswer !== null}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': currentAnswer === null && !aiAnswered ? { bgcolor: 'action.hover' } : {},
                  }}
                />
              )
            })}
          </RadioGroup>
        </Box>

        {/* 反馈提示 */}
        {feedback && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            {feedback === 'correct' ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                答對了！+{Math.round((5 * timeLeft / TIME_LIMIT) * 1000) / 1000} 分
              </Alert>
            ) : (
              <Alert severity="error" icon={<CancelIcon />}>
                答錯了
              </Alert>
            )}
          </Box>
        )}

        {/* AI 答题提示 */}
        {aiAnswerTime !== null && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              電腦將在 {aiAnswerTime} 秒後回答
            </Typography>
          </Box>
        )}

        {aiAnswered && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Alert severity="info">
              電腦已回答
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

