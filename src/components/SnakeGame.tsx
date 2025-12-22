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
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import { examiner, Question, QuestionType } from '@/lib/utils/examiner'

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

type ItemType = 'lightbulb' | 'optionA' | 'optionB' | 'optionC' | 'optionD'

interface GameItem {
  position: Position
  type: ItemType
  optionIndex?: number // 对于选项，记录是第几个选项（0-3对应A-D）
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameStage = 'countdown' | 'playing' | 'paused' | 'gameOver'

interface SnakeGameProps {
  words: Word[]
  langUse: string
  onGameEnd: (score: number, totalPoints?: number, errors?: any) => void
  onBack: () => void
}

const CELL_SIZE = 25
const GAME_SPEED = 250 // 毫秒

export default function SnakeGame({ words, langUse, onGameEnd, onBack }: SnakeGameProps) {
  const [gridWidth, setGridWidth] = useState(30)
  const [gridHeight, setGridHeight] = useState(15)
  const [pointsPerRound, setPointsPerRound] = useState(10)

  // 获取游戏参数
  useEffect(() => {
    const fetchGameParams = async () => {
      try {
        const response = await fetch("/api/student/game/params");
        if (response.ok) {
          const data = await response.json();
          if (data.snake) {
            setGridWidth(data.snake.gridWidth || 30);
            setGridHeight(data.snake.gridHeight || 15);
            setPointsPerRound(data.snake.pointsPerRound || 10);
          }
        }
      } catch (error) {
        console.error("获取游戏参数失败:", error);
      }
    };
    fetchGameParams();
  }, [])

  const [stage, setStage] = useState<GameStage>('countdown')
  const [countdown, setCountdown] = useState(5)
  
  // 贪食蛇状态
  const getInitialSnake = useCallback(() => {
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    return [
      { x: centerX, y: centerY }, // 头部（三角形）
      { x: centerX - 1, y: centerY }, // 身体1（方形）
      { x: centerX - 2, y: centerY }, // 身体2（方形）
    ];
  }, [gridWidth, gridHeight])

  const [snake, setSnake] = useState<Position[]>(getInitialSnake())
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT')
  
  // 游戏物品（电灯icon + 4个选项）
  const [items, setItems] = useState<GameItem[]>([])
  
  // 题目相关
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [lightbulbEaten, setLightbulbEaten] = useState(false) // 是否已吃电灯icon
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [questionDialogTimer, setQuestionDialogTimer] = useState<NodeJS.Timeout | null>(null)
  const [questionDialogCountdown, setQuestionDialogCountdown] = useState(5) // 题目弹窗倒数
  
  // 游戏状态
  const [score, setScore] = useState(0)
  const [gameOverMessage, setGameOverMessage] = useState<string>('')
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const isPausedRef = useRef(false)

  // 计算可用空格数（非边界、非蛇身）
  const getAvailableSpaces = useCallback((currentSnake: Position[]): number => {
    let count = 0
    for (let y = 1; y < gridHeight - 1; y++) {
      for (let x = 1; x < gridWidth - 1; x++) {
        // 检查是否在蛇身上
        if (!currentSnake.some(seg => seg.x === x && seg.y === y)) {
          count++
        }
      }
    }
    return count
  }, [gridWidth, gridHeight])

  // 生成随机位置（不与蛇身重叠，不在边界）
  const generateRandomPosition = useCallback((excludePositions: Position[]): Position | null => {
    let attempts = 0
    const maxAttempts = 1000
    while (attempts < maxAttempts) {
      const position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }
      // 检查是否在边界（边界是 x=0, x=gridWidth-1, y=0, y=gridHeight-1）
      if (position.x > 0 && position.x < gridWidth - 1 && 
          position.y > 0 && position.y < gridHeight - 1 &&
          !excludePositions.some(pos => pos.x === position.x && pos.y === position.y)) {
        return position
      }
      attempts++
    }
    return null
  }, [gridWidth, gridHeight])

