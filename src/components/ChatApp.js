import React, { useState, useRef , useCallback } from 'react';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  fontFamily: 'inherit',  // Sử dụng font hiện tại của ứng dụng
  '& .rce-input': {
    lineHeight: '1.5',
    minHeight: '40px',
    maxHeight: '100px',
    overflowY: 'auto',  // Cho phép cuộn dọc khi cần
    resize: 'none',     // Không cho phép người dùng thay đổi kích thước
    whiteSpace: 'pre-wrap',  // Đảm bảo xuống dòng tự động khi nội dung quá dài
    fontFamily: 'inherit',  // Sử dụng font hiện tại của ứng dụng
    scrollbarWidth: 'none',  // Ẩn thanh cuộn trên Firefox
    '&::-webkit-scrollbar': {
      display: 'none',  // Ẩn thanh cuộn trên Chrome, Safari, và Edge
    },
  },
  '&:hover': {
    backgroundColor: '#f0faff',
  },
  '&:focus': {
    backgroundColor: '#e1f5fe',
  },
});


const ChatBubble = styled(({ isUser, ...rest }) => <motion.div {...rest} />)(({ isUser }) => ({
  maxWidth: '80%',
  padding: '0px 12px',
  borderRadius: '18px',
  marginBottom: '5px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    marginTop: '0.5em',
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
    color:"white",
    wordWrap: 'break-word',
  },
});

function ChatApp() {
  console.log('rerender')
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  


  const handleSendMessage = useCallback(async () => {
  console.log('rerender handleSendMessage')
    if (inputMessage.trim() !== '') {
      const userMessage = {
        position: 'right',
        type: 'text',
        text: inputMessage,
        date: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');

      setTimeout(scrollToBottom, 100);

      let botMessage = { position: 'left', type: 'text', text: '' };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      try {
        const onStreamUpdate = (partialMessage) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1].text = partialMessage;
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
        setMessages(prevMessages =>
          prevMessages.filter(msg => msg !== botMessage).concat({
            position: 'left',
            type: 'text',
            text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
            date: new Date(),
          })
        );
      }
    }
  }, [inputMessage, chatHistory]);



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
  }

  const renderMessageContent = useCallback((message) => {
    return <MessageContent message={message} />;
  }, []);


  const formatMessageDate = (date) => {
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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
                    rows={1}
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
