"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import StoreIcon from "@mui/icons-material/Store";
import HomeIcon from "@mui/icons-material/Home";

function EditContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 等待 mounted 和 session 加载完成
    if (!mounted || status === "loading") {
      return;
    }

    // 如果明确未登入，重定向到登入頁
    if (status === "unauthenticated") {
      // 延迟一下，避免在 session 建立过程中的临时状态误判
      const timer = setTimeout(() => {
        if (status === "unauthenticated") {
          router.push("/login");
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // 如果已登入，檢查用戶身分
    if (status === "authenticated" && session?.userId) {
      checkUserType();
      // 顯示歡迎訊息（新用戶）
      if (typeof window !== "undefined") {
        const fromLogin = 
          (document.referrer && document.referrer.includes("/login")) || 
          window.location.search.includes("callbackUrl") ||
          window.location.search.includes("code=");
        if (fromLogin) {
          setShowWelcome(true);
        }
      }
    }
  }, [mounted, status, session, router]);

  const checkUserType = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const userData = await response.json();
        if (userData.dataType) {
          // 已有身分，重定向到對應頁面
          if (userData.dataType === "Student") {
            router.push("/student");
          } else if (userData.dataType === "Supplier") {
            router.push("/supplier");
          } else if (userData.dataType === "Admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
        // 如果 dataType 为 null，保持在 /edit 页面让用户选择
      } else {
        // API 错误，但不重定向到登录（可能是临时错误）
        console.error("Failed to fetch user data:", response.status);
      }
    } catch (error) {
      console.error("Error checking user type:", error);
      // 网络错误，不重定向到登录（可能是临时网络问题）
    }
  };

  const handleSelectRole = async (role: "Student" | "Supplier") => {
    if (!session?.userId) {
      setError("請先登入");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/select-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 等待資料庫更新完成，輪詢確認 dataType 已更新
        let retries = 10;
        let confirmed = false;
        
        while (retries > 0 && !confirmed) {
          try {
            const checkResponse = await fetch("/api/user");
            if (checkResponse.ok) {
              const userData = await checkResponse.json();
              if (userData.dataType === role) {
                confirmed = true;
                break;
              }
            }
          } catch (error) {
            console.error("Error checking user data:", error);
          }
          
          // 等待 300ms 後再重試
          await new Promise(resolve => setTimeout(resolve, 300));
          retries--;
        }
        
        // 無論確認成功與否，都直接重定向（資料庫已更新，只是可能還沒同步）
        // 使用 window.location.replace 避免在歷史記錄中留下 /edit 頁面
        const timestamp = Date.now();
        if (role === "Student") {
          window.location.replace(`/student?t=${timestamp}&role=Student`);
        } else {
          window.location.replace(`/supplier?t=${timestamp}&role=Supplier`);
        }
      } else {
        const data = await response.json();
        setError(data.error || "選擇身分失敗，請稍後再試");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error selecting role:", error);
      setError("選擇身分失敗，請稍後再試");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 取消選擇，登出並清除資料
    router.push("/login");
  };

  if (!mounted || status === "loading") {
    return (
      <Container>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // 如果明确未认证，显示加载状态而不是 null（避免 hydration mismatch）
  if (status === "unauthenticated" && mounted) {
    return (
      <Container>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 600 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4" component="h1">
              選擇您的身分
            </Typography>
            <Button
              startIcon={<HomeIcon />}
              onClick={handleCancel}
              variant="outlined"
              disabled={loading}
            >
              取消
            </Button>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            請選擇您的身分以繼續使用服務。如果現在不選擇，您可以稍後再登入選擇。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", sm: "row" } }}>
            <Card
              sx={{
                flex: 1,
                cursor: loading ? "default" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": loading
                  ? {}
                  : {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
              }}
              onClick={() => !loading && handleSelectRole("Student")}
            >
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <SchoolIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  學生
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  使用單字本學習、參與遊戲、複習單字等功能
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleSelectRole("Student")}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
                >
                  選擇學生
                </Button>
              </CardActions>
            </Card>

            <Card
              sx={{
                flex: 1,
                cursor: loading ? "default" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": loading
                  ? {}
                  : {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
              }}
              onClick={() => !loading && handleSelectRole("Supplier")}
            >
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <StoreIcon sx={{ fontSize: 60, color: "secondary.main", mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  廠商
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  管理優惠券、店鋪資訊、查看評分與回饋等功能
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => handleSelectRole("Supplier")}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <StoreIcon />}
                >
                  選擇廠商
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Paper>
      </Box>
      
      <Snackbar
        open={showWelcome}
        autoHideDuration={3000}
        onClose={() => setShowWelcome(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setShowWelcome(false)}>
          歡迎新加入！請選擇您的身分
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <EditContent />
    </Suspense>
  );
}

