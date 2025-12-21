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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LocationOnIcon from "@mui/icons-material/LocationOn";

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

  // 統一的 Google Maps 連結生成函數
  // 目標：精準開啟「店家資訊頁面」而非僅顯示「地址座標」
  // 策略：優先使用 Google Places API (New) 獲取精準的店家連結，失敗時回退到搜尋格式
  // 注意：當用戶更改地址後，為了確保跳轉到正確的新地址，我們優先使用備案搜尋格式
  const openGoogleMaps = async (storeName: string | null | undefined, address: string | null | undefined) => {
    // 步驟1：清理參數（去除前後空格，過濾空字串、null 和 undefined）
    const cleanStoreName = storeName?.trim() || null;
    const cleanAddress = address?.trim() || null;
    
    let textQuery = "";
    
    // 步驟2：構建搜尋字串（優先使用店名+地址組合）
    // 格式範例：五九麵館 100臺北市中正區羅斯福路三段286巷4弄12號
    // 注意：店名和地址中間必須有一個空格
    if (cleanStoreName && cleanAddress) {
      // 最優：同時包含店名和地址，能精準找到店家頁面
      textQuery = `${cleanStoreName} ${cleanAddress}`;
    } else if (cleanStoreName) {
      // 次優：只有店名（可能包含分店名，如「五九麵館 公館店」）
      textQuery = cleanStoreName;
    } else if (cleanAddress) {
      // 最後：只有地址（只能顯示座標位置）
      textQuery = cleanAddress;
    } else {
      // 如果都沒有有效值，不執行跳轉
      console.warn("Google Maps: storeName and address are both empty, cannot open map");
      return;
    }
    
    // 步驟3：優先使用 Google Places API (New) 獲取精準的店家連結
    // 注意：如果用戶更改了地址但還沒儲存，API 可能返回舊地址的店家連結
    // 為了確保準確性，我們只在有地址的情況下嘗試使用 API，但最終還是使用備案邏輯
    // 這樣可以確保跳轉到用戶當前輸入的地址，而不是舊地址
    try {
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 如果 API 有回傳 googleMapsUri，且搜尋字串包含地址，可以使用
        // 但為了確保用戶看到的是最新輸入的地址，我們還是優先使用備案邏輯
        // 只有在只有店名沒有地址時，才使用 API 返回的連結
        if (data.success && data.googleMapsUri && !cleanAddress) {
          // 只有店名沒有地址時，使用 API 返回的連結
          window.open(data.googleMapsUri, '_blank', 'noopener,noreferrer');
          return;
        }
        // 如果有地址，使用備案邏輯確保跳轉到正確的位置
      }
    } catch (error) {
      // API 請求出錯，繼續執行備案邏輯
      console.error("Google Places API 請求錯誤:", error);
    }
    
    // 步驟4：備案邏輯 - 使用 Google Maps 官方的 Search API 標準格式
    // 這個方法會直接使用用戶輸入的地址進行搜尋，確保跳轉到正確的位置
    // 使用 encodeURIComponent 處理 query 字串
    const encodedQuery = encodeURIComponent(textQuery);
    // api=1 是固定參數，不需要使用 API 金鑰，用於觸發地點搜尋
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    
    // 步驟5：在新視窗開啟，並設置安全屬性
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
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
            {defaultFormData.location && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => {
                    openGoogleMaps(defaultFormData.name, defaultFormData.location);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  在 Google Maps 中查看
                </Button>
              </Box>
            )}
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
                    <TableCell>
                      {store.location ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2">{store.location}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              openGoogleMaps(store.name, store.location);
                            }}
                            sx={{ p: 0.5 }}
                            title="在 Google Maps 中查看"
                          >
                            <LocationOnIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>
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
            {storeFormData.location && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => {
                    openGoogleMaps(storeFormData.name, storeFormData.location);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  在 Google Maps 中查看
                </Button>
              </Box>
            )}
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
