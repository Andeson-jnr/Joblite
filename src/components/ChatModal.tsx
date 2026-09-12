import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Wrench, ShieldCheck, Sparkles } from 'lucide-react';
import { Message, Conversation } from '../types';
import { fetchConversations, fetchMessages, sendMessage } from '../lib/api';
import { formatDateTime } from '../lib/utils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  targetUserName?: string;
  targetUserRole?: string;
  bookingRef?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  targetUserName = 'Artisan Pro',
  targetUserRole = 'artisan',
  bookingRef,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations().then((res) => {
        if (res.conversations && res.conversations.length > 0) {
          const conv = res.conversations[0];
          setConversationId(conv.id);
          fetchMessages(conv.id).then((mRes) => {
            if (mRes.messages) setMessages(mRes.messages);
          });
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const res = await sendMessage(conversationId, textToSend);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    'When can you arrive at the location?',
    'I am on my way now.',
    'Could you please share your exact landmark in Makurdi?',
    'Job is completed, kindly inspect!',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[560px]">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {targetUserName[0]}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight flex items-center gap-1.5">
                {targetUserName}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                  {targetUserRole}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Online in Makurdi</span>
                {bookingRef && <span className="font-mono text-slate-400">• Ref: {bookingRef}</span>}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-1.5 text-[11px] text-emerald-800 flex items-center justify-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Keep communications in-app to ensure dispute and escrow protection.</span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
          {messages.map((m) => {
            const isMe = m.senderId === currentUserId;

            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1 shadow-2xs ${
                    isMe
                      ? 'bg-emerald-700 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <div className={`text-[9px] text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(qr);
              }}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-slate-200 text-slate-700 whitespace-nowrap border border-slate-200 transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type a message or discuss arrival..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
