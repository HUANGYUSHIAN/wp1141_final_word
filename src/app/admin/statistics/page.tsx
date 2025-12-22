"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`statistics-tabpanel-${index}`}
      aria-labelledby={`statistics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  
  // 统计数据
  const [studentStats, setStudentStats] = useState<any>(null);
  const [supplierStats, setSupplierStats] = useState<any>(null);
  const [featureStats, setFeatureStats] = useState<any>(null);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 从 API 获取真实数据
      const response = await fetch(`/api/admin/statistics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "載入統計數據失敗");
      }
      
      const data = await response.json();
      
      // 设置统计数据
      setStudentStats(data.studentStats || {
        totalUsers: 0,
        activeUsers: 0,
        pageViews: [],
        topEvents: [],
      });
      
      setSupplierStats(data.supplierStats || {
        totalUsers: 0,
        activeUsers: 0,
        pageViews: [],
        topEvents: [],
      });
      
      setFeatureStats(data.featureStats || {
        popularFeatures: [],
        errorRates: [],
        abandonmentRates: [],
      });
      
      // 如果有错误消息（如未配置 API Key），显示警告但不阻止显示
      if (data.message) {
        console.warn(data.message);
      }
      
      if (data.error) {
        console.error("PostHog API 错误:", data.error);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError(err.message || "載入統計數據失敗");
      
      // 即使出错也设置空数据，而不是显示错误
      setStudentStats({
        totalUsers: 0,
        activeUsers: 0,
        pageViews: [],
        topEvents: [],
      });
      setSupplierStats({
        totalUsers: 0,
        activeUsers: 0,
        pageViews: [],
        topEvents: [],
      });
      setFeatureStats({
        popularFeatures: [],
        errorRates: [],
        abandonmentRates: [],
      });
      
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          請確認 PostHog 已正確配置，並檢查環境變數 NEXT_PUBLIC_POSTHOG_KEY 和 NEXT_PUBLIC_POSTHOG_HOST。
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        統計數據
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>時間範圍</InputLabel>
          <Select
            value={timeRange}
            label="時間範圍"
            onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
          >
            <MenuItem value="7d">最近 7 天</MenuItem>
            <MenuItem value="30d">最近 30 天</MenuItem>
            <MenuItem value="90d">最近 90 天</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="學生功能" />
          <Tab label="供應商功能" />
          <Tab label="功能分析" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {studentStats && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary">
                        總用戶數
                      </Typography>
                      <Typography variant="h4">{studentStats.totalUsers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary">
                        活躍用戶
                      </Typography>
                      <Typography variant="h4">{studentStats.activeUsers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>
                頁面訪問統計
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>頁面</TableCell>
                      <TableCell align="right">訪問次數</TableCell>
                      <TableCell align="right">獨立用戶</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.pageViews.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.page}</TableCell>
                        <TableCell align="right">{item.views}</TableCell>
                        <TableCell align="right">{item.uniqueUsers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" sx={{ mb: 2 }}>
                熱門事件
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>事件</TableCell>
                      <TableCell align="right">觸發次數</TableCell>
                      <TableCell align="right">獨立用戶</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.topEvents.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.event}</TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                        <TableCell align="right">{item.uniqueUsers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      總用戶數
                    </Typography>
                    <Typography variant="h4">{supplierStats?.totalUsers ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      活躍用戶
                    </Typography>
                    <Typography variant="h4">{supplierStats?.activeUsers ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>
              頁面訪問統計
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>頁面</TableCell>
                    <TableCell align="right">訪問次數</TableCell>
                    <TableCell align="right">獨立用戶</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierStats?.pageViews && supplierStats.pageViews.length > 0 ? (
                    supplierStats.pageViews.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.page}</TableCell>
                        <TableCell align="right">{item.views ?? 0}</TableCell>
                        <TableCell align="right">{item.uniqueUsers ?? 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        尚無數據
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 2 }}>
              熱門事件
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>事件</TableCell>
                    <TableCell align="right">觸發次數</TableCell>
                    <TableCell align="right">獨立用戶</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierStats?.topEvents && supplierStats.topEvents.length > 0 ? (
                    supplierStats.topEvents.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.event}</TableCell>
                        <TableCell align="right">{item.count ?? 0}</TableCell>
                        <TableCell align="right">{item.uniqueUsers ?? 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        尚無數據
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              功能受歡迎度
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>功能</TableCell>
                    <TableCell align="right">使用率 (%)</TableCell>
                    <TableCell align="right">滿意度</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {featureStats?.popularFeatures && featureStats.popularFeatures.length > 0 ? (
                    featureStats.popularFeatures.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.feature}</TableCell>
                        <TableCell align="right">{item.usage ?? "0"}%</TableCell>
                        <TableCell align="right">{item.satisfaction !== null && item.satisfaction !== undefined ? parseFloat(item.satisfaction).toFixed(1) : "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        尚無數據
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 2 }}>
              錯誤率分析
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>功能</TableCell>
                    <TableCell align="right">錯誤率 (%)</TableCell>
                    <TableCell align="right">總使用次數</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {featureStats?.errorRates && featureStats.errorRates.length > 0 ? (
                    featureStats.errorRates.map((item: any, index: number) => {
                      const errorRate = item.errorRate !== null && item.errorRate !== undefined ? item.errorRate : null;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.feature}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                              {errorRate !== null ? `${errorRate}%` : "N/A"}
                              {errorRate !== null && errorRate > 5 ? (
                                <TrendingUpIcon color="error" fontSize="small" />
                              ) : errorRate !== null ? (
                                <TrendingDownIcon color="success" fontSize="small" />
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{item.totalUses ?? 0}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        尚無數據
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 2 }}>
              放棄率分析
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>功能</TableCell>
                    <TableCell align="right">放棄率 (%)</TableCell>
                    <TableCell align="right">總開始次數</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {featureStats?.abandonmentRates && featureStats.abandonmentRates.length > 0 ? (
                    featureStats.abandonmentRates.map((item: any, index: number) => {
                      const abandonmentRate = item.abandonmentRate !== null && item.abandonmentRate !== undefined ? item.abandonmentRate : null;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.feature}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                              {abandonmentRate !== null ? `${abandonmentRate}%` : "N/A"}
                              {abandonmentRate !== null && abandonmentRate > 50 ? (
                                <TrendingUpIcon color="error" fontSize="small" />
                              ) : abandonmentRate !== null ? (
                                <TrendingDownIcon color="success" fontSize="small" />
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{item.totalStarts ?? 0}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        尚無數據
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}

