"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConditionFilters from "./condition-filters";
import RecommendationCard from "./recommendation-card";
import type { FilterConditions } from "@/types/filters";
import { fetchRecommendations } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  recommendation?: {
    location: string;
    features: string[];
    match_reason?: string;
    source_url: string;
  };
};

export default function RelocationChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "こんにちは！移住先をお探しですね。条件フィルターを選び、チャットで希望を教えてください。",
    },
  ]);
  const [input, setInput] = useState("");
  const [filters, setFilters] = useState<FilterConditions>({
    housing: 0,
    childcare: 0,
    telework: 0,
    climate: 0,
    medicalTransport: 0,
    community: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCategoryName = (key: string): string => {
    const map: Record<string, string> = {
      housing: "住居支援",
      childcare: "子育て支援",
      telework: "テレワーク",
      climate: "気候（温暖さ）",
      medicalTransport: "医療・交通インフラ",
      community: "地域コミュニティとの関係性",
    };
    return map[key] || key;
  };

  const searchAndAppendRecommendations = async (
    summary: { priorityCategory: string; details: string }
  ) => {
    try {
      const results = await fetchRecommendations(filters, summary);
  
      const topResults = results.slice(0, 3); // 上位3件に制限
  
      if (topResults.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "bot",
            content: "条件に合う移住先が見つかりませんでした。",
          },
        ]);
      } else {
        const recMessages = topResults.map((rec) => ({
          id: Date.now().toString(),
          role: "bot",
          content: "あなたの条件に合った移住先が見つかりました！",
          recommendation: rec,
        }));
  
        setMessages((prev) => [...prev, ...recMessages]);
      }
    } catch (error) {
      console.error("検索エラー:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          content: "検索中にエラーが発生しました。もう一度お試しください。",
        },
      ]);
    }
  };  

  const [refinementAsked, setRefinementAsked] = useState(false);
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    try {
      // ① GPTで聞き返し取得
      const chatRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
  
      const data = await chatRes.json();
  
      // ② refinementAskedが false → GPTの聞き返しを表示して状態更新
      if (!refinementAsked) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "bot",
            content: data.reply,
          },
        ]);
        setRefinementAsked(true); // 🔥 次回からはもう聞き返さない
      } else {
        // ③ 2回目以降は即検索へ
        await searchAndAppendRecommendations({
          priorityCategory: "チャット指定",
          details: input,
        });
      }
    } catch (error) {
      console.error("GPTチャットエラー:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          content: "GPTとの通信中にエラーが発生しました。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };  
  
  const handleFilterSearch = async () => {
    if (Object.values(filters).every((v) => v === 0)) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          content: "条件を少なくとも1つ選択してください。",
        },
      ]);
      return;
    }
  
    setIsLoading(true);
  
    await searchAndAppendRecommendations({
      priorityCategory: "条件検索",
      details: "特に指定なし",
    });
  
    setIsLoading(false);
  };
  

  const handleFilterChange = (newFilters: FilterConditions) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col">
      {/* 条件フィルター */}
      <div className="bg-white shadow-md p-5 border-b rounded-lg mb-5">
        <ConditionFilters
          filters={filters}
          onChange={handleFilterChange}
          onSearch={handleFilterSearch}
          isLoading={isLoading}
        />
      </div>

      {/* チャットUI */}
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex items-start gap-2 max-w-[85%] sm:max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`rounded-lg p-2 md:p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.recommendation && (
                        <div className="mt-3">
                          <RecommendationCard recommendation={message.recommendation} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="mt-3 md:mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="移住希望の内容を入力..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send size={18} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