  // 生成新题目和物品
  const generateNewQuestion = useCallback(() => {
    if (words.length === 0) {
      alert('單字本中沒有單字')
      onBack()
      return
    }

    // 随机选择一个单词
    const randomWord = words[Math.floor(Math.random() * words.length)]
    
    // 随机选择题目类型：0（看句子選意思）、1（看意思選句子）、2（看句子選單字）
    const questionType = Math.floor(Math.random() * 3) as QuestionType
    
    // 使用 examiner 生成题目（传入整个单词列表，以便生成选项）
    const question = examiner(words, questionType)
    if (!question) {
      // 如果生成失败，尝试其他单词
      generateNewQuestion()
      return
    }
    
    setCurrentQuestion(question)
    setLightbulbEaten(false)
    
    // 生成5个位置：1个电灯icon + 4个选项（A/B/C/D）
    const excludePositions: Position[] = [...snake]
    const newItems: GameItem[] = []
    
    // 生成电灯icon位置
    const lightbulbPos = generateRandomPosition(excludePositions)
    if (lightbulbPos) {
      excludePositions.push(lightbulbPos)
      newItems.push({
        position: lightbulbPos,
        type: 'lightbulb',
      })
    }
    
    // 生成4个选项位置（A/B/C/D）
    const optionTypes: ItemType[] = ['optionA', 'optionB', 'optionC', 'optionD']
    for (let i = 0; i < 4; i++) {
      const optionPos = generateRandomPosition(excludePositions)
      if (optionPos) {
        excludePositions.push(optionPos)
        newItems.push({
          position: optionPos,
          type: optionTypes[i],
          optionIndex: i,
        })
      }
    }
    
    setItems(newItems)
  }, [words, snake, generateRandomPosition, onBack])

  // 初始化游戏
  const initGame = useCallback(() => {
    if (words.length === 0) {
      alert('單字本中沒有單字')
      onBack()
      return
    }

    const initialSnake = getInitialSnake()
    setSnake(initialSnake)
    setDirection('RIGHT')
    setNextDirection('RIGHT')
    setScore(0)
    setLightbulbEaten(false)
    setShowQuestionDialog(false)
    setCurrentQuestion(null)
    setItems([])
    isPausedRef.current = false
    
    if (questionDialogTimer) {
      clearInterval(questionDialogTimer)
      setQuestionDialogTimer(null)
    }
    
    setStage('countdown')
    setCountdown(5)
  }, [words, onBack, getInitialSnake])

