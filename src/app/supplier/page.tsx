"use client";

import { Box, Typography, Card, CardContent, Button, Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon from "@mui/icons-material/Store";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";

export default function SupplierPage() {
  const router = useRouter();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        歡迎來到廠商專區
      </Typography>

      {/* 功能卡片網格 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: "background.paper",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
            onClick={() => router.push("/supplier/coupon")}
          >
            <CardContent sx={{ p: 3 }}>
              <LocalOfferIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                優惠券管理
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                新增、編輯和管理您的優惠券
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: "primary.main",
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                新增優惠券
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: "background.paper",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
            onClick={() => router.push("/supplier/store")}
          >
            <CardContent sx={{ p: 3 }}>
              <StoreIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                店鋪資訊
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                管理您的預設店鋪資訊和多個分店
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: "primary.main",
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                新增分店
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: "background.paper",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
            onClick={() => router.push("/supplier/store")}
          >
            <CardContent sx={{ p: 3 }}>
              <SettingsIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                設定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                調整個人資料和系統設定
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
