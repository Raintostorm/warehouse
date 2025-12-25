import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { chatbotAPI } from '../../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Custom Chatbot Component - Chatbot riêng biệt với khả năng thực hiện actions
 * 
 * Features:
 * - Giao diện riêng biệt (purple/indigo theme)
 * - Floating button hoặc sidebar integration
 * - Message history với memory
 * - Action results display
 * - Dark/Light theme support
 */
const CustomChatbot = () => {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check chatbot availability on mount
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
            const response = await chatbotAPI.getStatus();
            const available = response.data?.available || false;
            const aiEnabled = response.data?.aiEnabled || false;
            
            setIsAvailable(available);
            setIsAIEnabled(aiEnabled);

            if (available) {
                // Add welcome message based on AI status
                const welcomeMessage = aiEnabled
                    ? '🤖 Xin chào! Tôi là AI Chatbot của hệ thống (Hybrid Mode: AI + Rule-based).\n\nTôi có thể:\n\n• Tìm kiếm sản phẩm\n• Tạo đơn hàng\n• Kiểm tra tồn kho\n• Xem thống kê\n• Hiểu ngôn ngữ tự nhiên\n• Thực hiện nhiều actions khác\n\nHãy thử: "Giúp tôi" để xem danh sách đầy đủ!'
                    : '🤖 Xin chào! Tôi là Custom Chatbot của hệ thống.\n\nTôi có thể:\n\n• Tìm kiếm sản phẩm\n• Tạo đơn hàng\n• Kiểm tra tồn kho\n• Xem thống kê\n• Thực hiện nhiều actions khác\n\n💡 Tip: Thêm GEMINI_API_KEY để bật AI mode!\n\nHãy thử: "Giúp tôi" để xem danh sách đầy đủ!';
                
                setMessages([{
                    role: 'assistant',
                    content: welcomeMessage
                }]);
            }
        } catch (error) {
            console.error('Failed to check chatbot availability', error);
            setIsAvailable(false);
            setIsAIEnabled(false);
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
            // Prepare conversation history (last 20 messages)
            const conversationHistory = messages.slice(-20).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await chatbotAPI.chat(userMessage, conversationHistory);

            if (response.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.message,
                    timestamp: new Date(),
                    type: response.data.type,
                    action: response.data.action,
                    data: response.data.data,
                    count: response.data.count,
                    method: response.data.method,
                    confidence: response.data.confidence
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Show success toast for actions
                if (response.data.type === 'action' && response.data.action) {
                    const methodText = response.data.method === 'AI' ? ' (AI)' : '';
                    showToast(`Đã thực hiện: ${response.data.action}${methodText}`, 'success');
                }
            } else {
                throw new Error(response.message || 'Failed to get chatbot response');
            }
        } catch (error) {
            // Only log in development
            if (import.meta.env.DEV) {
                console.error('Chatbot error', error);
            }

            const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối với chatbot. Vui lòng thử lại sau.';
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

    // Theme colors - Purple/Indigo theme (different from AIChat's blue)
    const chatBg = isDark ? 'rgba(30, 27, 75, 0.98)' : 'white';
    const headerBg = isDark
        ? 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
        : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)';
    const borderColor = isDark ? '#5b21b6' : '#c4b5fd';
    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const userMessageBg = isDark ? '#5b21b6' : '#7c3aed';
    const assistantMessageBg = isDark ? '#1e1b4b' : '#f3f4f6';
    const inputBg = isDark ? '#1e1b4b' : '#f8fafc';
    const buttonBg = isDark ? '#6d28d9' : '#7c3aed';
    const buttonHover = isDark ? '#5b21b6' : '#6d28d9';

    // Render action data if available
    const renderActionData = (message) => {
        if (!message.data || !Array.isArray(message.data)) return null;

        const data = message.data;
        const count = message.count || data.length;

        if (count === 0) return null;

        return (
            <div style={{
                marginTop: '12px',
                padding: '12px',
                background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: textColor }}>
                    Kết quả ({count}):
                </div>
                {data.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{
                        padding: '8px',
                        marginBottom: '4px',
                        background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: textColor
                    }}>
                        {item.name || item.id || item.Id || JSON.stringify(item).substring(0, 50)}
                    </div>
                ))}
                {count > 5 && (
                    <div style={{ fontSize: '11px', color: isDark ? '#a5b4fc' : '#6d28d9', marginTop: '4px' }}>
                        ... và {count - 5} kết quả khác
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '100px', // Position above AIChat
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: buttonBg,
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                    fontSize: '28px'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.background = buttonHover;
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = buttonBg;
                }}
                title="Mở Custom Chatbot"
            >
                🤖
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '420px',
                maxWidth: 'calc(100vw - 48px)',
                height: '650px',
                maxHeight: 'calc(100vh - 48px)',
                background: chatBg,
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                border: `2px solid ${borderColor}`,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: headerBg,
                    padding: '18px 24px',
                    borderBottom: `2px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px' }}>🤖</div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '18px' }}>
                            Custom Chatbot
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                            {isAvailable 
                                ? (isAIEnabled ? '🤖 AI Mode (Hybrid)' : '⚙️ Rule-based Mode')
                                : 'Không khả dụng'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {messages.length > 1 && (
                        <button
                            onClick={handleClearChat}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                            title="Xóa lịch sử"
                        >
                            Xóa
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px'
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
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
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
                                maxWidth: '85%',
                                padding: '14px 18px',
                                borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: message.role === 'user' ? userMessageBg : assistantMessageBg,
                                color: message.role === 'user' ? 'white' : textColor,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                border: message.isError ? `2px solid ${isDark ? '#ef4444' : '#dc2626'}` : 'none',
                                boxShadow: message.role === 'user' 
                                    ? '0 2px 8px rgba(124, 58, 237, 0.3)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {message.content}
                            {renderActionData(message)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div
                            style={{
                                padding: '14px 18px',
                                borderRadius: '18px 18px 18px 4px',
                                background: assistantMessageBg,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <LoadingSpinner size={18} />
                            <span style={{ color: textColor, fontSize: '14px' }}>Đang xử lý...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {isAvailable ? (
                <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: `2px solid ${borderColor}`, background: isDark ? '#1e1b4b' : '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Nhập lệnh hoặc câu hỏi..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: `2px solid ${borderColor}`,
                                background: inputBg,
                                color: textColor,
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = buttonBg;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = borderColor;
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || isLoading}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: buttonBg,
                                color: 'white',
                                cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                opacity: inputMessage.trim() && !isLoading ? 1 : 0.5,
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (inputMessage.trim() && !isLoading) {
                                    e.target.style.background = buttonHover;
                                    e.target.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = buttonBg;
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            Gửi
                        </button>
                    </div>
                </form>
            ) : (
                <div
                    style={{
                        padding: '20px',
                        borderTop: `2px solid ${borderColor}`,
                        textAlign: 'center',
                        color: isDark ? '#a5b4fc' : '#6d28d9',
                        fontSize: '13px',
                        background: isDark ? '#1e1b4b' : '#f8fafc'
                    }}
                >
                    Custom Chatbot chưa sẵn sàng. Vui lòng thử lại sau.
                </div>
            )}
        </div>
    );
};

export default CustomChatbot;

