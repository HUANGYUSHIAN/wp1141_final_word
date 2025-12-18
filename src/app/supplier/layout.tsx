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
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon from "@mui/icons-material/Store";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "next-auth/react";
import AIAssistant from "@/components/AIAssistant";

const drawerWidth = 240;

const menuItems = [
  { text: "設定", icon: <SettingsIcon />, path: "/supplier/setting" },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // 等待 session 加载完成
    if (status === "loading") {
      setLoading(true);
      return;
    }
    
    if (status === "authenticated" && session?.userId) {
      checkSupplierStatus();
    } else if (status === "unauthenticated") {
      // 延迟检查，避免在 session 建立过程中的临时状态误判
      const timer = setTimeout(() => {
        if (status === "unauthenticated") {
      router.push("/login");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted, status, session, router]);

  const checkSupplierStatus = async () => {
    try {
      // 检查 URL 参数，如果是从选择角色页面重定向来的，增加重试次数
      let fromRoleSelection = false;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        fromRoleSelection = urlParams.get("role") === "Supplier";
      }
      
      // 添加重试机制，因为选择角色后数据库更新可能需要一点时间
      // 如果是从角色选择页面来的，增加重试次数
      let retries = fromRoleSelection ? 20 : 10;
      let userData = null;
      
      while (retries > 0) {
      const response = await fetch("/api/user");
        
      if (response.ok) {
          userData = await response.json();
        if (userData.dataType === "Supplier") {
          setIsSupplier(true);
            setLoading(false);
            // 清除 URL 参数
            if (fromRoleSelection && typeof window !== "undefined") {
              window.history.replaceState({}, "", "/supplier");
            }
            return;
          } else if (userData.dataType) {
            // 如果是其他角色，重定向到首页
          router.push("/");
            setLoading(false);
            return;
          }
          // 如果 dataType 为 null，等待一下再重试
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, fromRoleSelection ? 300 : 500));
        }
      } else {
        // 檢查是否需要清除 session
        const data = await response.json().catch(() => ({}));
        
        // 只有在明確標記 clearSession: true 且是 404（找不到用戶）時才清除 session
        // 401（未登入）和 403（帳號鎖定）也需要清除
        // 但 503（服務不可用）和 500（伺服器錯誤）不應該清除 session
        if (data.clearSession && (response.status === 401 || response.status === 404 || response.status === 403)) {
          // 確認資料庫中真的沒有用戶，才清除 session
          console.log("Clearing session due to:", response.status, data);
          await signOut({ callbackUrl: "/login", redirect: true });
            setLoading(false);
          return;
        }
        
        // 如果是暫時的錯誤（503），不應該清除 session
        if (response.status === 503) {
          console.warn("Database temporarily unavailable, keeping session");
            setLoading(false);
          return;
        }
        
          // 其他錯誤，等待後重試
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        retries--;
      }
      
      // 如果重试后还是没有 dataType，且是从角色选择页面来的，继续等待
      // 否则重定向到选择页面（不登出）
      if (!userData || !userData.dataType) {
        if (fromRoleSelection) {
          // 如果是从角色选择页面来的，再等待一下
          console.log("Still waiting for dataType update...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          // 再次检查
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
      
      // 如果是其他角色，重定向到首页
      if (userData.dataType !== "Supplier") {
        router.push("/");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking supplier status:", error);
      // 網絡錯誤或其他錯誤，不應該立即清除 session
      // 可能是暫時的網絡問題或資料庫連接問題
      // 重定向到選擇頁面而不是登出
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
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            廠商專區
          </Typography>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => router.push("/supplier")}
            sx={{ mr: 2 }}
          >
            首頁
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            登出
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", flex: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AIAssistant />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
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
