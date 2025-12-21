"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  Collapse,
  Tooltip,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useRouter, usePathname } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  userRole?: "Student" | "Supplier";
}

// 提示類型定義
interface PageHint {
  selector: string; // CSS selector 或 ID
  message: string;
  position?: "top" | "bottom" | "left" | "right";
}

// 學生新手教學流程 - 實際操作引導
const studentTutorialSteps: Array<{
  step: string | number;
  message: string;
  action?: "navigate";
  path?: string;
  quickActions?: string[];
  hint?: PageHint;
}> = [
  {
    step: 0,
    message: "歡迎來到學生專區！我是您的學習助手，我可以實際帶領您完成各種操作。\n\n讓我來協助您：\n1. 新增單字本\n2. 進行單字測驗\n3. 使用其他功能\n\n您想要從哪個開始？",
    quickActions: ["帶領我新增單字本", "帶領我進行單字測驗", "先了解一下所有功能"],
  },
  {
    step: "create-vocab",
    message: "太好了！讓我帶您新增單字本。\n\n請先點擊左側選單的「單字本」，然後我會繼續引導您完成後續步驟。",
    action: "navigate",
    path: "/student/vocabulary",
    quickActions: ["已到達單字本頁面"],
  },
  {
    step: "create-vocab-2",
    message: "很好！現在請找到頁面上方的「建立單字本」按鈕，點擊它。\n\n點擊後會打開一個對話框，我會繼續引導您填寫表單。",
    quickActions: ["已點擊建立單字本按鈕"],
    hint: {
      selector: 'button:has-text("建立單字本"), [aria-label*="建立單字本"]',
      message: "點擊這裡建立單字本",
      position: "bottom",
    },
  },
  {
    step: "create-vocab-3",
    message: "很好！現在請按照以下步驟填寫：\n\n1. 首先選擇「背誦語言」（例如：日語）\n2. 然後選擇「解釋語言」（例如：繁體中文）\n3. 點擊「設定」按鈕\n\n完成後告訴我！",
    quickActions: ["已完成語言設定"],
  },
  {
    step: "create-vocab-4",
    message: "太好了！現在請：\n\n1. 在「輸入單字」欄位中輸入一個單字（例如：こんにちは）\n2. 點擊「搜尋」按鈕\n3. 系統會自動填入單字的詳細資訊\n\n您可以重複此步驟加入更多單字（最多30個）。",
    quickActions: ["已加入單字", "需要幫助"],
  },
  {
    step: "create-vocab-5",
    message: "很好！現在請：\n\n1. 在「單字本名稱」欄位輸入名稱（例如：基礎日語單字）\n2. 選擇是否公開\n3. 確認單字列表無誤後，點擊「儲存」按鈕\n\n完成後，您的單字本就建立成功了！",
    quickActions: ["已完成建立", "需要幫助"],
  },
  {
    step: "test-vocab",
    message: "好的！讓我帶您進行單字測驗。\n\n請先點擊左側選單的「單字測驗」，然後我會繼續引導您。",
    action: "navigate",
    path: "/student/test",
    quickActions: ["已到達測驗頁面"],
  },
  {
    step: "test-vocab-2",
    message: "很好！現在請：\n\n1. 選擇一個您想測驗的單字本\n2. 選擇測驗類型（選擇題、填空題等）\n3. 點擊「開始測驗」\n\n測驗過程中，系統會根據您的表現給分，完成後可以看到詳細的成績分析！",
    quickActions: ["已完成測驗", "需要更多說明"],
  },
];

