import React, { useState, useRef, useCallback } from 'react';
import {
  Box, IconButton, Typography, ThemeProvider, createTheme, CssBaseline,Container
} from '@mui/material';
import { Input } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/system';
import { MdSend } from 'react-icons/md';
import { getChatResponse } from './geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const theme = createTheme({
  palette: {
    primary: {
      main: '#A3D8F4', // Pastel Blue
    },
    secondary: {
      main: '#F4A3C4', // Pastel Pink
    },
    background: {
      default: '#F2F2F2', // Light Gray Background
      paper: '#FFF1E6',   // Pastel Peach for input backgrounds
    },
    text: {
      primary: '#4C4C4C', // Soft Black for text
    },
  },
  typography: {
    fontFamily: '"Fira Code, monospace"',
  },
});

const ScrollableBox = styled(Box)({
  height: 'calc(100vh - 80px)', // Adjusted height
  overflowY: 'auto',
  padding: '16px',
  scrollbarWidth: 'none', // Hide scrollbar on Firefox
  '&::-webkit-scrollbar': {
    display: 'none', // Hide scrollbar on Chrome, Safari, and Edge
  },
});

const StyledInput = styled(Input)({
  borderRadius: '50px', // Full-rounded input
  padding: '10px 15px',
  backgroundColor: '#D3D3D3',
  color: '#ffffff',
  '& .rce-input': {
    backgroundColor: '#D3D3D3',
    lineHeight: '1.5',
    minHeight: '40px',
    maxHeight: '100px',
    overflowY: 'auto',
    resize: 'none',
    whiteSpace: 'pre-wrap',
    color: '#666666',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  '&:hover': {
    // backgroundColor: '#512da8',
  },
  '&:focus': {
    backgroundColor: '#673ab7',
  },
  '&::placeholder': {
    color: '#bdbdbd',
  },
});

const ChatBubble = styled(({ isUser, ...rest }) => <motion.div {...rest} />)(({ isUser }) => ({
  maxWidth: '100%',
  padding: '10px 20px',
  borderRadius: '20px',
  marginBottom: '10px',
  wordBreak: 'break-word',
  backgroundColor: isUser ? '#C1E1C1' : '#F8D7A3', // Pastel Green for user, Pastel Yellow for bot
  color: '#4C4C4C', // Soft Black for text in bubbles
  alignSelf: isUser ? 'flex-end' : 'flex-start',
}));
//example typescript with generic
const TimeStamp = styled(Typography)({
  fontSize: '0.75rem',
  color: '#bdbdbd',
  marginBottom: '10px',
  alignSelf: 'center',
});

const MarkdownContainer = styled(Box)({
  fontFamily: "Fira Code, monospace",
  lineHeight: '1.6',
  color: '#666666',
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: '1em',
    marginBottom: '0.5em',
  },
  '& p': {
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  '& code': {
    padding: '2px 4px',
    borderRadius: '4px',
  },
  '& pre': {
    backgroundColor: '#2d2d2d',
    padding: '10px',
    borderRadius: '10px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    color:"white",
    wordWrap: 'break-word',
  },
});

const formatMessageDate = (date) => {
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
};

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const inputMessageRef = useRef();
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = useCallback(async () => {
    const inputMessage = inputMessageRef.current.value;

    if (inputMessage.trim() !== '') {
      const userMessage = {
        position: 'right',
        type: 'text',
        text: inputMessage,
        date: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, userMessage]);
      inputMessageRef.current.value = '';

      setTimeout(scrollToBottom, 100);

      let botMessage = { position: 'left', type: 'text', text: 'Vui lòng chờ em xíu.' };
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(prevMessages => [...prevMessages, botMessage]);
      scrollToBottom()

      try {
        const onStreamUpdate = (partialMessage) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1].text = partialMessage;
            // scrollToBottom()
            return updatedMessages;
          });
        };

        const fullResponse = await getChatResponse(inputMessage, chatHistory, onStreamUpdate);

        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = {
            ...updatedMessages[updatedMessages.length - 1],
            text: fullResponse,
            date: new Date(),
          };
          return updatedMessages;
        });

        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          { role: 'user', parts: [{ text: inputMessage }] },
          { role: 'model', parts: [{ text: fullResponse }] },
        ]);
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
      }
    }
  }, [chatHistory]);

  const CodeBlock = React.memo(({ inline, className, children, ...props }) => {
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
  });

  const MessageContent = ({ message }) => {
    return (
      <MarkdownContainer>
        <ReactMarkdown
          children={message.text}
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock
          }}
        />
      </MarkdownContainer>
    );
  };

  const renderMessageContent = useCallback((message) => {
    return <MessageContent message={message} />;
  }, []);
 
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <StyledInput
            placeholder="Nhập tin nhắn..."
            multiline={true}
            rows={1}
            referance={inputMessageRef}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleSendMessage();
              }
            }}
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
      </Container>
    </ThemeProvider>
  );
}

export default ChatApp;
