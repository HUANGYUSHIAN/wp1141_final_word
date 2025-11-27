"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

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
  storeWebsite?: string | null;
  isOwned?: boolean;
}

export default function StudentStorePage() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [selectedStoreInfo, setSelectedStoreInfo] = useState<{
    name: string;
    location: string | null;
    hours: string | null;
    website: string | null;
  } | null>(null);
  const [lotteryPoints, setLotteryPoints] = useState(50);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { width, height } = useWindowSize();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPoints(), loadMyCoupons(), loadAvailableCoupons()]);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("載入資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const loadPoints = async () => {
    try {
      const response = await fetch("/api/student/game");
      if (response.ok) {
        const data = await response.json();
        setPoints(data.points || 0);
      }
    } catch (error) {
      console.error("Error loading points:", error);
    }
  };

  const loadMyCoupons = async () => {
    try {
      const response = await fetch("/api/student/coupons");
      if (response.ok) {
        const data = await response.json();
        setMyCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Error loading my coupons:", error);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const response = await fetch("/api/student/coupons/browse");
      if (response.ok) {
        const data = await response.json();
        setAvailableCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Error loading available coupons:", error);
    }
  };

  const handleLottery = async () => {
    if (points < lotteryPoints) {
      setError("點數不足");
      return;
    }

    try {
      const response = await fetch("/api/student/coupons/lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: lotteryPoints }),
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.remainingPoints);
        setSelectedCoupon(data.coupon);
        setOpenDialog(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setSuccess(`恭喜獲得優惠券：${data.coupon.name}！`);
        await loadMyCoupons();
        await loadAvailableCoupons();
      } else {
        const data = await response.json();
        setError(data.error || "抽獎失敗");
      }
    } catch (error) {
      console.error("Error in lottery:", error);
      setError("抽獎失敗");
    }
  };

  const handleViewCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setOpenDialog(true);
  };

  const handleViewStore = (coupon: Coupon) => {
    if (coupon.storeName) {
      setSelectedStoreInfo({
        name: coupon.storeName,
        location: coupon.storeLocation || null,
        hours: coupon.storeHours || null,
        website: coupon.storeWebsite || null,
      });
      setOpenStoreDialog(true);
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
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">點數兌換</Typography>
        <Paper sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h5">我的點數: {points}</Typography>
        </Paper>
      </Box>

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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          抽獎
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={() => setLotteryPoints(50)}
            color={lotteryPoints === 50 ? "primary" : "inherit"}
          >
            50 點
          </Button>
          <Button
            variant="outlined"
            onClick={() => setLotteryPoints(100)}
            color={lotteryPoints === 100 ? "primary" : "inherit"}
          >
            100 點
          </Button>
          <Button
            variant="outlined"
            onClick={() => setLotteryPoints(200)}
            color={lotteryPoints === 200 ? "primary" : "inherit"}
          >
            200 點
          </Button>
          <Button
            variant="contained"
            onClick={handleLottery}
            disabled={points < lotteryPoints}
            size="large"
          >
            抽獎 ({lotteryPoints} 點)
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          消耗 {lotteryPoints} 點即可參與抽獎，有機會獲得優惠券！
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="我的優惠券" />
          <Tab label="瀏覽所有優惠券" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={2}>
            {myCoupons.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  您還沒有優惠券，快去抽獎吧！
                </Typography>
              </Grid>
            ) : (
              myCoupons.map((coupon) => (
                <Grid item xs={12} sm={6} md={4} key={coupon.couponId}>
                  <Card>
                    {coupon.picture && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={coupon.picture}
                        alt={coupon.name}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {coupon.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        使用期限: {new Date(coupon.period).toLocaleDateString()}
                      </Typography>
                      {coupon.storeName && (
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ 
                            mt: 0.5, 
                            fontWeight: 'medium',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': {
                              textDecoration: 'underline',
                              opacity: 0.8,
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStore(coupon);
                          }}
                        >
                          🏪 {coupon.storeName}
                        </Typography>
                      )}
                      {coupon.storeLocation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          📍 {coupon.storeLocation}
                        </Typography>
                      )}
                      {coupon.text && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {coupon.text.length > 50
                            ? coupon.text.substring(0, 50) + "..."
                            : coupon.text}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleViewCoupon(coupon)}>
                        查看詳情
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={2}>
            {availableCoupons.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  目前沒有可用的優惠券
                </Typography>
              </Grid>
            ) : (
              availableCoupons.map((coupon) => (
                <Grid item xs={12} sm={6} md={4} key={coupon.couponId}>
                  <Card>
                    {coupon.picture && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={coupon.picture}
                        alt={coupon.name}
                      />
                    )}
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="h6">
                          {coupon.name}
                        </Typography>
                        {coupon.isOwned && (
                          <Chip label="已擁有" color="success" size="small" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        使用期限: {new Date(coupon.period).toLocaleDateString()}
                      </Typography>
                      {coupon.storeName && (
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ 
                            mt: 0.5, 
                            fontWeight: 'medium',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': {
                              textDecoration: 'underline',
                              opacity: 0.8,
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStore(coupon);
                          }}
                        >
                          🏪 {coupon.storeName}
                        </Typography>
                      )}
                      {coupon.storeLocation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          📍 {coupon.storeLocation}
                        </Typography>
                      )}
                      {coupon.text && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {coupon.text.length > 50
                            ? coupon.text.substring(0, 50) + "..."
                            : coupon.text}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleViewCoupon(coupon)}>
                        查看詳情
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Paper>

      {/* 優惠券詳情對話框 */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedCoupon?.name}</DialogTitle>
        <DialogContent>
          {selectedCoupon && (
            <Box>
              {selectedCoupon.picture && (
                <CardMedia
                  component="img"
                  height="200"
                  image={selectedCoupon.picture}
                  alt={selectedCoupon.name}
                  sx={{ mb: 2, borderRadius: 1 }}
                />
              )}
              <Typography><strong>優惠券ID:</strong> {selectedCoupon.couponId}</Typography>
              <Typography><strong>使用期限:</strong> {new Date(selectedCoupon.period).toLocaleString()}</Typography>
              {selectedCoupon.storeName && (
                <Typography 
                  sx={{ 
                    mt: 1, 
                    cursor: 'pointer', 
                    color: 'primary.main', 
                    textDecoration: 'underline',
                    '&:hover': {
                      opacity: 0.8,
                    }
                  }}
                  onClick={() => {
                    setOpenDialog(false);
                    handleViewStore(selectedCoupon);
                  }}
                >
                  <strong>店名:</strong> {selectedCoupon.storeName}
                </Typography>
              )}
              {selectedCoupon.storeLocation && (
                <Typography sx={{ mt: 1 }}><strong>地址:</strong> {selectedCoupon.storeLocation}</Typography>
              )}
              {selectedCoupon.storeHours && (
                <Typography sx={{ mt: 1 }}><strong>營業時間:</strong> {selectedCoupon.storeHours}</Typography>
              )}
              {selectedCoupon.link && (
                <Typography sx={{ mt: 1 }}><strong>連結:</strong> <a href={selectedCoupon.link} target="_blank" rel="noopener noreferrer">{selectedCoupon.link}</a></Typography>
              )}
              {selectedCoupon.text && (
                <Typography sx={{ mt: 2 }}><strong>內容:</strong></Typography>
              )}
              {selectedCoupon.text && (
                <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{selectedCoupon.text}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 店家資訊對話框 */}
      <Dialog
        open={openStoreDialog}
        onClose={() => setOpenStoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>店家資訊</DialogTitle>
        <DialogContent>
          {selectedStoreInfo && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                🏪 {selectedStoreInfo.name}
              </Typography>
              {selectedStoreInfo.location && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    <strong>📍 地址:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedStoreInfo.location}
                  </Typography>
                </Box>
              )}
              {selectedStoreInfo.hours && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    <strong>🕐 營業時間:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedStoreInfo.hours}
                  </Typography>
                </Box>
              )}
              {selectedStoreInfo.website && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    <strong>🌐 網站:</strong>
                  </Typography>
                  <Typography variant="body1">
                    <a href={selectedStoreInfo.website} target="_blank" rel="noopener noreferrer">
                      {selectedStoreInfo.website}
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStoreDialog(false)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



