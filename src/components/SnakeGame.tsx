'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material'

interface Word {
  id?: string
  word: string
  spelling?: string | null
  explanation: string
  partOfSpeech?: string | null
  sentence?: string | null
}

interface Position {
  x: number
  y: number
}

interface Food {
  position: Position
  char: string
  isAnswer: boolean
  index: number // 在答案中的索引位置
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameStage = 'countdown' | 'playing' | 'roundComplete' | 'gameOver'

interface SnakeGameProps {
  words: Word[]
  langUse: string
  onGameEnd: (score: number) => void
  onBack: () => void
}

const GRID_WIDTH = 30  // 宽度增加
const GRID_HEIGHT = 15 // 高度减少
const CELL_SIZE = 25
const GAME_SPEED = 250 // 毫秒，减慢速度

export default function SnakeGame({ words, langUse, onGameEnd, onBack }: SnakeGameProps) {
  const [stage, setStage] = useState<GameStage>('countdown')
  const [countdown, setCountdown] = useState(5)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [answer, setAnswer] = useState<string>('')
  const [hint, setHint] = useState<string>('') // 显示 spelling 或 word
  const [explanation, setExplanation] = useState<string>('')
  // 初始蛇：3格，头部在 (10, 10)，身体在 (9, 10) 和 (8, 10)
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 }, // 头部
    { x: 9, y: 10 },  // 身体1
    { x: 8, y: 10 },  // 身体2
  ])
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT')
  const [foods, setFoods] = useState<Food[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [eatenChars, setEatenChars] = useState<string[]>([]) // 已吃掉的字符，按顺序
  const [gameOverMessage, setGameOverMessage] = useState<string>('')
  const [wrongWords, setWrongWords] = useState<string[]>([]) // 记录拼错的单字
  
  // 初始化 refs
  useEffect(() => {
    livesRef.current = 3
    scoreRef.current = 0
  }, [])
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const foodsRef = useRef<Food[]>([])
  const eatenCharsRef = useRef<string[]>([])
  const answerRef = useRef<string>('')
  const livesRef = useRef<number>(3)
  const scoreRef = useRef<number>(0)
  const wrongWordsRef = useRef<string[]>([]) // 记录拼错的单字

  // 初始化游戏
  const initGame = useCallback(() => {
    if (words.length === 0) {
      alert('單字本中沒有單字')
      onBack()
      return
    }

    // 随机选择一个单字
    const randomWord = words[Math.floor(Math.random() * words.length)]
    setCurrentWord(randomWord)
    
    // 确定答案：优先使用 Spelling，否则使用 Word
    const answerText = randomWord.spelling && randomWord.spelling.trim() 
      ? randomWord.spelling.trim() 
      : randomWord.word.trim()
    
    // Hint：显示 spelling 或 word（用于提示）
    const hintText = randomWord.spelling && randomWord.spelling.trim()
      ? randomWord.spelling.trim()
      : randomWord.word.trim()
    
    setAnswer(answerText)
    answerRef.current = answerText
    setHint(hintText)
    setExplanation(randomWord.explanation)
    
     // 重置游戏状态，初始蛇为3格（调整到宽扁网格的中心）
     setSnake([
       { x: 15, y: 7 }, // 头部
       { x: 14, y: 7 },  // 身体1
       { x: 13, y: 7 },  // 身体2
     ])
        setDirection('RIGHT')
        setNextDirection('RIGHT')
        setEatenChars([])
        eatenCharsRef.current = []
         setScore(0)
         scoreRef.current = 0
         setLives(3)
         livesRef.current = 3
         setWrongWords([])
         wrongWordsRef.current = []
         setStage('countdown')
         setCountdown(5)
  }, [words, onBack])

  // 生成随机位置（不与蛇身重叠）
  const generateRandomPosition = useCallback((excludePositions: Position[]): Position => {
    let position: Position
    let attempts = 0
    const maxAttempts = 1000
    do {
      position = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      }
      attempts++
      if (attempts > maxAttempts) {
        // 如果尝试次数过多，返回一个随机位置（可能重叠，但避免无限循环）
        break
      }
    } while (excludePositions.some(pos => pos.x === position.x && pos.y === position.y))
    return position
  }, [])

  // 散布字符到游戏空间
  const scatterChars = useCallback(() => {
    if (!answerRef.current) return

    const answerChars = Array.from(answerRef.current)
    const allPositions: Position[] = []
    const newFoods: Food[] = []

    // 散布答案字符
    answerChars.forEach((char, index) => {
      const position = generateRandomPosition(allPositions)
      allPositions.push(position)
      newFoods.push({
        position,
        char,
        isAnswer: true,
        index,
      })
    })

    // 随机选择另一个单字作为混淆
    const availableWords = words.filter(w => w !== currentWord)
    if (availableWords.length > 0) {
      const confuseWord = availableWords[Math.floor(Math.random() * availableWords.length)]
      const confuseAnswer = confuseWord.spelling && confuseWord.spelling.trim()
        ? confuseWord.spelling.trim()
        : confuseWord.word.trim()
      const confuseChars = Array.from(confuseAnswer)

      // 散布混淆字符
      confuseChars.forEach((char) => {
        const position = generateRandomPosition(allPositions)
        allPositions.push(position)
        newFoods.push({
          position,
          char,
          isAnswer: false,
          index: -1,
        })
      })
    }

    foodsRef.current = newFoods
    setFoods(newFoods)
  }, [words, currentWord, generateRandomPosition])

  // 倒计时
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => {
        if (countdownRef.current) clearTimeout(countdownRef.current)
      }
    } else if (stage === 'countdown' && countdown === 0) {
      scatterChars()
      setStage('playing')
    }
  }, [stage, countdown, scatterChars])

  // 游戏循环
  useEffect(() => {
    if (stage !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake]
        const head = { ...newSnake[0] }
        const currentDir = nextDirection

        // 移动头部
        switch (currentDir) {
          case 'UP':
            head.y -= 1
            break
          case 'DOWN':
            head.y += 1
            break
          case 'LEFT':
            head.x -= 1
            break
          case 'RIGHT':
            head.x += 1
            break
        }

        // 检查撞墙
        if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
          setTimeout(() => {
            handleLoseLife('撞牆了！')
          }, 0)
          return prevSnake
        }

        // 检查撞到自己
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setTimeout(() => {
            handleLoseLife('撞到自己了！')
          }, 0)
          return prevSnake
        }

        // 检查是否吃到食物
        const currentFoods = foodsRef.current
        const foodIndex = currentFoods.findIndex(
          f => f.position.x === head.x && f.position.y === head.y
        )

        if (foodIndex !== -1) {
          const food = currentFoods[foodIndex]
          
          // 检查是否按正确顺序吃
          const expectedIndex = eatenCharsRef.current.length
          if (food.isAnswer && food.index === expectedIndex) {
            // 正确顺序，吃掉
            const newEatenChars = [...eatenCharsRef.current, food.char]
            eatenCharsRef.current = newEatenChars
            setEatenChars(newEatenChars)
            const newFoods = currentFoods.filter((_, i) => i !== foodIndex)
            foodsRef.current = newFoods
            setFoods(newFoods)

            // 检查是否完成拼字
            if (newEatenChars.length === answerRef.current.length) {
              // 完成拼字，蛇变长两格
              newSnake.unshift(head)
              const tail = newSnake[newSnake.length - 1]
              newSnake.push({ ...tail })
              newSnake.push({ ...tail })
              
              // 完成一轮
              scoreRef.current += 1
              setScore(scoreRef.current)
              eatenCharsRef.current = []
              setEatenChars([])
              setStage('roundComplete')
              return newSnake
            } else {
              // 继续游戏，蛇变长一格
              newSnake.unshift(head)
              return newSnake
            }
          } else {
            // 吃错顺序或吃到混淆字符
            // 记录当前拼错的单字
            const wrongWord = currentWord?.word || ''
            if (wrongWord && !wrongWordsRef.current.includes(wrongWord)) {
              wrongWordsRef.current.push(wrongWord)
              setWrongWords([...wrongWordsRef.current])
            }
            setTimeout(() => {
              handleLoseLife('吃錯順序了！')
            }, 0)
            return prevSnake
          }
        } else {
          // 没吃到，正常移动
          newSnake.unshift(head)
          newSnake.pop()
          return newSnake
        }
      })
      
      setDirection(nextDirection)
    }, GAME_SPEED)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [stage, nextDirection])

  // 处理失去生命
  const handleLoseLife = (message: string) => {
    livesRef.current -= 1
    const newLives = livesRef.current
    
    if (newLives <= 0) {
      setStage('gameOver')
      setGameOverMessage(message)
      setLives(0)
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      // 计算点数（每完成一个单字得1点）
      const points = scoreRef.current
      onGameEnd(points)
    } else {
      // 重置当前轮次，初始蛇为3格
      eatenCharsRef.current = []
      setEatenChars([])
      setSnake([
        { x: 15, y: 7 }, // 头部（调整到宽扁网格的中心）
        { x: 14, y: 7 },  // 身体1
        { x: 13, y: 7 },  // 身体2
      ])
      setDirection('RIGHT')
      setNextDirection('RIGHT')
      setLives(newLives)
      setStage('countdown')
      setCountdown(5)
    }
    setGameOverMessage(message)
  }

  // 键盘控制
  useEffect(() => {
    if (stage !== 'playing') return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (direction !== 'DOWN') setNextDirection('UP')
          break
        case 'ArrowDown':
          e.preventDefault()
          if (direction !== 'UP') setNextDirection('DOWN')
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (direction !== 'RIGHT') setNextDirection('LEFT')
          break
        case 'ArrowRight':
          e.preventDefault()
          if (direction !== 'LEFT') setNextDirection('RIGHT')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stage, direction])

  // 完成一轮后的倒计时
  useEffect(() => {
    if (stage === 'roundComplete') {
      const timer = setTimeout(() => {
        // 选择新单词并重新开始
        if (words.length === 0) {
          onBack()
          return
        }
        const randomWord = words[Math.floor(Math.random() * words.length)]
        setCurrentWord(randomWord)
        
        const answerText = randomWord.spelling && randomWord.spelling.trim() 
          ? randomWord.spelling.trim() 
          : randomWord.word.trim()
        
        setAnswer(answerText)
        answerRef.current = answerText
        const hintText = randomWord.spelling && randomWord.spelling.trim()
          ? randomWord.spelling.trim()
          : randomWord.word.trim()
        setHint(hintText)
        setExplanation(randomWord.explanation)
        
     // 重置游戏状态，初始蛇为3格（调整到宽扁网格的中心）
     setSnake([
       { x: 15, y: 7 }, // 头部
       { x: 14, y: 7 },  // 身体1
       { x: 13, y: 7 },  // 身体2
     ])
        setDirection('RIGHT')
        setNextDirection('RIGHT')
        setEatenChars([])
        eatenCharsRef.current = []
        setStage('countdown')
        setCountdown(5)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [stage, words, onBack])

  // 初始化
  useEffect(() => {
    initGame()
  }, [initGame])

  // 获取三角形头部裁剪路径（根据方向）
  const getTriangleClipPath = (dir: Direction): string => {
    switch (dir) {
      case 'UP':
        return 'polygon(50% 0%, 0% 100%, 100% 100%)'
      case 'DOWN':
        return 'polygon(0% 0%, 100% 0%, 50% 100%)'
      case 'LEFT':
        return 'polygon(100% 0%, 100% 100%, 0% 50%)'
      case 'RIGHT':
        return 'polygon(0% 0%, 100% 50%, 0% 100%)'
      default:
        return 'none'
    }
  }

  // 渲染游戏画面
  const renderGame = () => {
    const grid: (Position & { type: 'snake' | 'food' | 'empty', food?: Food })[] = []

    // 初始化网格（宽扁形）
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid.push({ x, y, type: 'empty' })
      }
    }

    // 标记蛇身
    snake.forEach((segment, index) => {
      const cell = grid.find(c => c.x === segment.x && c.y === segment.y)
      if (cell) {
        cell.type = 'snake'
      }
    })

    // 标记食物
    foods.forEach(food => {
      const cell = grid.find(c => c.x === food.position.x && c.y === food.position.y)
      if (cell && cell.type === 'empty') {
        cell.type = 'food'
        cell.food = food
      }
    })

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, ${CELL_SIZE}px)`,
          gap: 0.5,
          justifyContent: 'center',
        }}
      >
        {grid.map((cell, index) => {
          let bgColor = '#f5f5f5'
          let content = ''
          let color = '#000'

          if (cell.type === 'snake') {
            // 找到这个格子在蛇中的位置
            const snakeIndex = snake.findIndex(
              seg => seg.x === cell.x && seg.y === cell.y
            )
            if (snakeIndex === 0) {
              // 头部：深绿色三角形
              bgColor = '#1b5e20'
            } else if (snakeIndex === 1) {
              // 身体1：绿色正方形
              bgColor = '#4caf50'
            } else {
              // 身体其他部分：浅绿色正方形
              bgColor = '#81c784'
            }
          } else if (cell.type === 'food' && cell.food) {
            // 所有食物都用橘黄色
            bgColor = '#ff9800'
            content = cell.food.char
            color = '#fff'
          }

          const isHead = cell.type === 'snake' && snake[0].x === cell.x && snake[0].y === cell.y
          const isBody = cell.type === 'snake' && !isHead
          
          return (
            <Box
              key={`${cell.x}-${cell.y}`}
              sx={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                bgcolor: bgColor,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: '1px solid #ddd',
                borderRadius: isHead ? 0 : 0.5,
                clipPath: isHead ? getTriangleClipPath(direction) : 'none',
              }}
            >
              {content}
            </Box>
          )
        })}
      </Box>
    )
  }

  if (stage === 'countdown') {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                提示
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {explanation}
              </Typography>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                提示: {hint}
              </Typography>
              <Typography variant="body1">
                請記住這個單字的拼法，準備開始遊戲！
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h1" color="primary">
              {countdown}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              遊戲即將開始...
            </Typography>
          </Box>
        </Paper>
      </Box>
    )
  }

  if (stage === 'roundComplete') {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h5">完成一輪！</Typography>
            <Typography variant="body1">得分: {score}</Typography>
          </Alert>
          <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                下一題提示
              </Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {explanation}
              </Typography>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                提示: {hint}
              </Typography>
            </CardContent>
          </Card>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              5秒後開始下一輪...
            </Typography>
          </Box>
        </Paper>
      </Box>
    )
  }

  if (stage === 'gameOver') {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h5">遊戲結束</Typography>
            <Typography variant="body1">{gameOverMessage}</Typography>
          </Alert>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6">恭喜獲得 {score} 點</Typography>
          </Alert>
          {wrongWords.length > 0 && (
            <Card sx={{ mb: 2, bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  拼錯的單字：
                </Typography>
                {wrongWords.map((word, index) => (
                  <Typography key={index} variant="body1" sx={{ mt: 1 }}>
                    • {word}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={onBack}>
              返回
            </Button>
            <Button variant="contained" onClick={() => {
              setScore(0)
              setLives(3)
              setWrongWords([])
              wrongWordsRef.current = []
              initGame()
            }}>
              再玩一次
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">得分: {score}</Typography>
          <Typography variant="h6">生命: {lives}</Typography>
        </Box>

        <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Typography variant="body1">
              {explanation}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
              提示: {hint}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              已拼: {eatenChars.join('')} / {answer}
            </Typography>
          </CardContent>
        </Card>

        {renderGame()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            使用方向鍵控制蛇的移動
          </Typography>
          <Typography variant="body2" color="text.secondary">
            橙色 = 字符（包含正確和混淆字符）
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={onBack}>
            返回
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

