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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function SupplierStorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    businessHours: "",
    website: "",
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/store");
      if (response.ok) {
        const data = await response.json();
        const store = data.store || {};
        setFormData({
          name: store.name || "",
          location: store.location || "",
          businessHours: store.businessHours || "",
          website: store.website || "",
        });
      } else {
        setError("載入店鋪資料失敗");
      }
    } catch (error) {
      console.error("Error fetching store:", error);
      setError("載入店鋪資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("店名為必填");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // 直接更新供應商的店鋪資訊
      const response = await fetch("/api/supplier/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("店鋪資訊更新成功！");
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || data.details || "更新店鋪資訊失敗");
        console.error("Update error:", data);
      }
    } catch (error) {
      console.error("Error saving store:", error);
      setError("儲存失敗");
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
        店鋪資訊編輯
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          店鋪基本資訊
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          編輯您的店鋪資訊，這些資訊會自動帶入到您新增的優惠券中
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="店名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="地址"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="請輸入完整的店鋪地址"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="營業時間"
              value={formData.businessHours}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="例如：週一至週五 10:00-22:00，週六日 11:00-23:00"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="網站"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              fullWidth
              placeholder="https://example.com"
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "儲存中..." : "儲存店鋪資訊"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
