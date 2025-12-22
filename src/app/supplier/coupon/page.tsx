"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePostHog } from "@/hooks/usePostHog";
import {
  Box,
  Typography,
  Paper,
  Button,
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
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface Coupon {
  couponId: string;
  name: string;
  period: string;
  link: string | null;
  text: string | null;
  picture: string | null;
  storeName: string | null;
  storeLocation: string | null;
  storeHours: string | null;
  createdAt: string;
  ownersCount?: number; // 擁有者人數（動態載入）
}

export default function SupplierCouponPage() {
  const { data: session } = useSession();
  const { captureEvent } = usePostHog();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openOwnersDialog, setOpenOwnersDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [owners, setOwners] = useState<{ userId: string; name: string; email: string }[]>([]);
  const [ownersCount, setOwnersCount] = useState(0);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    period: "",
    link: "",
    text: "",
    picture: "",
  });
  const [storeInfo, setStoreInfo] = useState({
    name: "",
    location: "",
    businessHours: "",
    website: "",
  });
  const [stores, setStores] = useState<Array<{
    id: string;
    name: string;
    location: string | null;
    businessHours: string | null;
    website: string | null;
  }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  useEffect(() => {
    fetchCoupons();
    fetchStoreInfo();
    fetchStores();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch("/api/supplier/store");
      if (response.ok) {
        const data = await response.json();
        const store = data.store || {};
        setStoreInfo({
          name: store.name || "",
          location: store.location || "",
          businessHours: store.businessHours || "",
          website: store.website || "",
        });
      }
    } catch (error) {
      console.error("Error fetching store info:", error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/supplier/stores");
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/coupons");
      if (response.ok) {
        const data = await response.json();
        const couponsList = data.coupons || [];
        
        // 為每個優惠券載入擁有者人數
        const couponsWithCounts = await Promise.all(
          couponsList.map(async (coupon: Coupon) => {
            try {
              const ownersResponse = await fetch(`/api/supplier/coupons/${coupon.couponId}/owners`);
              if (ownersResponse.ok) {
                const ownersData = await ownersResponse.json();
                return { ...coupon, ownersCount: ownersData.count || 0 };
              }
              return { ...coupon, ownersCount: 0 };
            } catch (error) {
              return { ...coupon, ownersCount: 0 };
            }
          })
        );
        
        setCoupons(couponsWithCounts);
      } else {
        setError("載入優惠券資料失敗");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("載入優惠券資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setOpenViewDialog(true);
  };

  const handleViewOwners = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setLoadingOwners(true);
    setOpenOwnersDialog(true);
    
    try {
      const response = await fetch(`/api/supplier/coupons/${coupon.couponId}/owners`);
      if (response.ok) {
        const data = await response.json();
        setOwners(data.owners || []);
        setOwnersCount(data.count || 0);
      } else {
        setError("載入擁有者資訊失敗");
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      setError("載入擁有者資訊失敗");
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    // 將 ISO 日期時間轉換為 datetime-local 格式 (YYYY-MM-DDTHH:mm)
    const dateTime = new Date(coupon.period);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setFormData({
      name: coupon.name,
      period: datetimeLocal,
      link: coupon.link || "",
      text: coupon.text || "",
      picture: coupon.picture || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("確定要刪除此優惠券嗎？")) return;

    try {
      const response = await fetch(`/api/supplier/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchCoupons();
      } else {
        setError("刪除優惠券失敗");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      setError("刪除優惠券失敗");
    }
  };

  const handleSave = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(
        `/api/supplier/coupons/${selectedCoupon.couponId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (response.ok) {
        setOpenDialog(false);
        fetchCoupons();
      } else {
        setError("更新優惠券失敗");
      }
    } catch (error) {
      console.error("Error updating coupon:", error);
      setError("更新優惠券失敗");
    }
  };


  const handleSubmit = async () => {
    if (!formData.name || !formData.period) {
      setError("名稱和使用期限為必填");
      return;
    }

    // 決定使用哪個店家的資訊
    let finalStoreName = storeInfo.name;
    let finalStoreLocation = storeInfo.location;
    let finalStoreHours = storeInfo.businessHours;
    let finalStoreWebsite = storeInfo.website || null;
    let storeId: string | null = null;

    // 如果選擇了店家，使用店家的資訊
    if (selectedStoreId) {
      const selectedStore = stores.find(s => s.id === selectedStoreId);
      if (selectedStore) {
        finalStoreName = selectedStore.name;
        finalStoreLocation = selectedStore.location || "";
        finalStoreHours = selectedStore.businessHours || "";
        finalStoreWebsite = selectedStore.website || null;
        storeId = selectedStore.id;
      }
    }

    try {
      const response = await fetch("/api/supplier/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          storeName: finalStoreName,
          storeLocation: finalStoreLocation,
          storeHours: finalStoreHours,
          storeWebsite: finalStoreWebsite,
          storeId: storeId,
        }),
      });
      if (response.ok) {
        // 追踪优惠券创建
        captureEvent("coupon_created", {
          supplier_id: session?.userId || "",
        });
        // 清空表單
        setFormData({
          name: "",
          period: "",
          link: "",
          text: "",
          picture: "",
        });
        setSelectedStoreId("");
        setError("");
        // 刷新列表
        fetchCoupons();
      } else {
        const data = await response.json();
        setError(data.error || "新增優惠券失敗");
      }
    } catch (error) {
      console.error("Error adding coupon:", error);
      setError("新增優惠券失敗");
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        優惠券管理與上傳
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* 新增優惠券表單 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          新增優惠券
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="名稱"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="到期時間"
            type="datetime-local"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            helperText="選擇優惠券的到期日期和時間"
          />
          <TextField
            label="連結"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            fullWidth
            placeholder="https://example.com"
          />
          <TextField
            label="內容"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="優惠券詳細內容說明"
          />
          <TextField
            label="圖片URL"
            value={formData.picture}
            onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
            fullWidth
            placeholder="https://example.com/image.jpg"
          />
          <FormControl fullWidth>
            <InputLabel>選擇店家（選填）</InputLabel>
            <Select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              label="選擇店家（選填）"
            >
              <MenuItem value="">
                <em>使用預設店家資訊</em>
              </MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name} {store.location ? `- ${store.location}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedStoreId && (
            <Alert severity="info">
              已選擇店家：{stores.find(s => s.id === selectedStoreId)?.name}
              {stores.find(s => s.id === selectedStoreId)?.location && 
                ` - ${stores.find(s => s.id === selectedStoreId)?.location}`
              }
            </Alert>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleSubmit}
            >
              新增優惠券
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 優惠券列表 */}
      <TableContainer component={Paper}>
        <Table>
            <TableHead>
            <TableRow>
              <TableCell>分店名稱</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>使用期限</TableCell>
              <TableCell>擁有者人數</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  沒有資料
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.couponId}>
                  <TableCell>{coupon.storeName || "預設店家"}</TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>
                    {new Date(coupon.period).toLocaleString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleViewOwners(coupon)}
                      variant="outlined"
                      color="primary"
                    >
                      {coupon.ownersCount !== undefined ? `${coupon.ownersCount} 人` : "載入中..."}
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleView(coupon)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(coupon)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(coupon.couponId)}
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
      </TableContainer>

      {/* 查看對話框 */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>查看優惠券</DialogTitle>
        <DialogContent>
          {selectedCoupon && (
            <Box sx={{ pt: 2 }}>
              {selectedCoupon.picture && (
                <Card sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={selectedCoupon.picture}
                    alt={selectedCoupon.name}
                  />
                </Card>
              )}
              <Typography><strong>優惠券ID:</strong> {selectedCoupon.couponId}</Typography>
              <Typography><strong>名稱:</strong> {selectedCoupon.name}</Typography>
              <Typography><strong>使用期限:</strong> {new Date(selectedCoupon.period).toLocaleString()}</Typography>
              {selectedCoupon.storeName && (
                <Typography><strong>店名:</strong> {selectedCoupon.storeName}</Typography>
              )}
              {selectedCoupon.storeLocation && (
                <Typography><strong>地址:</strong> {selectedCoupon.storeLocation}</Typography>
              )}
              {selectedCoupon.storeHours && (
                <Typography><strong>營業時間:</strong> {selectedCoupon.storeHours}</Typography>
              )}
              <Typography><strong>連結:</strong> {selectedCoupon.link || "-"}</Typography>
              <Typography><strong>內容:</strong> {selectedCoupon.text || "-"}</Typography>
              <Typography><strong>建立時間:</strong> {new Date(selectedCoupon.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 編輯對話框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>編輯優惠券</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="到期時間"
              type="datetime-local"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              helperText="選擇優惠券的到期日期和時間"
            />
            <TextField
              label="連結"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              fullWidth
            />
            <TextField
              label="內容"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="圖片URL"
              value={formData.picture}
              onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 擁有者列表對話框 */}
      <Dialog
        open={openOwnersDialog}
        onClose={() => setOpenOwnersDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCoupon?.name} - 擁有者列表 ({ownersCount} 人)
        </DialogTitle>
        <DialogContent>
          {loadingOwners ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : owners.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              目前沒有人擁有此優惠券
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {owners.map((owner) => (
                    <TableRow key={owner.userId}>
                      <TableCell>{owner.userId}</TableCell>
                      <TableCell>{owner.name}</TableCell>
                      <TableCell>{owner.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOwnersDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



