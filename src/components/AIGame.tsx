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
  Grid,
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

type GameStage = 'countdown' | 'playing' | 'result'

export default function AIGame({ words, langUse, langExp, onGameEnd, onBack }: AIGameProps) {
  const [stage, setStage] = useState<GameStage>('countdown')
  const [countdown, setCountdown] = useState(5)
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

  const TIME_LIMIT = 10
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [aiCorrectRate, setAiCorrectRate] = useState(0.9)
  const [aiMinTime, setAiMinTime] = useState(2)
  const [aiMaxTime, setAiMaxTime] = useState(5)

  // 获取游戏参数
  useEffect(() => {
    const fetchGameParams = async () => {
      try {
        const response = await fetch("/api/student/game/params");
        if (response.ok) {
          const data = await response.json();
          if (data.aiKing) {
            setTotalQuestions(data.aiKing.totalQuestions || 10);
            setAiCorrectRate(data.aiKing.aiCorrectRate || 0.9);
            setAiMinTime(data.aiKing.aiMinTime || 2);
            setAiMaxTime(data.aiKing.aiMaxTime || 5);
          }
        }
      } catch (error) {
        console.error("获取游戏参数失败:", error);
      }
    };
    fetchGameParams();
  }, []);

  // 生成题目
  useEffect(() => {
    if (totalQuestions === 0 || stage !== 'countdown') return; // 等待参数加载和倒数阶段
    const generatedQuestions: Question[] = []
    for (let i = 0; i < totalQuestions; i++) {
      // 混合选项：随机选择 0-4 中的一种类型
      const actualQuestionType = Math.floor(Math.random() * 5) as QuestionType
      const question = examiner(words, actualQuestionType)
      if (question) {
        generatedQuestions.push(question)
      }
    }
    setQuestions(generatedQuestions)
    setTimeLeft(TIME_LIMIT)
  }, [totalQuestions, words, stage])
  
  // 倒数计时（游戏开始前）
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('playing')
    }
  }, [stage, countdown])

  // 倒计时（答题时间）
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

    // AI 在 aiMinTime-aiMaxTime 秒之间随机时间回答
    const aiTime = Math.random() * (aiMaxTime - aiMinTime) + aiMinTime
    setAiAnswerTime(Math.round(aiTime * 10) / 10)

    const aiTimer = setTimeout(() => {
      // 如果玩家已经答题，不再计算 AI 得分
      if (currentAnswer !== null) {
        setAiAnswered(true)
        return
      }

      // 根据参数设定的答对率
      const isCorrect = Math.random() < aiCorrectRate
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
  }, [stage, currentQuestionIndex, questions.length, aiAnswered, currentAnswer, aiMinTime, aiMaxTime, aiCorrectRate])

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

  // 倒数画面
  if (stage === 'countdown') {
    return (
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          {/* 正上方显示倒数 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h1" color="primary">
              {countdown}
            </Typography>
          </Box>
          
          {/* 游戏规则 */}
          <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                遊戲規則
              </Typography>
              <Typography variant="body1" component="div" sx={{ mt: 2 }}>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>與 AI 對戰，看誰答對更多題目</li>
                  <li>共有 {totalQuestions} 題</li>
                  <li>每題有 {TIME_LIMIT} 秒答題時間</li>
                  <li>答對越快得分越高</li>
                  <li>AI 會在 {aiMinTime}-{aiMaxTime} 秒內答題，正確率 {Math.round(aiCorrectRate * 100)}%</li>
                  <li>最終得分 = 玩家得分 - AI 得分（如果{'>'}0則獲得點數）</li>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    )
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
            <Button variant="contained" onClick={() => {
              setStage('countdown')
              setCountdown(5)
              setCurrentQuestionIndex(0)
              setPlayerScore(0)
              setAiScore(0)
              setAnswers([])
              setWrongAnswers([])
              // 重新生成题目
              const generatedQuestions: Question[] = []
              for (let i = 0; i < totalQuestions; i++) {
                const actualQuestionType = Math.floor(Math.random() * 5) as QuestionType
                const question = examiner(words, actualQuestionType)
                if (question) {
                  generatedQuestions.push(question)
                }
              }
              setQuestions(generatedQuestions)
              setTimeLeft(TIME_LIMIT)
            }} sx={{ mr: 2 }}>
              再玩一次
            </Button>
            <Button variant="outlined" onClick={onBack}>
              返回遊戲選擇
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

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  // 渲染选项内容（带高亮）
  const renderOptionContent = (option: string, highlights: any[]) => {
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
      return <>{parts}</>
    }
    return option
  }

  return (
    <Box sx={{ mt: 2, maxWidth: 1000, mx: 'auto', px: 2 }}>
      <Paper sx={{ p: 3 }}>
        {/* Row 1: 当前题目/总题目、时间倒数 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h6" color="text.secondary">
                進度: {currentQuestionIndex + 1} / {totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                你的得分: {playerScore.toFixed(3)} | 電腦得分: {aiScore.toFixed(3)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h3"
                color={timeLeft <= 3 ? 'error.main' : 'primary.main'}
                sx={{ fontWeight: 'bold' }}
              >
                {timeLeft}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                剩餘時間（秒）
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Row 2: 题目 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">題目</Typography>
              {(currentQuestion.questionType === 3 || currentQuestion.questionType === 4) && (
                <Button
                  startIcon={<VolumeUpIcon />}
                  onClick={handleSpeak}
                  variant="outlined"
                  disabled={isSpeaking}
                  size="small"
                >
                  {isSpeaking ? '播放中...' : '播放題目'}
                </Button>
              )}
            </Box>
            {currentQuestion.questionType !== 3 && currentQuestion.questionType !== 4 ? (
              <Typography variant="h6" sx={{ mt: 1 }}>
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
              <Box sx={{ mt: 1, minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  請點擊播放按鈕聽題目
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Row 3: A, B各半 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[0, 1].map((index) => {
            const highlights = currentQuestion.optionsHighlight?.[index] || []
            const optionLabel = ['A', 'B', 'C', 'D'][index]
            const isSelected = currentAnswer === index
            return (
              <Grid item xs={6} key={index}>
                <Box
                  onClick={() => {
                    if (currentAnswer === null) {
                      handleAnswer(index)
                    }
                  }}
                  sx={{
                    width: '100%',
                    p: 2,
                    border: '2px solid',
                    borderColor: isSelected 
                      ? (feedback === 'correct' ? 'success.main' : 'error.main')
                      : 'divider',
                    borderRadius: 2,
                    bgcolor: isSelected 
                      ? (feedback === 'correct' ? 'success.light' : 'error.light')
                      : 'transparent',
                    '&:hover': currentAnswer === null && !aiAnswered ? { 
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    } : {},
                    cursor: currentAnswer === null ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Radio
                    checked={isSelected}
                    disabled={currentAnswer !== null}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {optionLabel}. {renderOptionContent(currentQuestion.options[index], highlights)}
                  </Typography>
                </Box>
              </Grid>
            )
          })}
        </Grid>

        {/* Row 4: C, D各半 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[2, 3].map((index) => {
            const highlights = currentQuestion.optionsHighlight?.[index] || []
            const optionLabel = ['A', 'B', 'C', 'D'][index]
            const isSelected = currentAnswer === index
            return (
              <Grid item xs={6} key={index}>
                <Box
                  onClick={() => {
                    if (currentAnswer === null) {
                      handleAnswer(index)
                    }
                  }}
                  sx={{
                    width: '100%',
                    p: 2,
                    border: '2px solid',
                    borderColor: isSelected 
                      ? (feedback === 'correct' ? 'success.main' : 'error.main')
                      : 'divider',
                    borderRadius: 2,
                    bgcolor: isSelected 
                      ? (feedback === 'correct' ? 'success.light' : 'error.light')
                      : 'transparent',
                    '&:hover': currentAnswer === null && !aiAnswered ? { 
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    } : {},
                    cursor: currentAnswer === null ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Radio
                    checked={isSelected}
                    disabled={currentAnswer !== null}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {optionLabel}. {renderOptionContent(currentQuestion.options[index], highlights)}
                  </Typography>
                </Box>
              </Grid>
            )
          })}
        </Grid>

        {/* Row 5: 电脑回答情况 */}
        <Box sx={{ mb: 2 }}>
          {aiAnswerTime !== null && !aiAnswered && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                電腦將在 {aiAnswerTime} 秒後回答
              </Typography>
            </Alert>
          )}
          {aiAnswered && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                電腦已回答
              </Typography>
            </Alert>
          )}
          {feedback && (
            <Alert 
              severity={feedback === 'correct' ? 'success' : 'error'} 
              icon={feedback === 'correct' ? <CheckCircleIcon /> : <CancelIcon />}
            >
              {feedback === 'correct' 
                ? `答對了！+${Math.round((5 * timeLeft / TIME_LIMIT) * 1000) / 1000} 分`
                : '答錯了'}
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

