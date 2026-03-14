import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { getSocket } from "../utils/socket.js";

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
      <button
        className="fixed bottom-5 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 shadow-[0_26px_60px_-24px_rgba(34,211,238,0.78)] transition-transform duration-200 hover:scale-105 sm:bottom-6 sm:right-6"
        onClick={toggleChat}
        title="Toggle Chat"
      >
        <MessageSquare size={20} />
        {chat.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white dark:bg-white dark:text-slate-950">
            {chat.length > 99 ? "99" : chat.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleChat}
            />
            <motion.aside
              className="fixed bottom-0 right-0 top-0 z-40 flex w-full max-w-[390px] flex-col border-l border-white/10 bg-white/90 shadow-[0_0_80px_-30px_rgba(15,23,42,0.95)] backdrop-blur-2xl dark:bg-slate-950/[0.94]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className="border-b border-gray-200/80 p-5 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/38">
                      Room Chat
                    </p>
                    <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                      <MessageSquare size={16} className="text-cyan-300" /> Team
                      comms
                    </h2>
                  </div>
                  <button
                    onClick={toggleChat}
                    className="rounded-2xl border border-gray-200 bg-white/80 p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/45 dark:hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5 text-sm">
                <div className="flex flex-col gap-3">
                  {chat.length === 0 && (
                    <div className="rounded-[24px] border border-dashed border-gray-300/80 bg-white/65 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/38">
                      No chat yet. Use this panel for callouts, bluffing, or
                      bonus-tile warnings.
                    </div>
                  )}
                  {chat.map((msg, i) => {
                    const isMe = msg.senderId === playerId;
                    return (
                      <motion.div
                        key={i}
                        className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm ${
                          isMe
                            ? "self-end rounded-br-md bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950"
                            : "self-start rounded-bl-md border border-gray-200/80 bg-white/80 text-slate-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/82"
                        }`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {!isMe && (
                          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            {msg.senderName}
                          </div>
                        )}
                        <div className="leading-6">{msg.message}</div>
                        <div
                          className={`mt-2 text-[10px] font-medium uppercase tracking-[0.18em] ${
                            isMe
                              ? "text-slate-950/70"
                              : "text-slate-500 dark:text-white/35"
                          }`}
                        >
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="border-t border-gray-200/80 p-4 dark:border-white/10">
                <div className="flex gap-2">
                  <input
                    className="glass-input flex-1 py-3 text-sm"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKey}
                    maxLength={200}
                  />
                  <button
                    className="btn-primary rounded-2xl px-4 py-3"
                    onClick={send}
                    disabled={!text.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