// 廠商新手教學流程 - 實際操作引導
const supplierTutorialSteps: Array<{
  step: string | number;
  message: string;
  action?: "navigate";
  path?: string;
  quickActions?: string[];
  hint?: PageHint;
}> = [
  {
    step: 0,
    message: "歡迎來到廠商專區！我是您的專屬助手，我可以實際帶領您完成各種操作。\n\n讓我來協助您：\n1. 新增分店\n2. 發行優惠券\n3. 管理店鋪資訊\n\n您想要從哪個開始？",
    quickActions: ["帶領我新增分店", "帶領我發行優惠券", "先了解一下所有功能"],
  },
  {
    step: "create-store",
    message: "太好了！讓我帶您新增分店。\n\n請先點擊左側選單的「店鋪資訊」，然後我會繼續引導您。",
    action: "navigate",
    path: "/supplier/store",
    quickActions: ["已到達店鋪資訊頁面"],
  },
  {
    step: "create-store-2",
    message: "很好！請找到「分店管理」區塊，點擊「新增分店」按鈕。\n\n點擊後會打開一個對話框。",
    quickActions: ["已點擊新增分店"],
    hint: {
      selector: 'button:has-text("新增分店"), [aria-label*="新增分店"]',
      message: "點擊這裡新增分店",
      position: "bottom",
    },
  },
  {
    step: "create-store-3",
    message: "現在請填寫分店資訊：\n\n1. 分店名稱（必填，例如：台北分店）\n2. 地址（例如：台北市信義區...）\n3. 營業時間（例如：週一至週五 10:00-22:00）\n4. 網站（選填）\n\n填寫完成後點擊「儲存」。",
    quickActions: ["已完成新增分店", "需要幫助"],
  },
  {
    step: "create-coupon",
    message: "太好了！讓我帶您發行優惠券。\n\n請先點擊左側選單的「優惠券管理」，然後我會繼續引導您。",
    action: "navigate",
    path: "/supplier/coupon",
    quickActions: ["已到達優惠券管理頁面"],
  },
  {
    step: "create-coupon-2",
    message: "很好！請找到「新增優惠券」區塊，現在請填寫：\n\n1. 名稱（必填）\n2. 到期時間（必填）\n3. 連結、內容、圖片URL（選填）\n4. 選擇店家（可選，選擇要以哪個分店的身份發行）\n\n填寫完成後點擊「新增優惠券」。",
    quickActions: ["已完成發行優惠券", "需要幫助"],
  },
];

