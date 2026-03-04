import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { getSocket } from "../utils/socket.js";

export default function Chat() {
  const chatOpen = useGameStore((s) => s.chatOpen);
  const toggleChat = useGameStore((s) => s.toggleChat);
  const chat = useGameStore((s) => s.chat);
  const roomCode = useGameStore((s) => s.roomCode);
  const playerId = useGameStore((s) => s.playerId);

  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 200) return;
    getSocket().emit("chat_message", { roomCode, message: trimmed });
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="fixed bottom-6 right-6 z-30 btn-primary w-12 h-12 flex items-center justify-center rounded-full p-0 shadow-glow-lg"
        onClick={toggleChat}
        title="Toggle Chat"
      >
        <MessageSquare size={20} />
        {chat.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {chat.length > 99 ? "99" : chat.length}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-40 flex flex-col w-80 glass-card rounded-none rounded-l-2xl border-r-0"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-violet-400" /> Chat
              </span>
              <button
                onClick={toggleChat}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 text-sm">
              {chat.length === 0 && (
                <p className="text-white/30 text-center mt-8">
                  No messages yet…
                </p>
              )}
              {chat.map((msg, i) => {
                const isMe = msg.senderId === playerId;
                return (
                  <motion.div
                    key={i}
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? "self-end bg-violet-600/40 text-violet-100 rounded-br-none"
                        : "self-start bg-white/8 text-white/80 rounded-bl-none"
                    }`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!isMe && (
                      <div className="text-violet-400 text-xs font-medium mb-0.5">
                        {msg.senderName}
                      </div>
                    )}
                    {msg.message}
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                className="glass-input flex-1 py-2 text-sm"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                maxLength={200}
              />
              <button
                className="btn-primary px-3 py-2 rounded-xl"
                onClick={send}
                disabled={!text.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
