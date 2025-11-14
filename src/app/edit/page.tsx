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
  TextField,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import StoreIcon from "@mui/icons-material/Store";
import HomeIcon from "@mui/icons-material/Home";

interface UserProfile {
  userId: string;
  dataType: string | null;
  isUserIdConfirmed?: boolean;
}

function EditContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userIdInput, setUserIdInput] = useState("");
  const [userIdSaving, setUserIdSaving] = useState(false);
  const [userIdMessage, setUserIdMessage] = useState("");
  const [userIdError, setUserIdError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.userId) {
      fetchUserProfile();
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

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setProfile({
          userId: data.userId,
          dataType: data.dataType,
          isUserIdConfirmed: data.isUserIdConfirmed ?? true,
        });
        setUserIdInput(data.userId || "");

        if (data.dataType === "Student") {
          router.push("/student");
          return;
        }
        if (data.dataType === "Supplier") {
          router.push("/supplier");
          return;
        }
        if (data.dataType === "Admin") {
          router.push("/admin");
          return;
        }
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "無法取得使用者資料");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("載入資料失敗，請稍後再試");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSelectRole = async (role: "Student" | "Supplier") => {
    if (!session?.userId || !profile?.isUserIdConfirmed) {
      setError("請先設定 User ID");
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
        if (role === "Student") {
          router.push("/student");
        } else {
          router.push("/supplier");
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

  const handleSaveUserId = async () => {
    if (!session?.userId) {
      setUserIdError("請先登入");
      return;
    }

    setUserIdSaving(true);
    setUserIdError("");
    setUserIdMessage("");

    try {
      const response = await fetch("/api/user/set-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                userId: data.userId,
                isUserIdConfirmed: true,
              }
            : prev
        );
        setUserIdMessage("User ID 設定成功！");
        await update({ userId: data.userId });
      } else {
        const data = await response.json();
        setUserIdError(data.error || "設定 User ID 失敗");
      }
    } catch (err) {
      console.error("Error setting userId:", err);
      setUserIdError("設定 User ID 失敗");
    } finally {
      setUserIdSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/login");
  };

  if (!mounted || status === "loading" || profileLoading) {
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

  if (status === "unauthenticated") {
    return null;
  }

  const canSelectRole = profile?.isUserIdConfirmed;

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
              完成帳號設定
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              步驟一：設定您的 User ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              User ID 將作為您在平台上的唯一識別，至少 5 個字元，可使用英文、數字、底線或連字號。
            </Typography>
            <TextField
              label="User ID"
              fullWidth
              value={userIdInput}
              onChange={(e) => {
                setUserIdInput(e.target.value);
                setUserIdError("");
                setUserIdMessage("");
              }}
              error={Boolean(userIdError)}
              helperText={userIdError || " "}
              disabled={userIdSaving}
            />
            <Button
              variant="contained"
              onClick={handleSaveUserId}
              disabled={userIdSaving}
              sx={{ mt: 1 }}
            >
              {userIdSaving ? "儲存中..." : "確認 User ID"}
            </Button>
            {userIdMessage && (
              <Alert severity="success" sx={{ mt: 2 }} onClose={() => setUserIdMessage("")}>
                {userIdMessage}
              </Alert>
            )}
            {!canSelectRole && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                請先完成 User ID 設定才能選擇身分。
              </Alert>
            )}
          </Box>

          <Typography variant="h6" sx={{ mb: 1 }}>
            步驟二：選擇您的身分
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            設定完成後即可開始使用系統功能。
          </Typography>

          <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", sm: "row" } }}>
            <Card
              sx={{
                flex: 1,
                cursor: loading || !canSelectRole ? "not-allowed" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                opacity: canSelectRole ? 1 : 0.6,
                "&:hover": loading || !canSelectRole
                  ? {}
                  : {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
              }}
              onClick={() => !loading && canSelectRole && handleSelectRole("Student")}
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
                  disabled={loading || !canSelectRole}
                  startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
                >
                  選擇學生
                </Button>
              </CardActions>
            </Card>

            <Card
              sx={{
                flex: 1,
                cursor: loading || !canSelectRole ? "not-allowed" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                opacity: canSelectRole ? 1 : 0.6,
                "&:hover": loading || !canSelectRole
                  ? {}
                  : {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
              }}
              onClick={() => !loading && canSelectRole && handleSelectRole("Supplier")}
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
                  disabled={loading || !canSelectRole}
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