  // 初始倒计时
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => {
        if (countdownRef.current) clearTimeout(countdownRef.current)
      }
    } else if (stage === 'countdown' && countdown === 0) {
      generateNewQuestion()
      setStage('playing')
    }
  }, [stage, countdown, generateNewQuestion])

  // 处理吃电灯icon
  const handleEatLightbulb = useCallback(() => {
    if (lightbulbEaten || !currentQuestion) return
    
    setLightbulbEaten(true)
    isPausedRef.current = true
    setShowQuestionDialog(true)
    setQuestionDialogCountdown(5)
    
    // 移除电灯icon
    setItems(prev => prev.filter(item => item.type !== 'lightbulb'))
    
    // 动态倒数5, 4, 3, 2, 1
    let countdown = 5
    const countdownInterval = setInterval(() => {
      countdown--
      setQuestionDialogCountdown(countdown)
      
      if (countdown <= 0) {
        clearInterval(countdownInterval)
        setShowQuestionDialog(false)
        setQuestionDialogTimer(null)
        // 立即恢复游戏，让贪食蛇继续移动
        isPausedRef.current = false
      }
    }, 1000)
    
    setQuestionDialogTimer(countdownInterval as any)
  }, [lightbulbEaten, currentQuestion])

  // 处理吃选项
  const handleEatOption = useCallback((optionIndex: number) => {
    if (!currentQuestion) return
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer
    
    if (isCorrect) {
      // 答对了
      setScore(prev => prev + pointsPerRound)
      
      // 身体长度+1（在尾部添加一个方形）
      setSnake(prevSnake => {
        const newSnake = [...prevSnake]
        const tail = newSnake[newSnake.length - 1]
        newSnake.push({ ...tail })
        
        // 移除所有物品
        setItems([])
        
        // 检查可用空格数（非边界、非蛇身）
        const availableSpaces = getAvailableSpaces(newSnake)
        
        // 如果可用空格数小于10，游戏结束
        if (availableSpaces < 10) {
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current)
            gameLoopRef.current = null
          }
          setStage('gameOver')
          setGameOverMessage('空間不足！遊戲結束')
          setScore(currentScore => {
            fetch('/api/student/game')
              .then(res => res.json())
              .then(data => {
                setTotalPoints(data.points || 0)
                onGameEnd(currentScore, data.points || 0, null)
              })
              .catch(() => {
                onGameEnd(currentScore, undefined, null)
              })
            return currentScore
          })
          return newSnake
        }
        
        // 生成下一题（使用更新后的snake状态）
        setTimeout(() => {
          const excludePositions: Position[] = [...newSnake]
          const newItems: GameItem[] = []
          
          // 随机选择题目类型：0（看句子選意思）、1（看意思選句子）、2（看句子選單字）
          const questionType = Math.floor(Math.random() * 3) as QuestionType
          // 使用整个单词列表生成题目（与 /student/test 一致）
          const question = examiner(words, questionType)
          
          if (question) {
            setCurrentQuestion(question)
            setLightbulbEaten(false)
            
            // 生成电灯icon位置
            let lightbulbPos: Position | null = null
            let attempts = 0
            while (!lightbulbPos && attempts < 1000) {
              const pos = generateRandomPosition(excludePositions)
              if (pos) {
                lightbulbPos = pos
                excludePositions.push(pos)
                newItems.push({
                  position: pos,
                  type: 'lightbulb',
                })
              }
              attempts++
            }
            
            // 生成4个选项位置
            const optionTypes: ItemType[] = ['optionA', 'optionB', 'optionC', 'optionD']
            for (let i = 0; i < 4; i++) {
              let optionPos: Position | null = null
              attempts = 0
              while (!optionPos && attempts < 1000) {
                const pos = generateRandomPosition(excludePositions)
                if (pos) {
                  optionPos = pos
                  excludePositions.push(pos)
                  newItems.push({
                    position: pos,
                    type: optionTypes[i],
                    optionIndex: i,
                  })
                }
                attempts++
              }
            }
            
            setItems(newItems)
          }
        }, 500)
        
        return newSnake
      })
        } else {
      // 答错了，游戏结束
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      setStage('gameOver')
      setGameOverMessage('答錯了！遊戲結束')
      setScore(currentScore => {
        // 获取总点数
        fetch('/api/student/game')
          .then(res => res.json())
          .then(data => {
            setTotalPoints(data.points || 0)
            // 传递错误信息
            onGameEnd(currentScore, data.points || 0, {
              question: currentQuestion,
              userAnswer: optionIndex,
              correctAnswer: currentQuestion.correctAnswer,
            })
          })
          .catch(() => {
            onGameEnd(currentScore, undefined, {
              question: currentQuestion,
              userAnswer: optionIndex,
              correctAnswer: currentQuestion.correctAnswer,
            })
          })
        return currentScore
      })
    }
  }, [currentQuestion, pointsPerRound, words, generateRandomPosition, onGameEnd, getAvailableSpaces])

  // 游戏循环
  useEffect(() => {
    if (stage !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    // 如果暂停，不启动游戏循环（但保持监听，等待恢复）
    if (isPausedRef.current) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      // 不返回，继续监听 showQuestionDialog 的变化，等待恢复
      return
    }

    // 只有在不暂停时才启动游戏循环
    if (gameLoopRef.current) {
      // 如果已经存在循环，先清除
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }

    gameLoopRef.current = setInterval(() => {
      // 在每次循环中检查是否暂停
      if (isPausedRef.current) {
        return
      }
      
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
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current)
            gameLoopRef.current = null
          }
          setStage('gameOver')
          setGameOverMessage('撞牆了！')
          onGameEnd(score, undefined, null)
          return prevSnake
        }

        // 检查撞到自己
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current)
            gameLoopRef.current = null
          }
          setStage('gameOver')
          setGameOverMessage('撞到自己了！')
          // 获取总点数
          fetch('/api/student/game')
            .then(res => res.json())
            .then(data => {
              setTotalPoints(data.points || 0)
              onGameEnd(score, data.points || 0, null)
            })
            .catch(() => {
              onGameEnd(score, undefined, null)
            })
          return prevSnake
        }

        // 检查是否吃到物品
        const currentItems = items
        const itemIndex = currentItems.findIndex(
          item => item.position.x === head.x && item.position.y === head.y
        )

        if (itemIndex !== -1) {
          const item = currentItems[itemIndex]
          
          if (item.type === 'lightbulb') {
            // 吃到电灯icon
            handleEatLightbulb()
          } else if (item.type.startsWith('option')) {
            // 吃到选项
            const optionIndex = item.optionIndex ?? 0
            handleEatOption(optionIndex)
          }
          
          // 移除被吃的物品
          const newItems = currentItems.filter((_, i) => i !== itemIndex)
          setItems(newItems)
        }

        // 移动蛇
        newSnake.unshift(head)
        newSnake.pop()
        return newSnake
      })
      
      setDirection(nextDirection)
    }, GAME_SPEED)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [stage, nextDirection, items, gridWidth, gridHeight, score, handleEatLightbulb, handleEatOption, onGameEnd, showQuestionDialog])

  // 键盘控制
  useEffect(() => {
    if (stage !== 'playing' || isPausedRef.current) return

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

  // 获取选项的颜色和形状
  const getOptionStyle = (type: ItemType) => {
    switch (type) {
      case 'optionA':
        return { bgColor: '#f44336', shape: 'square' } // 红色方形
      case 'optionB':
        return { bgColor: '#4caf50', shape: 'circle' } // 绿色圆形
      case 'optionC':
        return { bgColor: '#2196f3', shape: 'triangle' } // 蓝色三角形
      case 'optionD':
        return { bgColor: '#9c27b0', shape: 'star' } // 紫色星形
      default:
        return { bgColor: '#ff9800', shape: 'square' }
    }
  }

  // 渲染游戏画面
  const renderGame = () => {
    const grid: (Position & { type: 'snake' | 'item' | 'empty', item?: GameItem, snakeIndex?: number })[] = []

    // 初始化网格
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        grid.push({ x, y, type: 'empty' })
      }
    }

    // 标记蛇身
    snake.forEach((segment, index) => {
      const cell = grid.find(c => c.x === segment.x && c.y === segment.y)
      if (cell) {
        cell.type = 'snake'
        cell.snakeIndex = index
      }
    })

    // 标记物品
    items.forEach(item => {
      const cell = grid.find(c => c.x === item.position.x && c.y === item.position.y)
      if (cell && cell.type === 'empty') {
        cell.type = 'item'
        cell.item = item
      }
    })

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridWidth}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${CELL_SIZE}px)`,
          gap: 0.5,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {grid.map((cell, index) => {
          let bgColor = '#f5f5f5'
          let content: React.ReactNode = ''
          let color = '#000'
          let borderRadius: number | string = 0.5
          let clipPath = 'none'

          if (cell.type === 'snake') {
            const snakeIndex = cell.snakeIndex ?? 0
            if (snakeIndex === 0) {
              // 头部：深绿色三角形
              bgColor = '#1b5e20'
              clipPath = getTriangleClipPath(direction)
              borderRadius = 0
            } else if (snakeIndex === 1) {
              // 身体1：中绿色方形
              bgColor = '#4caf50'
            } else {
              // 身体其他部分：浅绿色方形
              bgColor = '#81c784'
            }
          } else if (cell.type === 'item' && cell.item) {
            const item = cell.item
            if (item.type === 'lightbulb') {
              // 电灯icon
              bgColor = '#ffeb3b'
              content = <LightbulbIcon sx={{ fontSize: CELL_SIZE * 0.8, color: '#f57f17' }} />
            } else {
              // 选项
              const style = getOptionStyle(item.type)
              bgColor = style.bgColor
              const label = item.type === 'optionA' ? 'A' : item.type === 'optionB' ? 'B' : item.type === 'optionC' ? 'C' : 'D'
              content = label
              color = '#fff'
              
              if (style.shape === 'circle') {
                borderRadius = '50%'
              } else if (style.shape === 'triangle') {
                clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'
                borderRadius = 0
              } else if (style.shape === 'star') {
                // 星形用特殊字符或SVG
                content = '★'
              }
            }
          }

          const isHead = cell.type === 'snake' && cell.snakeIndex === 0
          
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
                borderRadius: borderRadius === '50%' ? '50%' : borderRadius,
                clipPath: clipPath !== 'none' ? clipPath : undefined,
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
                  <li>使用方向鍵控制貪食蛇移動</li>
                  <li>吃到黃色電燈圖標可以查看題目（暫停5秒）</li>
                  <li>吃到選項圖標來回答問題：
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li>A = 紅色方形</li>
                      <li>B = 綠色圓形</li>
                      <li>C = 藍色三角形</li>
                      <li>D = 紫色星形</li>
                    </Box>
                  </li>
                  <li>答對獲得點數，身體長度+1，生成下一題</li>
                  <li>答錯遊戲結束</li>
                  <li>可以不看題目直接猜答案</li>
                  <li>撞牆或撞到自己會遊戲結束</li>
                </Box>
              </Typography>
            </CardContent>
          </Card>
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
            {totalPoints !== null && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                目前總點數: {totalPoints} 點
              </Typography>
            )}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={onBack}>
              返回
            </Button>
            <Button variant="contained" onClick={initGame}>
              再玩一次
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  // 游戏进行中
  return (
    <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">得分: {score}</Typography>
        </Box>

        {renderGame()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            使用方向鍵控制蛇的移動
          </Typography>
          <Typography variant="body2" color="text.secondary">
            黃色電燈 = 查看題目（暫停5秒）
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A(紅方形) B(綠圓形) C(藍三角形) D(紫星形) = 選項
          </Typography>
        </Box>

      </Paper>

      {/* 题目弹窗 */}
      <Dialog 
        open={showQuestionDialog} 
        onClose={() => {}} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>題目</DialogTitle>
        <DialogContent>
          {currentQuestion && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    題目
                  </Typography>
                  {currentQuestion.questionHighlight ? (
                    <Typography variant="h5" sx={{ mt: 2 }}>
                      {currentQuestion.question.substring(0, currentQuestion.questionHighlight.startIndex)}
                      <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        {currentQuestion.questionHighlight.word}
                      </Box>
                      {currentQuestion.question.substring(currentQuestion.questionHighlight.endIndex)}
                    </Typography>
                  ) : (
                    <Typography variant="h5" sx={{ mt: 2 }}>
                      {currentQuestion.question}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ mb: 2 }}>
                {currentQuestion.options.map((option, index) => {
                  const highlights = currentQuestion.optionsHighlight?.[index] || []
                  const optionLabel = ['A', 'B', 'C', 'D'][index]
                  
                  return (
                    <Button
                      key={index}
                      fullWidth
                      variant="outlined"
                      disabled
                      sx={{ 
                        mb: 2, 
                        py: 2, 
                        textTransform: 'none',
                        borderColor: 'grey.300',
                        bgcolor: 'transparent',
                      }}
                    >
                      <Typography variant="body1">
                        {optionLabel}. {highlights.length > 0 ? (
                          <>
                            {highlights.map((highlight, hi) => {
                              const prevEnd = hi === 0 ? 0 : highlights[hi - 1].endIndex
                              return (
                                <span key={hi}>
                                  {option.substring(prevEnd, highlight.startIndex)}
                                  <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                    {highlight.word}
                                  </Box>
                                  {hi === highlights.length - 1 && option.substring(highlight.endIndex)}
                                </span>
                              )
                            })}
                          </>
                        ) : (
                          option
                        )}
                      </Typography>
                    </Button>
                  )
                })}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {questionDialogCountdown > 0 ? `${questionDialogCountdown}秒後自動關閉` : '即將關閉...'}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
