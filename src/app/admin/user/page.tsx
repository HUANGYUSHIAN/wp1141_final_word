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
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

interface User {
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  birthday: string | null;
  language: string | null;
  isLock: boolean;
  dataType: string | null;
  llmQuota?: string | null;
  createdAt: string;
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    birthday: "",
    language: "",
    dataType: "",
    isLock: false,
    image: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    dataType: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=${rowsPerPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else {
        setError("載入用戶資料失敗");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("載入用戶資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      birthday: user.birthday ? user.birthday.split("T")[0] : "",
      language: user.language || "",
      dataType: user.dataType || "",
      isLock: user.isLock || false,
      image: "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("確定要刪除此用戶嗎？")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchUsers();
      } else {
        setError("刪除用戶失敗");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("刪除用戶失敗");
    }
  };

  const handleToggleLock = async (userId: string, currentLockStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLock: !currentLockStatus }),
      });
      if (response.ok) {
        fetchUsers();
      } else {
        setError("更新鎖定狀態失敗");
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
      setError("更新鎖定狀態失敗");
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setOpenDialog(false);
        fetchUsers();
      } else {
        setError("更新用戶失敗");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setError("更新用戶失敗");
    }
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      birthday: "",
      language: "",
      dataType: "",
      isLock: false,
      image: "",
    });
    setFormErrors({ name: "", email: "", dataType: "" });
    setError("");
    setOpenDialog(true);
  };

  const handleAddSave = async () => {
    // 重置錯誤訊息
    setFormErrors({ name: "", email: "", dataType: "" });
    setError("");

    // 驗證必填欄位
    const errors = {
      name: "",
      email: "",
      dataType: "",
    };

    if (!formData.name || !formData.name.trim()) {
      errors.name = "名稱為必填欄位";
    }
    if (!formData.email || !formData.email.trim()) {
      errors.email = "Email為必填欄位";
    }
    if (!formData.dataType || !["Student", "Admin", "Supplier"].includes(formData.dataType)) {
      errors.dataType = "角色為必填欄位，且必須為 Student、Admin 或 Supplier";
    }

    // 如果有錯誤，顯示錯誤訊息
    if (errors.name || errors.email || errors.dataType) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          dataType: formData.dataType,
        }),
      });
      
      if (response.ok) {
        setOpenDialog(false);
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          birthday: "",
          language: "",
          dataType: "",
          isLock: false,
          image: "",
        });
        setFormErrors({ name: "", email: "", dataType: "" });
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "新增用戶失敗");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError("新增用戶失敗");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">用戶管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增用戶
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>身分</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell>LLM 使用額度</TableCell>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  沒有資料
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>{user.userId}</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.dataType || "未選擇"}
                      color={
                        user.dataType === "Admin"
                          ? "error"
                          : user.dataType === "Student"
                          ? "primary"
                          : user.dataType === "Supplier"
                          ? "secondary"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isLock ? "已鎖定" : "正常"}
                      color={user.isLock ? "error" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        if (!user.llmQuota) return "$0.000";
                        const quota = JSON.parse(user.llmQuota);
                        const today = new Date().toISOString().split("T")[0];
                        const todayRecord = quota.find((r: any) => r.date === today);
                        const todayCost = todayRecord ? todayRecord.cost : 0;
                        const totalCost = quota.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);
                        return `今日: $${todayCost.toFixed(4)} / 總計: $${totalCost.toFixed(4)}`;
                      } catch {
                        return "$0.000";
                      }
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleView(user)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleLock(user.userId, user.isLock)}
                      color={user.isLock ? "success" : "warning"}
                    >
                      {user.isLock ? <LockOpenIcon /> : <LockIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(user.userId)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
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

      {/* 查看對話框 */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>查看用戶</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography><strong>User ID:</strong> {selectedUser.userId}</Typography>
              <Typography><strong>名稱:</strong> {selectedUser.name || "-"}</Typography>
              <Typography><strong>Email:</strong> {selectedUser.email || "-"}</Typography>
              <Typography><strong>生日:</strong> {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString() : "-"}</Typography>
              <Typography><strong>語言:</strong> {selectedUser.language || "-"}</Typography>
              <Typography><strong>身分:</strong> {selectedUser.dataType || "未選擇"}</Typography>
              <Typography><strong>狀態:</strong> {selectedUser.isLock ? "已鎖定" : "正常"}</Typography>
              <Typography><strong>建立時間:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>LLM API 使用額度（美金）:</strong></Typography>
                {(() => {
                  try {
                    if (!selectedUser.llmQuota) {
                      return <Typography variant="body2" color="text.secondary">無使用記錄</Typography>;
                    }
                    const quota = JSON.parse(selectedUser.llmQuota);
                    const today = new Date().toISOString().split("T")[0];
                    const todayRecord = quota.find((r: any) => r.date === today);
                    const todayCost = todayRecord ? todayRecord.cost : 0;
                    const totalCost = quota.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);
                    return (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">今日使用: ${todayCost.toFixed(4)}</Typography>
                        <Typography variant="body2">總計使用: ${totalCost.toFixed(4)}</Typography>
                        {quota.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            記錄期間: {quota[0].date} ~ {quota[quota.length - 1].date}
                          </Typography>
                        )}
                      </Box>
                    );
                  } catch {
                    return <Typography variant="body2" color="error">解析失敗</Typography>;
                  }
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 編輯/新增對話框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? "編輯用戶" : "新增用戶"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {selectedUser ? (
              // 編輯模式：顯示所有欄位
              <>
                <TextField
                  label="名稱"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="生日"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="語言"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>身分</InputLabel>
                  <Select
                    value={formData.dataType}
                    label="身分"
                    onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                  >
                    <MenuItem value="">未選擇</MenuItem>
                    <MenuItem value="Student">Student</MenuItem>
                    <MenuItem value="Supplier">Supplier</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isLock}
                      onChange={(e) => setFormData({ ...formData, isLock: e.target.checked })}
                    />
                  }
                  label="鎖定帳號"
                />
              </>
            ) : (
              // 新增模式：只顯示三個必填欄位
              <>
                <TextField
                  label="名稱"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                  fullWidth
                />
                <FormControl fullWidth required error={!!formErrors.dataType}>
                  <InputLabel>角色</InputLabel>
                  <Select
                    value={formData.dataType}
                    label="角色"
                    onChange={(e) => {
                      setFormData({ ...formData, dataType: e.target.value });
                      setFormErrors({ ...formErrors, dataType: "" });
                    }}
                  >
                    <MenuItem value="Student">Student</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Supplier">Supplier</MenuItem>
                  </Select>
                  {formErrors.dataType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {formErrors.dataType}
                    </Typography>
                  )}
                </FormControl>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFormErrors({ ...formErrors, email: "" });
                  }}
                  error={!!formErrors.email}
                  helperText={formErrors.email || "無須經過驗證"}
                  required
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setFormErrors({ name: "", email: "", dataType: "" });
          }}>取消</Button>
          <Button
            onClick={selectedUser ? handleSave : handleAddSave}
            variant="contained"
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



