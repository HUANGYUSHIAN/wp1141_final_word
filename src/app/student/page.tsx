"use client";

import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HistoryIcon from "@mui/icons-material/History";
import StoreIcon from "@mui/icons-material/Store";

export default function StudentPage() {
  const router = useRouter();

  return (
    <Box sx={{ width: "100%" }}>
      {/* 功能卡片網格 */}
      <Grid container spacing={3} sx={{ margin: 0, width: "100%" }}>
        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/vocabulary")}
          >
            <CardContent sx={{ p: 3 }}>
              <MenuBookIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                我的單字本
              </Typography>
              <Typography variant="body2" color="text.secondary">
                瀏覽、建立和管理您的單字本
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/vocabulary")}
          >
            <CardContent sx={{ p: 3 }}>
              <AutoAwesomeIcon sx={{ fontSize: 40, color: "secondary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                AI 生成單字本
              </Typography>
              <Typography variant="body2" color="text.secondary">
                使用 AI 快速生成符合您需求的單字本
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/test")}
          >
            <CardContent sx={{ p: 3 }}>
              <SportsEsportsIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                單字測驗
              </Typography>
              <Typography variant="body2" color="text.secondary">
                測試您對單字的掌握程度
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/game")}
          >
            <CardContent sx={{ p: 3 }}>
              <SportsEsportsIcon sx={{ fontSize: 40, color: "secondary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                單字遊戲
              </Typography>
              <Typography variant="body2" color="text.secondary">
                透過遊戲學習單字，讓學習更有趣
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/review")}
          >
            <CardContent sx={{ p: 3 }}>
              <HistoryIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                單字複習
              </Typography>
              <Typography variant="body2" color="text.secondary">
                根據學習進度自動安排複習時間
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
            onClick={() => router.push("/student/store")}
          >
            <CardContent sx={{ p: 3 }}>
              <StoreIcon sx={{ fontSize: 40, color: "secondary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                點數兌換
              </Typography>
              <Typography variant="body2" color="text.secondary">
                用學習獲得的點數兌換優惠券
      </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
