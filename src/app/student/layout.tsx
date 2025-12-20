"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StoreIcon from "@mui/icons-material/Store";
import SettingsIcon from "@mui/icons-material/Settings";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import { signOut } from "next-auth/react";
import AIAssistant from "@/components/AIAssistant";

const drawerWidth = 240;

const menuItems = [
  { text: "首頁", icon: <HomeIcon />, path: "/student" },
  { text: "我的單字本", icon: <MenuBookIcon />, path: "/student/vocabulary" },
  { text: "文法家教", icon: <MenuBookIcon />, path: "/student/grammar" },
  { text: "點數兌換", icon: <StoreIcon />, path: "/student/store" },
  { text: "單字遊戲", icon: <SportsEsportsIcon />, path: "/student/game" },
  { text: "單字複習", icon: <HistoryIcon />, path: "/student/review" },
  { text: "單字測驗", icon: <SportsEsportsIcon />, path: "/student/test" },
];

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (status === "loading") {
      setLoading(true);
      return;
    }
    
    if (status === "authenticated" && session?.userId) {
      checkStudentStatus();
      fetchUserInfo();
    } else if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        if (status === "unauthenticated") {
          router.push("/login");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted, status, session, router]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          name: data.name,
          email: data.email,
          image: data.image,
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const checkStudentStatus = async () => {
    try {
      let fromRoleSelection = false;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        fromRoleSelection = urlParams.get("role") === "Student";
      }
      
      let retries = fromRoleSelection ? 20 : 10;
      let userData = null;
      
      while (retries > 0) {
        const response = await fetch("/api/user");
        
        if (response.ok) {
          userData = await response.json();
          if (userData.dataType === "Student") {
            setIsStudent(true);
            setLoading(false);
            if (fromRoleSelection && typeof window !== "undefined") {
              window.history.replaceState({}, "", "/student");
            }
            return;
          } else if (userData.dataType) {
            router.push("/");
            setLoading(false);
            return;
          }
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, fromRoleSelection ? 300 : 500));
          }
        } else {
          const data = await response.json().catch(() => ({}));
          
          if (data.clearSession && (response.status === 401 || response.status === 404 || response.status === 403)) {
            console.log("Clearing session due to:", response.status, data);
            await signOut({ callbackUrl: "/login", redirect: true });
            setLoading(false);
            return;
          }
          
          if (response.status === 503) {
            console.warn("Database temporarily unavailable, keeping session");
            setLoading(false);
            return;
          }
          
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        retries--;
      }
      
      if (!userData || !userData.dataType) {
        if (fromRoleSelection) {
          console.log("Still waiting for dataType update...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          const finalCheck = await fetch("/api/user");
          if (finalCheck.ok) {
            const finalData = await finalCheck.json();
            if (finalData.dataType === "Student") {
              setIsStudent(true);
              setLoading(false);
              if (typeof window !== "undefined") {
                window.history.replaceState({}, "", "/student");
              }
              return;
            }
          }
        }
        console.log("No dataType found after retries, redirecting to /edit");
        router.push("/edit");
        setLoading(false);
        return;
      }
      
      if (userData.dataType !== "Student") {
        router.push("/");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking student status:", error);
      router.push("/edit");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 可以實作搜尋功能
      console.log("Search:", searchQuery);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading || status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === "unauthenticated" || !isStudent) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", bgcolor: "background.default", minHeight: "100vh" }}>
      {/* 頂部 AppBar - Quizlet 風格 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "#2d2d2d",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "none",
        }}
      >
        <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            {/* 漢堡選單按鈕 */}
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
            >
              <MenuIcon />
            </IconButton>

            {/* 搜尋欄 */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                flex: 1,
                maxWidth: 600,
                position: "relative",
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                },
                "&:focus-within": {
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                },
                transition: "background-color 0.2s",
              }}
            >
              <InputBase
                placeholder="透過搜尋更快找到它"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  color: "inherit",
                  width: "100%",
                  pl: 4,
                  pr: 1,
                  py: 1,
                }}
                startAdornment={
                  <SearchIcon sx={{ position: "absolute", left: 12, color: "text.secondary" }} />
                }
              />
            </Box>
          </Box>

          {/* 右側按鈕 - 移到最右邊 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <IconButton 
              color="inherit" 
              size="small"
              onClick={() => router.push("/student/vocabulary?create=true")}
              title="新增單字本"
            >
              <AddIcon />
            </IconButton>
            <IconButton color="inherit" size="small">
              <NotificationsIcon />
            </IconButton>
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <Avatar
                src={userInfo?.image || undefined}
                sx={{ width: 32, height: 32 }}
              >
                {userInfo?.name?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 用戶選單 */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="body2">{userInfo?.name || "使用者"}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {userInfo?.email || ""}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { router.push("/student/setting"); setUserMenuAnchor(null); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>設定</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleLogout(); setUserMenuAnchor(null); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>登出</ListItemText>
        </MenuItem>
      </Menu>

      {/* 左側導航欄 - Quizlet 風格 */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1e1e1e",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            mt: "64px", // AppBar 高度
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: "hidden",
          },
        }}
      >
        <Box sx={{ overflow: "auto", p: 2 }}>
          {/* 主要導航 */}
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: "8px",
                    py: 1.5,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: pathname === item.path ? "inherit" : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.95rem",
                      fontWeight: pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* 文件夾區塊 */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1,
                color: "text.secondary",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              你的文件夾
            </Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    borderRadius: "8px",
                    py: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                    <AddIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="新文件夾"
                    primaryTypographyProps={{ fontSize: "0.95rem" }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* 從這裡開始 */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1,
                color: "text.secondary",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              從這裡開始
            </Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => router.push("/student/vocabulary")}
                  sx={{
                    borderRadius: "8px",
                    py: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                    <MenuBookIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="單詞卡"
                    primaryTypographyProps={{ fontSize: "0.95rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => router.push("/student/grammar")}
                  sx={{
                    borderRadius: "8px",
                    py: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                    <MenuBookIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="專家解答"
                    primaryTypographyProps={{ fontSize: "0.95rem" }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* 主要內容區域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          mt: "64px", // AppBar 高度
          bgcolor: "background.default",
          minHeight: "calc(100vh - 64px)",
          overflow: "auto",
          // 添加內邊距，提供視覺呼吸空間
          p: 3, // 24px 的內邊距
          pt: 4, // 頂部稍微加厚，確保與 AppBar 有足夠間距
          // 當 Drawer 關閉時，保持左側間距
          pl: drawerOpen ? 3 : "16px", // Drawer 打開時使用統一 padding，關閉時保留 16px
          transition: (theme) =>
            theme.transitions.create("padding-left", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {children}
      </Box>

      {/* AI 助手 - 浮動視窗 */}
      <AIAssistant userRole="Student" />
    </Box>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentLayoutContent>{children}</StudentLayoutContent>;
}
