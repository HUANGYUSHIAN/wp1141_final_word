"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface Vocabulary {
  vocabularyId: string;
  name: string;
  langUse: string;
  langExp: string;
  copyrights: string | null;
  wordCount: number;
  createdAt: string;
  isOwned: boolean;
}

interface Word {
  id: string;
  word: string;
  spelling: string | null;
  explanation: string;
  partOfSpeech: string | null;
  sentence: string | null;
}

const scopeTabs = [
  { value: "owned", label: "我的單字本" },
  { value: "favorites", label: "收藏的單字本" },
];

export default function StudentVocabularyPage() {
  const [scope, setScope] = useState("owned");
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedVocabulary, setSelectedVocabulary] =
    useState<Vocabulary | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [wordsPage, setWordsPage] = useState(0);
  const [wordsPerPage, setWordsPerPage] = useState(50);
  const [wordsTotal, setWordsTotal] = useState(0);
  const [loadingWords, setLoadingWords] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    langUse: "",
    langExp: "",
    copyrights: "",
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      langUse: "",
      langExp: "",
      copyrights: "",
    });
    setCreateFile(null);
  };


  useEffect(() => {
    fetchVocabularies();
  }, [scope, page, rowsPerPage]);

  const fetchVocabularies = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/student/vocabularies?scope=${scope}&page=${page}&limit=${rowsPerPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setVocabularies(data.vocabularies || []);
        setTotal(data.total || 0);
      } else {
        setError("載入單字本資料失敗");
      }
    } catch (error) {
      console.error("Error fetching vocabularies:", error);
      setError("載入單字本資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async (vocabularyId: string, pageNum: number) => {
    try {
      setLoadingWords(true);
      const response = await fetch(
        `/api/student/vocabularies/${vocabularyId}/words?page=${pageNum}&limit=${wordsPerPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setWords(data.words || []);
        setWordsTotal(data.total || 0);
      } else {
        setCsvError("載入單字列表失敗");
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      setCsvError("載入單字列表失敗");
    } finally {
      setLoadingWords(false);
    }
  };

  const handleChangeScope = (_: any, newValue: string) => {
    setScope(newValue);
    setPage(0);
  };

  const handleView = async (vocabulary: Vocabulary) => {
    setSelectedVocabulary(vocabulary);
    setWordsPage(0);
    setOpenViewDialog(true);
    await fetchWords(vocabulary.vocabularyId, 0);
  };

  const splitCsvLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && line[i - 1] !== "\\") {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current) {
      result.push(current.trim());
    }

    return result.map((value) =>
      value.replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"')
    );
  };

  const parseCsvContent = (content: string) => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV 檔案內容不足");
    }

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const wordIdx = headers.indexOf("word");
    const spellingIdx = headers.indexOf("spelling");
    const explanationIdx = headers.indexOf("explanation");
    const sentenceIdx = headers.indexOf("sentence");

    if (wordIdx === -1 || explanationIdx === -1) {
      throw new Error("CSV 必須包含 Word 與 Explanation 欄位");
    }

    const rows = lines.slice(1).map((line) => splitCsvLine(line));

    return rows
      .filter((cols) => cols[wordIdx])
      .map((cols) => ({
        word: cols[wordIdx]?.trim(),
        spelling: spellingIdx >= 0 ? cols[spellingIdx]?.trim() || null : null,
        explanation: cols[explanationIdx]?.trim() || "",
        partOfSpeech: null,
        sentence: sentenceIdx >= 0 ? cols[sentenceIdx]?.trim() || null : null,
      }))
      .filter((item) => item.word && item.explanation);
  };

  const uploadWords = async (
    vocabularyId: string,
    wordsPayload: any[],
    afterSuccess?: () => Promise<void> | void
  ) => {
    const response = await fetch(
      `/api/student/vocabularies/${vocabularyId}/words/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: wordsPayload }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "匯入 CSV 失敗");
    }

    if (afterSuccess) {
      await afterSuccess();
    }
  };

  const handleCsvUpload = async (file: File) => {
    if (!selectedVocabulary) return;

    try {
      setCsvUploading(true);
      setCsvError("");

      const text = await file.text();
      const parsedWords = parseCsvContent(text);

      if (!parsedWords.length) {
        setCsvError("CSV 沒有可匯入的單字");
        return;
      }

      await uploadWords(selectedVocabulary.vocabularyId, parsedWords, async () => {
        await fetchWords(selectedVocabulary.vocabularyId, wordsPage);
        fetchVocabularies();
      });

      setSuccessMessage(`成功匯入 ${parsedWords.length} 筆單字`);
    } catch (error: any) {
      console.error("Error uploading CSV:", error);
      setCsvError(error.message || "匯入 CSV 失敗");
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCreateVocabulary = async () => {
    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/student/vocabularies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (response.ok) {
        const data = await response.json();

        if (createFile) {
          const text = await createFile.text();
          const parsedWords = parseCsvContent(text);

          if (parsedWords.length) {
            await uploadWords(data.vocabulary.vocabularyId, parsedWords);
          }
        }

        setSuccessMessage(
          createFile
            ? "單字本建立並匯入成功"
            : "單字本建立成功，請匯入單字"
        );
        setOpenCreateDialog(false);
        resetCreateForm();
        setScope("owned");
        fetchVocabularies();
      } else {
        const data = await response.json();
        setError(data.error || "建立單字本失敗");
      }
    } catch (error) {
      console.error("Error creating vocabulary:", error);
      setError("建立單字本失敗");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVocabulary = async (vocabulary: Vocabulary) => {
    if (!vocabulary.isOwned) return;
    if (
      !confirm(`確定要刪除單字本「${vocabulary.name}」嗎？刪除後無法復原。`)
    )
      return;

    try {
      const response = await fetch(
        `/api/student/vocabularies/${vocabulary.vocabularyId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setSuccessMessage("單字本已刪除");
        fetchVocabularies();
      } else {
        const data = await response.json();
        setError(data.error || "刪除單字本失敗");
      }
    } catch (error) {
      console.error("Error deleting vocabulary:", error);
      setError("刪除單字本失敗");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">我的單字本</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          新增單字本
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={scope}
          onChange={handleChangeScope}
          indicatorColor="primary"
          textColor="primary"
        >
          {scopeTabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名稱</TableCell>
              <TableCell>背誦語言</TableCell>
              <TableCell>解釋語言</TableCell>
              <TableCell>單字數</TableCell>
              <TableCell>建立時間</TableCell>
              <TableCell>類型</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : vocabularies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  沒有資料
                </TableCell>
              </TableRow>
            ) : (
              vocabularies.map((vocabulary) => (
                <TableRow key={vocabulary.vocabularyId}>
                  <TableCell>{vocabulary.name}</TableCell>
                  <TableCell>{vocabulary.langUse}</TableCell>
                  <TableCell>{vocabulary.langExp}</TableCell>
                  <TableCell>{vocabulary.wordCount}</TableCell>
                  <TableCell>
                    {new Date(vocabulary.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {vocabulary.isOwned ? "我建立的" : "收藏"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleView(vocabulary)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {vocabulary.isOwned && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteVocabulary(vocabulary)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          查看單字本 - {selectedVocabulary?.name}
        </DialogTitle>
        <DialogContent>
          {selectedVocabulary && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                <strong>單字本ID:</strong> {selectedVocabulary.vocabularyId}
              </Typography>
              <Typography>
                <strong>名稱:</strong> {selectedVocabulary.name}
              </Typography>
              <Typography>
                <strong>背誦語言:</strong> {selectedVocabulary.langUse}
              </Typography>
              <Typography>
                <strong>解釋語言:</strong> {selectedVocabulary.langExp}
              </Typography>
              <Typography>
                <strong>單字數:</strong> {selectedVocabulary.wordCount}
              </Typography>

              {selectedVocabulary.isOwned && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={csvUploading}
                  >
                    {csvUploading ? "匯入中..." : "匯入 CSV"}
                    <input
                      type="file"
                      hidden
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCsvUpload(file);
                          e.target.value = "";
                        }
                      }}
                    />
                  </Button>
                  {csvError && (
                    <Alert
                      severity="error"
                      sx={{ mt: 2 }}
                      onClose={() => setCsvError("")}
                    >
                      {csvError}
                    </Alert>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  單字列表
                </Typography>
                {loadingWords ? (
                  <CircularProgress />
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>單字</TableCell>
                            <TableCell>拼音</TableCell>
                            <TableCell>解釋</TableCell>
                            <TableCell>例句</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {words.map((word) => (
                            <TableRow key={word.id}>
                              <TableCell>{word.word}</TableCell>
                              <TableCell>{word.spelling || "-"}</TableCell>
                              <TableCell>{word.explanation}</TableCell>
                              <TableCell>{word.sentence || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={wordsTotal}
                      page={wordsPage}
                      onPageChange={async (e, newPage) => {
                        setWordsPage(newPage);
                        await fetchWords(selectedVocabulary.vocabularyId, newPage);
                      }}
                      rowsPerPage={wordsPerPage}
                      onRowsPerPageChange={(e) => {
                        setWordsPerPage(parseInt(e.target.value, 10));
                        setWordsPage(0);
                        if (selectedVocabulary) {
                          fetchWords(selectedVocabulary.vocabularyId, 0);
                        }
                      }}
                      rowsPerPageOptions={[50, 100, 200]}
                    />
                  </>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>新增單字本</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="名稱"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="背誦語言"
              value={createForm.langUse}
              onChange={(e) =>
                setCreateForm({ ...createForm, langUse: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="解釋語言"
              value={createForm.langExp}
              onChange={(e) =>
                setCreateForm({ ...createForm, langExp: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="版權/備註"
              value={createForm.copyrights}
              onChange={(e) =>
                setCreateForm({ ...createForm, copyrights: e.target.value })
              }
              fullWidth
            />
            <Button
              component="label"
              startIcon={<UploadFileIcon />}
              variant="outlined"
            >
              {createFile ? `已選：${createFile.name}` : "選擇 CSV (選填)"}
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCreateFile(file);
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              resetCreateForm();
              setOpenCreateDialog(false);
            }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateVocabulary}
            disabled={creating}
          >
            {creating ? "建立中..." : "建立"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

