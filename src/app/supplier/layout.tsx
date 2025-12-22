"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
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
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon from "@mui/icons-material/Store";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AddIcon from "@mui/icons-material/Add";
import { signOut } from "next-auth/react";
import AIAssistant from "@/components/AIAssistant";

const drawerWidth = 240;

const menuItems = [
  { text: "首頁", icon: <HomeIcon />, path: "/supplier" },
  { text: "優惠券管理", icon: <LocalOfferIcon />, path: "/supplier/coupon" },
  { text: "店鋪資訊", icon: <StoreIcon />, path: "/supplier/store" },
];

function SupplierLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [loading, setLoading] = useState(true);
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
      checkSupplierStatus();
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

  const checkSupplierStatus = async () => {
    try {
      let fromRoleSelection = false;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        fromRoleSelection = urlParams.get("role") === "Supplier";
      }
      
      let retries = fromRoleSelection ? 20 : 10;
      let userData = null;
      
      while (retries > 0) {
        const response = await fetch("/api/user");
        
        if (response.ok) {
          userData = await response.json();
          if (userData.dataType === "Supplier") {
            setIsSupplier(true);
            setLoading(false);
            if (fromRoleSelection && typeof window !== "undefined") {
              window.history.replaceState({}, "", "/supplier");
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
            if (finalData.dataType === "Supplier") {
              setIsSupplier(true);
              setLoading(false);
              if (typeof window !== "undefined") {
                window.history.replaceState({}, "", "/supplier");
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
      
      if (userData.dataType !== "Supplier") {
        router.push("/");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking supplier status:", error);
      router.push("/edit");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };


  if (!mounted || loading || status === "loading") {
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

  if (status === "unauthenticated" || !isSupplier) {
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
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
            >
              <MenuIcon />
            </IconButton>

          </Box>

          {/* 右側按鈕 - 移到最右邊 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <IconButton color="inherit" size="small">
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
        <MenuItem onClick={() => { router.push("/supplier/store"); setUserMenuAnchor(null); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>設定</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleLogout(); setUserMenuAnchor(null); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>登出</ListItemText>
        </MenuItem>
      </Menu>

      {/* 左側導航欄 - 設定頁面不顯示 */}
      {pathname !== "/supplier/setting" && (
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
              mt: "64px",
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
          </Box>
        </Drawer>
      )}

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
          // 設定頁面不顯示側邊欄，所以不需要左側 padding；其他頁面根據 Drawer 狀態調整
          pl: pathname === "/supplier/setting" ? 3 : (drawerOpen ? 3 : "16px"), // Drawer 打開時使用統一 padding，關閉時保留 16px
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
      <AIAssistant userRole="Supplier" />
    </Box>
  );
}

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
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
      }
    >
      <SupplierLayoutContent>{children}</SupplierLayoutContent>
    </Suspense>
  );
}
