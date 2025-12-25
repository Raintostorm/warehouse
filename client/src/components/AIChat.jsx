import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { aiAPI } from '../../services/api';
// Icons will be used inline
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * AI Chat Component - Floating chat widget với Gemini AI
 * 
 * Features:
 * - Floating button để mở/đóng chat
 * - Conversation history
 * - Context-aware responses
 * - Dark/Light theme support
 */
const AIChat = () => {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check AI availability on mount
    useEffect(() => {
        checkAvailability();
    }, []);

    // Auto scroll to bottom when new message arrives
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const checkAvailability = async () => {
        try {
            const response = await aiAPI.getStatus();
            setIsAvailable(response.data?.available || false);

            if (response.data?.available) {
                // Add welcome message
                setMessages([{
                    role: 'assistant',
                    content: 'Xin chào! Tôi là AI Assistant của hệ thống quản lý kho hàng. Tôi có thể giúp bạn:\n\n• Trả lời câu hỏi về hệ thống\n• Phân tích dữ liệu và đưa ra insights\n• Hướng dẫn sử dụng các tính năng\n• Gợi ý các hành động cần thiết\n\nHãy hỏi tôi bất cứ điều gì!'
                }]);
            }
        } catch (error) {
            console.error('Failed to check AI availability', error);
            setIsAvailable(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim() || isLoading || !isAvailable) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        // Add user message to chat
        const newUserMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            // Prepare conversation history (last 10 messages)
            const conversationHistory = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await aiAPI.chat(userMessage, conversationHistory);

            if (response.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.message,
                    timestamp: new Date(),
                    context: response.data.context
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(response.message || 'Failed to get AI response');
            }
        } catch (error) {
            // Only log in development
            if (import.meta.env.DEV) {
                console.error('AI chat error', error);
            }

            const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối với AI. Vui lòng thử lại sau.';
            showToast(errorMessage, 'error');

            // Add error message to chat
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        if (confirm('Bạn có chắc muốn xóa lịch sử chat?')) {
            setMessages([]);
            checkAvailability(); // Reset welcome message
        }
    };

    // Theme colors
    const chatBg = isDark ? 'rgba(30, 41, 59, 0.98)' : 'white';
    const headerBg = isDark
        ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';
    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const userMessageBg = isDark ? '#334155' : '#3b82f6';
    const assistantMessageBg = isDark ? '#1e293b' : '#f1f5f9';
    const inputBg = isDark ? '#1e293b' : '#f8fafc';
    const buttonBg = isDark ? '#475569' : '#3b82f6';
    const buttonHover = isDark ? '#334155' : '#2563eb';

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: buttonBg,
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                    fontSize: '24px'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.background = buttonHover;
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = buttonBg;
                }}
                title="Mở AI Assistant"
            >
                💬
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '400px',
                maxWidth: 'calc(100vw - 48px)',
                height: '600px',
                maxHeight: 'calc(100vh - 48px)',
                background: chatBg,
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                border: `1px solid ${borderColor}`,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: headerBg,
                    padding: '16px 20px',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🤖</div>
                    <div>
                        <div style={{ fontWeight: 600, color: textColor, fontSize: '16px' }}>
                            AI Assistant
                        </div>
                        <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                            {isAvailable ? 'Đang hoạt động' : 'Không khả dụng'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {messages.length > 1 && (
                        <button
                            onClick={handleClearChat}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: textColor,
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}
                            title="Xóa lịch sử"
                        >
                            Xóa
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: textColor,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}
            >
                {messages.map((message, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '8px'
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '80%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: message.role === 'user' ? userMessageBg : assistantMessageBg,
                                color: message.role === 'user' ? 'white' : textColor,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                border: message.isError ? `1px solid ${isDark ? '#ef4444' : '#dc2626'}` : 'none'
                            }}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: assistantMessageBg,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <LoadingSpinner size={16} />
                            <span style={{ color: textColor, fontSize: '14px' }}>Đang suy nghĩ...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {isAvailable ? (
                <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Nhập câu hỏi của bạn..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: `1px solid ${borderColor}`,
                                background: inputBg,
                                color: textColor,
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || isLoading}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: buttonBg,
                                color: 'white',
                                cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                opacity: inputMessage.trim() && !isLoading ? 1 : 0.5,
                                fontWeight: 500,
                                fontSize: '14px'
                            }}
                        >
                            Gửi
                        </button>
                    </div>
                </form>
            ) : (
                <div
                    style={{
                        padding: '16px',
                        borderTop: `1px solid ${borderColor}`,
                        textAlign: 'center',
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: '12px'
                    }}
                >
                    AI Assistant chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào server/.env
                </div>
            )}
        </div>
    );
};

export default AIChat;
