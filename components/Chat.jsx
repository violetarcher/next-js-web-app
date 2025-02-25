'use client';
import { useChat } from 'ai/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Chat() {
  const { user, isLoading } = useUser();
  const { messages, input, handleInputChange, handleSubmit, addToolResult } = useChat({
    maxSteps: 5
  });
  return (
    <>
      {messages.map(message => (
        <div key={message.id} className={`${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
          <strong>
            {/* {message.role === 'user' ? 'User' : 'Sales
Assistant'} */}
            {message.role === 'user' ? <img src={user.picture} alt="User" /> : '🤖'}
          </strong>
          {message.parts.map(part => {
            console.log('message', message);
            switch (part.type) {
              // render text parts as simple text:
              case 'text':
                return <ReactMarkdown>{part.text}</ReactMarkdown>;
              // for tool invocations, distinguish between thetools and the state:
              case 'tool-invocation': {
                const callId = part.toolInvocation.toolCallId;
                switch (part.toolInvocation.state) {
                  case 'result':
                    return (
                      <div key={callId}>
                        Tool Invocation:
                        <pre>{JSON.stringify(part.toolInvocation, null, 2)}</pre>
                      </div>
                    );
                }
                break;
              }
            }
          })}
          <br />
        </div>
      ))}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              className="message-input"
              name="prompt"
              placeholder="Ask a question"
              value={input}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit" className="run-button">
            <span>Submit</span>
          </button>
        </form>
      </div>
    </>
  );
}
