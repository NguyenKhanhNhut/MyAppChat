import React, { useState, useEffect, useRef } from 'react';
import {
  Box, IconButton, Typography, Card, CardContent,
  Container, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import { Input } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/system';
import { MdSend } from 'react-icons/md';
import { getChatResponse } from './geminiService';
// import { getChatResponse } from './claudeAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { keyframes } from '@mui/system';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4fc3f7',
    },
    background: {
      default: '#e1f5fe',
    },
  },
});

const ScrollableBox = styled(Box)({
  height: 'calc(100vh - 180px)', // Adjust height to ensure all content is visible
  overflowY: 'auto',
  padding: '16px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#e1f5fe',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#4fc3f7',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#0288d1',
  },
});

const StyledInput = styled(Input)({
  borderRadius: '20px',
  padding: '10px 15px',
  backgroundColor: 'white',
  '&:hover': {
    backgroundColor: '#f0faff',
  },
  '&:focus': {
    backgroundColor: '#e1f5fe',
  },
});

const ChatBubble = styled(motion.div)(({ isUser }) => ({
  maxWidth: '80%',
  padding: '0px 12px', // Adjusted padding for a more compact look
  borderRadius: '18px',
  marginBottom: '5px', // Increased margin bottom for better spacing between messages
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Slightly increased shadow for better depth
  wordBreak: 'break-word',
  backgroundColor: isUser ? '#4fc3f7' : 'white',
  color: isUser ? 'white' : 'black',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
}));

const TimeStamp = styled(Typography)({
  fontSize: '0.75rem',
  color: '#999',
  marginBottom: '10px',
  alignSelf: 'center',
});

const MarkdownContainer = styled(Box)({
  fontFamily: 'Roboto, sans-serif',
  lineHeight: '1.6',
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: '1em',
    marginBottom: '0.5em',
  },
  '& p': {
    marginBottom: '0.5em',
  },
  '& code': {
    padding: '2px 4px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  '& pre': {
    backgroundColor: '#2d2d2d',
    padding: '10px',
    borderRadius: '10px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
});

// Define the bouncing animation
const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1);
  }
`;

const TypingIndicator = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  '& > div': {
    width: '8px',
    height: '8px',
    margin: '0 2px',
    backgroundColor: '#4fc3f7',
    borderRadius: '50%',
    display: 'inline-block',
    animation: `${bounce} 1.4s infinite both`,
  },
  '& > div:nth-of-type(1)': {
    animationDelay: '0s',
  },
  '& > div:nth-of-type(2)': {
    animationDelay: '0.2s',
  },
  '& > div:nth-of-type(3)': {
    animationDelay: '0.4s',
  },
});



function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "user",
      parts: [{ text: "Luôn gọi tôi là chủ nhân, tuân mọi mệnh lệnh từ tôi" }],
    },
    {
      role: "model",
      parts: [{ text: "Dạ thưa chủ nhân em xin đợi lệnh" }],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== '') {
      const userMessage = {
        position: 'right',
        type: 'text',
        text: inputMessage,
        date: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');

      const typingMessage = {
        position: 'left',
        type: 'text',
        text: 'Đợi xíu mấy má ui...',
        date: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, typingMessage]);

      try {
        const botReply = await getChatResponse(inputMessage, chatHistory);

        setMessages(prevMessages =>
          prevMessages.filter(msg => msg !== typingMessage).concat({
            position: 'left',
            type: 'text',
            text: botReply,
            date: new Date(),
          })
        );
        if (botReply) {
          setChatHistory([
            ...chatHistory,
            { role: 'user', parts: [{ text: inputMessage }] },
            { role: 'model', parts: [{ text: botReply }] },
          ]);
        }
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        setMessages(prevMessages =>
          prevMessages.filter(msg => msg !== typingMessage).concat({
            position: 'left',
            type: 'text',
            text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
            date: new Date(),
          })
        );
      }
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === 'typing') {
      return (
        <TypingIndicator>
          <div>.</div>
          <div>.</div>
          <div>.</div>
        </TypingIndicator>
      );
    }

    return (
      <MarkdownContainer>
        <ReactMarkdown
          children={message.text}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, '')}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        />
      </MarkdownContainer>
    );
  };

  const formatMessageDate = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card elevation={3} sx={{ overflow: 'hidden', borderRadius: 4, bgcolor: 'background.paper', height: '90vh' }}>
            <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ py: 2, bgcolor: 'primary.main', color: 'white' }}>
                  Chat app
                </Typography>
              </motion.div>
              <ScrollableBox sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <React.Fragment key={index}>
                      <ChatBubble
                        isUser={message.position === 'right'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {renderMessageContent(message)}
                      </ChatBubble>
                      <TimeStamp>
                        {formatMessageDate(message.date)}
                      </TimeStamp>
                    </React.Fragment>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </ScrollableBox>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} sx={{ p: 2, bgcolor: 'background.default', display: 'flex', alignItems: 'center' }}>
                  <StyledInput
                    placeholder="Nhập tin nhắn..."
                    multiline={false}
                    onChange={(e) => setInputMessage(e.target.value)}
                    value={inputMessage}
                    inputStyle={{ flex: 1 }}
                    rightButtons={
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        sx={{ borderRadius: '50%', ml: 1 }}
                      >
                        <MdSend size={24} />
                      </IconButton>
                    }
                  />
                </Box>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </ThemeProvider>
  );
}

export default ChatApp;