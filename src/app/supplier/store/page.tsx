"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Store {
  id: string;
  name: string;
  location: string | null;
  businessHours: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierStorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [defaultFormData, setDefaultFormData] = useState({
    name: "",
    location: "",
    businessHours: "",
    website: "",
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    location: "",
    businessHours: "",
    website: "",
  });

  useEffect(() => {
    fetchDefaultStore();
    fetchStores();
  }, []);

  const fetchDefaultStore = async () => {
    try {
      const response = await fetch("/api/supplier/store");
      if (response.ok) {
        const data = await response.json();
        const store = data.store || {};
        setDefaultFormData({
          name: store.name || "",
          location: store.location || "",
          businessHours: store.businessHours || "",
          website: store.website || "",
        });
      }
    } catch (error) {
      console.error("Error fetching default store:", error);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/stores");
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      } else {
        setError("載入分店資料失敗");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setError("載入分店資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDefault = async () => {
    if (!defaultFormData.name.trim()) {
      setError("店名為必填");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/supplier/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultFormData),
      });

      if (response.ok) {
        setSuccess("預設店鋪資訊更新成功！");
        await fetchDefaultStore();
      } else {
        const data = await response.json();
        setError(data.error || data.details || "更新店鋪資訊失敗");
      }
    } catch (error) {
      console.error("Error saving default store:", error);
      setError("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingStore(null);
    setStoreFormData({
      name: "",
      location: "",
      businessHours: "",
      website: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (store: Store) => {
    setEditingStore(store);
    setStoreFormData({
      name: store.name,
      location: store.location || "",
      businessHours: store.businessHours || "",
      website: store.website || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
    setStoreFormData({
      name: "",
      location: "",
      businessHours: "",
      website: "",
    });
  };

  const handleSaveStore = async () => {
    if (!storeFormData.name.trim()) {
      setError("店名為必填");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let response;
      if (editingStore) {
        // 更新分店
        response = await fetch(`/api/supplier/stores/${editingStore.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storeFormData),
        });
      } else {
        // 新增分店
        response = await fetch("/api/supplier/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storeFormData),
        });
      }

      if (response.ok) {
        setSuccess(editingStore ? "分店更新成功！" : "分店新增成功！");
        handleCloseDialog();
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || (editingStore ? "更新分店失敗" : "新增分店失敗"));
      }
    } catch (error) {
      console.error("Error saving store:", error);
      setError(editingStore ? "更新失敗" : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm("確定要刪除此分店嗎？")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/supplier/stores/${storeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("分店刪除成功！");
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || "刪除分店失敗");
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      setError("刪除失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        店鋪資訊管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* 預設店鋪資訊 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          預設店鋪資訊
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          編輯您的預設店鋪資訊，當您發行優惠券時若未選擇特定分店，將使用此預設資訊
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="店名"
              value={defaultFormData.name}
              onChange={(e) => setDefaultFormData({ ...defaultFormData, name: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="地址"
              value={defaultFormData.location}
              onChange={(e) => setDefaultFormData({ ...defaultFormData, location: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="請輸入完整的店鋪地址"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="營業時間"
              value={defaultFormData.businessHours}
              onChange={(e) => setDefaultFormData({ ...defaultFormData, businessHours: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="例如：週一至週五 10:00-22:00，週六日 11:00-23:00"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="網站"
              value={defaultFormData.website}
              onChange={(e) => setDefaultFormData({ ...defaultFormData, website: e.target.value })}
              fullWidth
              placeholder="https://example.com"
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmitDefault}
            disabled={saving}
          >
            {saving ? "儲存中..." : "儲存預設店鋪資訊"}
          </Button>
        </Box>
      </Paper>

      {/* 分店列表 */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">
            分店管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            新增分店
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          管理您的分店資訊，發行優惠券時可以選擇以哪個分店的身份發行
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : stores.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            目前沒有分店，點擊「新增分店」來建立第一個分店
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>分店名稱</TableCell>
                  <TableCell>地址</TableCell>
                  <TableCell>營業時間</TableCell>
                  <TableCell>網站</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>{store.name}</TableCell>
                    <TableCell>{store.location || "-"}</TableCell>
                    <TableCell>{store.businessHours || "-"}</TableCell>
                    <TableCell>{store.website || "-"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(store)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStore(store.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 新增/編輯分店對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStore ? "編輯分店" : "新增分店"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="分店名稱"
              value={storeFormData.name}
              onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="地址"
              value={storeFormData.location}
              onChange={(e) => setStoreFormData({ ...storeFormData, location: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="請輸入完整的店鋪地址"
            />
            <TextField
              label="營業時間"
              value={storeFormData.businessHours}
              onChange={(e) => setStoreFormData({ ...storeFormData, businessHours: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="例如：週一至週五 10:00-22:00，週六日 11:00-23:00"
            />
            <TextField
              label="網站"
              value={storeFormData.website}
              onChange={(e) => setStoreFormData({ ...storeFormData, website: e.target.value })}
              fullWidth
              placeholder="https://example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveStore}
            variant="contained"
            disabled={saving}
          >
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
