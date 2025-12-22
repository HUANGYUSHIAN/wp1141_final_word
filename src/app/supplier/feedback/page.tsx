'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material'
import { useSession } from 'next-auth/react'

interface UserFeedback {
  userId: string
  userName?: string
  feedback: Record<string, any> | null
}

export default function SupplierFeedbackPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Record<string, any> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    loadUserFeedbacks()
  }, [router, session])

  const loadUserFeedbacks = async () => {
    try {
      setLoading(true)
      // 廠商可以查看所有用戶的回饋（與管理員相同）
      const response = await fetch('/api/admin/feedback/users')
      if (response.ok) {
        const data = await response.json()
        setUserFeedbacks(data.userFeedbacks || [])
      } else {
        setError('載入用戶回饋失敗')
      }
    } catch (error) {
      console.error('載入用戶回饋失敗:', error)
      setError('載入用戶回饋失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleViewFeedback = (feedback: Record<string, any> | null) => {
    setSelectedFeedback(feedback)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedFeedback(null)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        意見回饋
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>用戶ID</TableCell>
                <TableCell>用戶名稱</TableCell>
                <TableCell>回饋狀態</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      目前沒有用戶回饋
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                userFeedbacks.map((item) => (
                  <TableRow key={item.userId}>
                    <TableCell>{item.userId}</TableCell>
                    <TableCell>{item.userName || '未知'}</TableCell>
                    <TableCell>
                      {item.feedback ? (
                        <Typography color="success.main">已填寫</Typography>
                      ) : (
                        <Typography color="text.secondary">未填寫</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.feedback && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewFeedback(item.feedback)}
                        >
                          查看
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 回饋詳情對話框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>回饋詳情</DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Box sx={{ pt: 2 }}>
              {Object.entries(selectedFeedback).map(([key, value]) => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {key}
                  </Typography>
                  <Typography variant="body1">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

