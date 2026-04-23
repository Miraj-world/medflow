import { useCallback, useEffect, useRef, useState } from "react";
import chatIcon from "./assets/medflow-ai-icon.png";
import { getAssistantReply } from "../api/assistant";

// Props passed into the chat bubble component
type Props = {
  userName?: string;
};

// Represents a single chat message
type Message = {
  text: string;
  sender: "assistant" | "user";
};

export default function AiChatBubble({ userName }: Props) {
  // Controls whether chat window is open
  const [open, setOpen] = useState(false);

  // Stores all chat messages
  const [messages, setMessages] = useState<Message[]>([]);

  // Stores the current input box value
  const [input, setInput] = useState("");

  // Controls whether the "go to bottom" button is shown
  const [showScrollButton, setShowScrollButton] = useState(false);

  // References for scrolling behavior
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Generates a greeting depending on whether the user is logged in
  const getGreeting = useCallback(() => {
    if (!userName) {
      const msgs = [
        "Hi, I’m the MedFlow assistant. I can answer any questions you may have.",
        "Hello! I’m the MedFlow assistant — feel free to ask me anything.",
        "Hi there, I’m the MedFlow assistant, here to help with any questions.",
        "Welcome! I’m the MedFlow assistant. Let me know if you need anything.",
        "Hi, I’m the MedFlow assistant. I’m here if you have any questions."
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }

    const msgs = [
      `Welcome back, ${userName}. How can I help today?`,
      `Hi ${userName}. What can I help you with?`,
      `Good to see you, ${userName}. Let me know how I can assist.`,
      `Welcome, ${userName}. Feel free to ask anything.`,
      `${userName}, how can I assist you today?`
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [userName]);

  // Runs once when the component loads or when the user changes
  // Opens the chat automatically and adds the first greeting message
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ text: getGreeting(), sender: "assistant" }]);
      setOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [getGreeting]);

  // Auto-scrolls to bottom when new messages arrive,
  // but only if the user is already near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const isNearBottom = distanceFromBottom < 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Checks whether the user is at the bottom of the chat
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const isAtBottom = distanceFromBottom < 50;

    setShowScrollButton(!isAtBottom);
  };

  // Sends the user's message and appends the assistant's reply
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      text: trimmed,
      sender: "user"
    };

    const assistantMessage: Message = {
      text: getAssistantReply(trimmed, !!userName),
      sender: "assistant"
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10
      }}
    >
      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "relative",
            width: 340,
            height: 460,
            background: "#f8f6f1",
            border: "1px solid #d7d3c8",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflowY: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "#31476b",
              color: "white",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>MedFlow Assistant</span>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: 20,
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: 1,
                padding: 0
              }}
            >
              ×
            </button>
          </div>

          {/* Messages area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: msg.sender === "user" ? "#e7a64a" : "#e9eef6",
                  color: "#24344d",
                  fontSize: 14
                }}
              >
                {msg.text}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Go to bottom button */}
          {showScrollButton && (
            <button
              title="Go to bottom of chat"
              onClick={() =>
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                position: "absolute",
                bottom: 72,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "#31476b",
                color: "white",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ↓
            </button>
          )}

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid #ddd6c8",
              padding: 12,
              display: "flex",
              gap: 8,
              background: "#fffdf8"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask a question..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                outline: "none"
              }}
            />

            <button
              onClick={handleSend}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#e7a64a",
                cursor: "pointer"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "none",
          background: "#31476b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          overflow: "hidden",
          padding: 0
        }}
      >
        <img
          src={chatIcon}
          alt="MedFlow Assistant"
          style={{
            width: 52,
            height: 52,
            objectFit: "cover",
            borderRadius: "50%",
            display: "block"
          }}
        />
      </button>
    </div>
  );
}