export default function AIAssistant({ userRole }: AIAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState<string | number | null>(null);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [currentHint, setCurrentHint] = useState<PageHint | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounterRef = useRef(0);

  // 生成唯一的訊息 ID
  const generateMessageId = () => {
    messageIdCounterRef.current += 1;
    return `${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // 根據用戶身份選擇教學流程
  const tutorialSteps = userRole === "Student" ? studentTutorialSteps : supplierTutorialSteps;

  // 滾動到最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 首次打開時自動開始教學
  useEffect(() => {
    if (open && isFirstOpen && messages.length === 0 && tutorialSteps.length > 0) {
      setIsFirstOpen(false);
      setTimeout(() => {
        setCurrentStep(0);
        const welcomeMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: tutorialSteps[0].message,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [open, isFirstOpen, messages.length, tutorialSteps]);

  // 監聽路徑變化，如果使用者到達了引導的頁面，自動進行下一步
  useEffect(() => {
    if (currentStep && typeof currentStep === "string" && currentStep.includes("-")) {
      const stepData = tutorialSteps.find((s) => s.step === currentStep);
      if (stepData?.action === "navigate" && stepData.path === pathname) {
        // 使用者已到達目標頁面，自動進行下一步
        const nextStepIndex = tutorialSteps.findIndex((s) => s.step === currentStep) + 1;
        if (nextStepIndex < tutorialSteps.length) {
          const nextStep = tutorialSteps[nextStepIndex];
          setTimeout(() => {
            addAssistantMessage(nextStep.message);
            setCurrentStep(nextStep.step);
            if (nextStep.hint) {
              setCurrentHint(nextStep.hint);
              highlightElement(nextStep.hint);
            }
          }, 1000);
        }
      }
    }
  }, [pathname, currentStep, tutorialSteps]);

  // 高亮頁面上的元素
  const highlightElement = (hint: PageHint) => {
    // 使用多種方式查找元素
    setTimeout(() => {
      let element: HTMLElement | null = null;

      // 方法1: 直接 ID 選擇器
      if (hint.selector.startsWith("#")) {
        element = document.querySelector(hint.selector);
      }
      // 方法2: 查找包含特定文字的按鈕
      else if (hint.selector.includes("建立單字本")) {
        const buttons = Array.from(document.querySelectorAll("button"));
        element = buttons.find((btn) => btn.textContent?.includes("建立單字本")) || null;
      } else if (hint.selector.includes("新增分店")) {
        const buttons = Array.from(document.querySelectorAll("button"));
        element = buttons.find((btn) => btn.textContent?.includes("新增分店")) || null;
      }
      // 方法3: 通用選擇器
      else {
        element = document.querySelector(hint.selector) as HTMLElement;
      }

      if (element) {
        // 添加高亮樣式
        element.style.transition = "all 0.3s ease";
        element.style.boxShadow = "0 0 0 4px rgba(25, 118, 210, 0.4)";
        element.style.borderRadius = "4px";
        element.style.position = "relative";
        element.style.zIndex = "1000";

        // 創建提示氣泡
        const tooltip = document.createElement("div");
        tooltip.id = "ai-assistant-hint";
        tooltip.style.cssText = `
          position: absolute;
          background: #1976d2;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          white-space: nowrap;
          z-index: 10001;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        tooltip.textContent = hint.message;

        const rect = element.getBoundingClientRect();
        const position = hint.position || "bottom";

        if (position === "bottom") {
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.left = `${rect.left}px`;
        } else if (position === "top") {
          tooltip.style.bottom = `${rect.height + 8}px`;
          tooltip.style.left = `${rect.left}px`;
        }

        document.body.appendChild(tooltip);

        // 點擊元素後移除高亮
        const removeHighlight = () => {
          element!.style.boxShadow = "";
          const existingTooltip = document.getElementById("ai-assistant-hint");
          if (existingTooltip) {
            existingTooltip.remove();
          }
          element!.removeEventListener("click", removeHighlight);
        };

        element.addEventListener("click", removeHighlight, { once: true });

        // 5秒後自動移除（如果還沒點擊）
        setTimeout(() => {
          const existingTooltip = document.getElementById("ai-assistant-hint");
          if (existingTooltip) {
            existingTooltip.remove();
          }
          if (element) {
            element.style.boxShadow = "";
          }
        }, 5000);
      }
    }, 300);
  };

  // 清除提示
  useEffect(() => {
    return () => {
      const tooltip = document.getElementById("ai-assistant-hint");
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [currentStep]);

  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = {
      id: generateMessageId(),
      role: "assistant",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleQuickAction = (action: string) => {
    if (action === "帶領我新增單字本" || action === "帶領我新增分店") {
      const targetStep = userRole === "Student" ? "create-vocab" : "create-store";
      const stepData = tutorialSteps.find((s) => s.step === targetStep);
      if (stepData) {
        setCurrentStep(targetStep);
        addAssistantMessage(stepData.message);
        if (stepData.action === "navigate" && stepData.path) {
          router.push(stepData.path);
        }
      }
    } else if (action === "帶領我進行單字測驗" || action === "帶領我發行優惠券") {
      const targetStep = userRole === "Student" ? "test-vocab" : "create-coupon";
      const stepData = tutorialSteps.find((s) => s.step === targetStep);
      if (stepData) {
        setCurrentStep(targetStep);
        addAssistantMessage(stepData.message);
        if (stepData.action === "navigate" && stepData.path) {
          router.push(stepData.path);
        }
      }
    } else if (action === "先了解一下所有功能") {
      const introMessage = userRole === "Student"
        ? "學生專區的主要功能包括：\n\n1. **單字本**：瀏覽、建立、管理單字本\n2. **文法家教**：AI 助手回答文法問題\n3. **點數兌換**：用點數兌換優惠券\n4. **單字遊戲**：透過遊戲學習單字\n5. **單字複習**：自動安排複習時間\n6. **單字測驗**：測試單字掌握程度\n\n您想要深入了解哪個功能，或直接開始操作？"
        : "廠商專區的主要功能包括：\n\n1. **店鋪資訊**：管理預設店鋪資訊和多個分店\n2. **優惠券管理**：新增、編輯、刪除優惠券，查看擁有者\n3. **設定**：調整個人資料和系統設定\n\n您想要深入了解哪個功能，或直接開始操作？";
      addAssistantMessage(introMessage);
      setCurrentStep(null);
      setCurrentHint(null);
    } else if (action === "已到達單字本頁面" || action === "已到達店鋪資訊頁面" || action === "已到達測驗頁面" || action === "已到達優惠券管理頁面") {
      // 自動進行下一步
      const currentStepIndex = tutorialSteps.findIndex((s) => s.step === currentStep);
      if (currentStepIndex >= 0 && currentStepIndex < tutorialSteps.length - 1) {
        const nextStep = tutorialSteps[currentStepIndex + 1];
        setCurrentStep(nextStep.step);
        addAssistantMessage(nextStep.message);
        if (nextStep.hint) {
          setCurrentHint(nextStep.hint);
          highlightElement(nextStep.hint);
        }
      }
    } else if (action === "已點擊建立單字本按鈕" || action === "已點擊新增分店") {
      const currentStepIndex = tutorialSteps.findIndex((s) => s.step === currentStep);
      if (currentStepIndex >= 0 && currentStepIndex < tutorialSteps.length - 1) {
        const nextStep = tutorialSteps[currentStepIndex + 1];
        setCurrentStep(nextStep.step);
        addAssistantMessage(nextStep.message);
        setCurrentHint(null);
      }
    } else if (action === "已完成語言設定" || action === "已完成新增分店" || action === "已完成建立" || action === "已完成發行優惠券" || action === "已完成測驗") {
      addAssistantMessage("太棒了！您已經成功完成了操作。如果還有其他需要幫助的地方，隨時告訴我！");
      setCurrentStep(null);
      setCurrentHint(null);
    } else if (action === "需要幫助" || action === "需要更多說明") {
      const currentStepData = tutorialSteps.find((s) => s.step === currentStep);
      if (currentStepData) {
        addAssistantMessage(`沒問題！您目前正在進行「${currentStepData.message.split("\n")[0]}」步驟。請告訴我您遇到了什麼問題，我會協助您解決。`);
      }
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setConversationHistory((prev) => [...prev, userInput]);
    setInput("");

    // 避免重複回答相同的問題
    const userInputLower = userInput.toLowerCase();
    const lastMessages = messages.slice(-3).map((m) => m.content.toLowerCase());
    const isRepeatedQuestion = lastMessages.some((msg) => 
      msg.includes(userInputLower) || userInputLower.includes(msg.substring(0, 20))
    );

    if (isRepeatedQuestion) {
      setTimeout(() => {
        addAssistantMessage("您剛剛已經問過類似的問題了。如果您需要重新開始操作，請告訴我「重新開始」或「重新引導」。或者，您可以告訴我您目前遇到的具體問題，我會協助您解決。");
      }, 500);
      return;
    }

    // 處理導航相關的用戶回應
    if (userInputLower.includes("已到達") || userInputLower.includes("已點擊") || userInputLower.includes("已完成")) {
      setTimeout(() => {
        handleQuickAction(userInput);
      }, 500);
      return;
    }

    // 處理關鍵字匹配
    setTimeout(() => {
      let response = "";
      let shouldNavigate = false;
      let navigatePath = "";
      let nextStep: string | number | null = null;
      let hint: PageHint | null = null;

      if (userRole === "Student") {
        if (userInputLower.includes("新增單字本") || userInputLower.includes("建立單字本") || userInputLower.includes("創建單字本")) {
          nextStep = "create-vocab";
          const stepData = tutorialSteps.find((s) => s.step === nextStep);
          if (stepData) {
            response = stepData.message;
            shouldNavigate = stepData.action === "navigate";
            navigatePath = stepData.path || "";
            hint = stepData.hint || null;
          }
        } else if (userInputLower.includes("單字測驗") || userInputLower.includes("測驗")) {
          nextStep = "test-vocab";
          const stepData = tutorialSteps.find((s) => s.step === nextStep);
          if (stepData) {
            response = stepData.message;
            shouldNavigate = stepData.action === "navigate";
            navigatePath = stepData.path || "";
            hint = stepData.hint || null;
          }
        } else if (userInputLower.includes("重新開始") || userInputLower.includes("重新引導")) {
          setCurrentStep(0);
          response = tutorialSteps[0].message;
          setCurrentHint(null);
        } else {
          response = "我了解您的問題。您可以告訴我：\n1. 「帶領我新增單字本」- 我會實際帶領您完成操作\n2. 「帶領我進行單字測驗」- 我會引導您開始測驗\n3. 或者直接問我任何功能相關的問題\n\n請選擇一個選項！";
        }
      } else if (userRole === "Supplier") {
        if (userInputLower.includes("新增分店") || userInputLower.includes("建立分店")) {
          nextStep = "create-store";
          const stepData = tutorialSteps.find((s) => s.step === nextStep);
          if (stepData) {
            response = stepData.message;
            shouldNavigate = stepData.action === "navigate";
            navigatePath = stepData.path || "";
            hint = stepData.hint || null;
          }
        } else if (userInputLower.includes("發行優惠券") || userInputLower.includes("新增優惠券")) {
          nextStep = "create-coupon";
          const stepData = tutorialSteps.find((s) => s.step === nextStep);
          if (stepData) {
            response = stepData.message;
            shouldNavigate = stepData.action === "navigate";
            navigatePath = stepData.path || "";
            hint = stepData.hint || null;
          }
        } else if (userInputLower.includes("重新開始") || userInputLower.includes("重新引導")) {
          setCurrentStep(0);
          response = tutorialSteps[0].message;
          setCurrentHint(null);
        } else {
          response = "我了解您的問題。您可以告訴我：\n1. 「帶領我新增分店」- 我會實際帶領您完成操作\n2. 「帶領我發行優惠券」- 我會引導您發行優惠券\n3. 或者直接問我任何功能相關的問題\n\n請選擇一個選項！";
        }
      } else {
        response = "歡迎使用 AI 助手！請告訴我您想了解的功能，我會為您詳細說明。";
      }

      if (nextStep) {
        setCurrentStep(nextStep);
      }

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (shouldNavigate && navigatePath) {
        setTimeout(() => {
          router.push(navigatePath);
          if (hint) {
            setTimeout(() => {
              setCurrentHint(hint);
              highlightElement(hint!);
            }, 1000);
          }
        }, 500);
      } else if (hint) {
        setTimeout(() => {
          setCurrentHint(hint);
          highlightElement(hint);
        }, 500);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getCurrentQuickActions = () => {
    if (currentStep !== null) {
      const stepData = tutorialSteps.find((s) => s.step === currentStep);
      if (stepData?.quickActions) {
        return stepData.quickActions;
      }
    }
    // 如果沒有當前步驟，提供通用選項
    if (userRole === "Student") {
      return ["帶領我新增單字本", "帶領我進行單字測驗"];
    } else if (userRole === "Supplier") {
      return ["帶領我新增分店", "帶領我發行優惠券"];
    }
    return [];
  };

  if (!open) {
  return (
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          ...(userRole === "Supplier" || userRole === "Student" 
            ? { left: userRole === "Student" ? 264 : 24 } // Student: drawerWidth(240) + 24, Supplier: 24
            : { right: 24 }),
          zIndex: 1300,
        }}
      >
        <IconButton
        color="primary"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          sx={{
            width: 56,
            height: 56,
            bgcolor: "primary.main",
            color: "white",
            boxShadow: 3,
            "&:hover": {
              bgcolor: "primary.dark",
              boxShadow: 6,
            },
          }}
      >
        <SmartToyIcon />
        </IconButton>
      </Box>
    );
  }

  return (
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          ...(userRole === "Supplier" || userRole === "Student" 
            ? { left: userRole === "Student" ? 264 : 24 } // Student: drawerWidth(240) + 24, Supplier: 24
            : { right: 24 }),
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          height: minimized ? "auto" : 600,
          maxHeight: minimized ? "auto" : "calc(100vh - 48px)",
          zIndex: 1300,
            display: "flex",
            flexDirection: "column",
          boxShadow: 6,
          borderRadius: 2,
          overflowY: "scroll", // 允許整個視窗垂直滾動
          overflowX: "hidden",
          bgcolor: "#2d2d2d", // 深色卡片背景
          border: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.1)",
          // 阻止視窗內事件冒泡到頁面
          pointerEvents: "auto",
          // 為整個視窗添加滾動條樣式
          scrollbarGutter: "stable",
          // 自定義整個視窗的滾動條樣式
          "&::-webkit-scrollbar": {
            width: "12px",
            WebkitAppearance: "none",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "6px",
            border: "2px solid rgba(0, 0, 0, 0.05)",
            minHeight: "30px",
            "&:hover": {
              background: "rgba(0, 0, 0, 0.5)",
            },
            "&:active": {
              background: "rgba(0, 0, 0, 0.6)",
            },
          },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          // 如果滾動發生在整個視窗上（不是在對話內容區域），阻止冒泡
          const target = e.target as HTMLElement;
          const isScrollContainer = target.closest('[style*="overflowY"]') as HTMLElement;
          if (!isScrollContainer || isScrollContainer === target.closest('.MuiCollapse-root')) {
            e.stopPropagation();
          }
        }}
      >
      {/* 標題列 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.5,
          bgcolor: "#4255ff", // Quizlet 藍色
          color: "#ffffff",
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600, color: "#ffffff" }}>
          AI 助手 {userRole === "Student" ? "（學生）" : userRole === "Supplier" ? "（廠商）" : ""}
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={() => setMinimized(!minimized)}
            sx={{ color: "#ffffff" }}
          >
            {minimized ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setOpen(false);
              setMinimized(false);
              setCurrentHint(null);
            }}
            sx={{ color: "#ffffff" }}
          >
              <CloseIcon />
            </IconButton>
          </Box>
      </Box>

      {/* 對話內容 */}
      <Collapse in={!minimized}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0, // 重要：確保 flex 子元素可以正確縮小
          }}
        >
          <Box
            ref={(el: HTMLDivElement | null) => {
              if (el) {
                // 確保滾動條始終可見（在某些瀏覽器中）
                const htmlEl = el as HTMLElement;
                htmlEl.style.scrollbarWidth = "thin";
                htmlEl.style.scrollbarColor = "rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)";
                // 使用 scrollbar-gutter 為滾動條預留空間（如果瀏覽器支援）
                if ('scrollbarGutter' in htmlEl.style) {
                  htmlEl.style.scrollbarGutter = 'stable';
                }
              }
            }}
            sx={{
              flex: 1,
              overflowY: "scroll", // 始終顯示滾動條
              overflowX: "hidden",
              p: 2,
              bgcolor: "#1e1e1e", // 深色背景
              minHeight: 0, // 重要：確保可以正確滾動
              maxHeight: "100%", // 確保不超過父容器
              // 使用 scrollbar-gutter 為滾動條預留空間（如果瀏覽器支援）
              scrollbarGutter: "stable",
              // 自定義滾動條樣式 (WebKit browsers: Chrome, Safari, Edge)
              "&::-webkit-scrollbar": {
                width: "12px", // 增加寬度讓滾動條更明顯
                WebkitAppearance: "none", // 移除默認樣式
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0, 0, 0, 0.1)",
                borderRadius: "6px",
                margin: "4px 0",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "6px",
                border: "2px solid rgba(0, 0, 0, 0.05)",
                minHeight: "30px", // 確保滾動條有最小高度
                "&:hover": {
                  background: "rgba(0, 0, 0, 0.5)",
                },
                "&:active": {
                  background: "rgba(0, 0, 0, 0.6)",
                },
              },
              // Firefox 滾動條樣式
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)",
            }}
            onWheel={(e) => {
              // 阻止滾動事件冒泡到頁面
              e.stopPropagation();
              
              const target = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = target;
              
              // 如果內容不足以滾動，不做任何處理
              if (scrollHeight <= clientHeight) {
                e.preventDefault();
                return;
              }
              
              // 檢查是否到達邊界
              const isAtTop = scrollTop === 0;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
              
              // 如果到達頂部且向上滾動，或到達底部且向下滾動，阻止默認行為
              if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.preventDefault();
              }
            }}
            onTouchStart={(e) => {
              // 記錄觸摸起始位置
              const target = e.currentTarget;
              const touch = e.touches[0];
              (target as any).touchStartY = touch.clientY;
              (target as any).touchStartScrollTop = target.scrollTop;
            }}
            onTouchMove={(e) => {
              // 阻止觸摸滾動事件冒泡到頁面（僅在視窗內滾動時）
              const target = e.currentTarget;
              const touch = e.touches[0];
              const touchStartY = (target as any).touchStartY;
              
              if (touchStartY !== undefined) {
                const deltaY = touch.clientY - touchStartY;
                const { scrollTop, scrollHeight, clientHeight } = target;
                const canScrollUp = scrollTop > 0;
                const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
                
                // 如果視窗內容可以滾動，阻止事件冒泡
                if (scrollHeight > clientHeight) {
                  if ((deltaY > 0 && canScrollUp) || (deltaY < 0 && canScrollDown)) {
                    e.stopPropagation();
                  }
                } else {
                  e.stopPropagation();
                }
              }
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  歡迎使用 AI 助手！我可以實際帶領您完成各種操作。
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: "80%",
                      bgcolor: message.role === "user" ? "#4255ff" : "#2d2d2d", // 用戶訊息用 Quizlet 藍色，助手訊息用深色卡片背景
                      color: message.role === "user" ? "#ffffff" : "#ffffff", // 所有文字都是白色
                      whiteSpace: "pre-line",
                      boxShadow: 1,
                      border: message.role === "assistant" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "#ffffff" }}>
                      {message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}

            {/* 快速操作按鈕 */}
            {getCurrentQuickActions().length > 0 && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {getCurrentQuickActions().map((action, index) => (
                  <Chip
                    key={`quick-action-${currentStep}-${index}-${action}`}
                    label={action}
                    onClick={() => {
                      const userMessage: Message = {
                        id: generateMessageId(),
                        role: "user",
                        content: action,
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, userMessage]);
                      handleQuickAction(action);
                    }}
                    sx={{ 
                      cursor: "pointer", 
                      fontSize: "0.75rem",
                      color: "#ffffff",
                      borderColor: "#4255ff",
                      "&:hover": {
                        bgcolor: "rgba(66, 85, 255, 0.1)",
                        borderColor: "#4255ff",
                      }
                    }}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* 輸入框 */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "rgba(255, 255, 255, 0.1)", bgcolor: "#2d2d2d" }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="輸入訊息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#1e1e1e",
                    color: "#ffffff",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#4255ff",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#ffffff",
                    "&::placeholder": {
                      color: "rgba(255, 255, 255, 0.5)",
                      opacity: 1,
                    },
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim()}
                sx={{ 
                  alignSelf: "flex-end",
                  color: "#4255ff",
                  "&:hover": {
                    bgcolor: "rgba(66, 85, 255, 0.1)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
