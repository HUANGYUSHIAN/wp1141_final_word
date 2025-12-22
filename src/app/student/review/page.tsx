'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  CircularProgress,
  Grid,
  TextField,
  Button,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import ReviewCard from '@/components/ReviewCard'
import LanguageSelect, { LANGUAGE_OPTIONS } from '@/components/LanguageSelect'

interface Vocabulary {
  vocabularyId: string
  name: string
  langUse: string
  langExp: string
  wordCount: number
  establisher: string
  createdAt: string
}

interface Word {
  id?: string
  word: string
  spelling?: string | null
  explanation: string
  partOfSpeech?: string | null
  sentence?: string | null
}

export default function ReviewPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [filteredVocabularies, setFilteredVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabId, setSelectedVocabId] = useState('')
  const [selectedVocab, setSelectedVocab] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browsePage, setBrowsePage] = useState(0)
  const [browseTotal, setBrowseTotal] = useState(0)
  const [browseFilters, setBrowseFilters] = useState({
    name: '',
    langUse: [] as string[],
    langExp: [] as string[],
  })

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    fetchBrowseVocabularies(0)
    setLoading(false)
  }, [router, session])

  const fetchBrowseVocabularies = async (pageNum: number = 0) => {
    try {
      setBrowseLoading(true)
      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '10')
      
      // 只有在有設定 filter 時才加入參數
      if (browseFilters.name) {
        params.append('name', browseFilters.name)
      }
      if (browseFilters.langUse.length > 0) {
        browseFilters.langUse.forEach((lang) => {
          params.append('langUse', lang)
        })
      }
      if (browseFilters.langExp.length > 0) {
        browseFilters.langExp.forEach((lang) => {
          params.append('langExp', lang)
        })
      }

      // 使用 /api/student/vocabularies 來獲取 Student.LvocabuIDs 的單字本
      const response = await fetch(`/api/student/vocabularies?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setVocabularies(data.vocabularies || [])
        setBrowseTotal(data.total || 0)
        setBrowsePage(pageNum)
      }
    } catch (error) {
      console.error('Error browsing vocabularies:', error)
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleBrowseSearch = () => {
    fetchBrowseVocabularies(0)
  }

  const handleVocabChange = async (vocabId: string) => {
    setSelectedVocabId(vocabId)
    try {
      const response = await fetch(`/api/student/vocabularies/${vocabId}`)
      if (response.ok) {
        const data = await response.json()
        const vocab = data.vocabulary
        
        // 獲取所有單字
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (selectedVocab && selectedVocab.words && selectedVocab.words.length > 0) {
    return (
      <Box>
        <Button variant="outlined" onClick={() => {
          setSelectedVocab(null)
          setSelectedVocabId('')
        }} sx={{ mb: 2 }}>
          返回單字本選擇
        </Button>
        <ReviewCard vocabulary={selectedVocab} />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        單字複習
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        選擇單字本開始複習
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="名稱"
              value={browseFilters.name}
              onChange={(e) =>
                setBrowseFilters({ ...browseFilters, name: e.target.value })
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LanguageSelect
              value={browseFilters.langUse}
              onChange={(value) =>
                setBrowseFilters({ ...browseFilters, langUse: value as string[] })
              }
              label="背誦語言"
              multiple
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LanguageSelect
              value={browseFilters.langExp}
              onChange={(value) =>
                setBrowseFilters({ ...browseFilters, langExp: value as string[] })
              }
              label="解釋語言"
              multiple
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleBrowseSearch}
        >
          搜尋
        </Button>
      </Paper>

      {browseLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>名稱</TableCell>
                  <TableCell>背誦語言</TableCell>
                  <TableCell>解釋語言</TableCell>
                  <TableCell>單字數</TableCell>
                  <TableCell>建立者</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vocabularies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      沒有找到符合條件的單字本
                    </TableCell>
                  </TableRow>
                ) : (
                  vocabularies.map((vocabulary) => (
                    <TableRow key={vocabulary.vocabularyId}>
                      <TableCell>{vocabulary.name}</TableCell>
                      <TableCell>
                        {LANGUAGE_OPTIONS.find((opt) => opt.value === vocabulary.langUse)?.label || vocabulary.langUse}
                      </TableCell>
                      <TableCell>
                        {LANGUAGE_OPTIONS.find((opt) => opt.value === vocabulary.langExp)?.label || vocabulary.langExp}
                      </TableCell>
                      <TableCell>{vocabulary.wordCount}</TableCell>
                      <TableCell>{vocabulary.establisher}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleVocabChange(vocabulary.vocabularyId)}
                          color="primary"
                          title="開始複習"
                        >
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={browseTotal}
            page={browsePage}
            onPageChange={(e, newPage) => fetchBrowseVocabularies(newPage)}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
          />
        </>
      )}
    </Box>
  )
}
