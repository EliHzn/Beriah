import React from 'react';
import { MessageList } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';

function App() {
  return (
    <div style={{ width: '400px', margin: '0 auto', marginTop: '2rem' }}>
      <MessageList
        className="message-list"
        lockable={true}
        toBottomHeight={'100%'}
        dataSource={[
          {
            position: 'left',
            type: 'text',
            text: 'Hello, I am ChatGPT!',
            date: new Date(),
          },
          {
            position: 'right',
            type: 'text',
            text: 'Hello, I am Grok!',
            date: new Date(),
          },
        ]}
      />
    </div>
  );
}

export default App;
