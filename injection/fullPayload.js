(() => {
    // Cleanup any existing connections from previous runs
    if (window.cursorObserver) {
      console.warn('🧹 Cleaning up previous observer...');
      window.cursorObserver.disconnect();
      window.cursorObserver = null;
    }
    if (window.cursorWebSocket) {
      console.warn('🧹 Closing previous WebSocket...');
      window.cursorWebSocket.close();
      window.cursorWebSocket = null;
    }
    
    // Clear console for fresh start
    console.clear();
    
    /** Configuration */
    const RELAY_CONFIG = {
      serverUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000',
      sessionId: window.CURSOR_SESSION_ID || 'cursor-desktop-session',
      enabled: true
    };
    
    // Allow external config
    window.configureCursorRelay = (config) => {
      Object.assign(RELAY_CONFIG, config);
      console.warn('🔧 Relay config updated:', RELAY_CONFIG);
    };
    
    /** Utility: decode HTML entities safely */
    function decodeHtml(html) {
      // Manual entity decoding to avoid Trusted Types issues
      const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
        '&nbsp;': ' ',
        '&#x2F;': '/'
      };
      
      let decoded = html;
      for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
      }
      
      // Decode numeric entities like &#123;
      decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
      decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
      
      return decoded;
    }
  
    /** Extract text for a single markdown section */
    function sectionText(section) {
      try {
        // prefer raw markdown attribute if it has useful content
        const raw = (section.getAttribute('data-markdown-raw') || '').trim();
        if (raw && raw.replace(/\s+/g, '') !== '') return decodeHtml(raw);
  
        // if this section contains a composer code block, extract code lines
        const codeOuter = section.querySelector('.markdown-code-outer-container, .composer-code-block-container, .composer-code-block-content');
        if (codeOuter) {
          // try grab editor view-lines if present (monaco)
          const viewLines = codeOuter.querySelectorAll('.view-lines .view-line');
          if (viewLines && viewLines.length) {
            return Array.from(viewLines).map(v => v.innerText.replace(/\u00A0/g,' ')).join('\n');
          }
          // fallback: innerText of the code outer
          return codeOuter.innerText.trim();
        }
  
        // otherwise use the visible text (spans etc.)
        return section.innerText.trim();
      } catch (e) {
        return section.innerText ? section.innerText.trim() : '';
      }
    }
  
    /** Extract code blocks from bubble */
    function extractCodeBlocks(bubble) {
      const codeBlocks = [];
      const containers = bubble.querySelectorAll('.composer-code-block-container');
      
      containers.forEach(container => {
        // Get filename
        const filenameEl = container.querySelector('.composer-code-block-filename');
        const filename = filenameEl ? filenameEl.textContent.trim() : 'untitled';
        
        // Get code content from Monaco editor
        const viewLines = container.querySelectorAll('.view-lines .view-line');
        let code = '';
        
        if (viewLines && viewLines.length) {
          // Extract from all Monaco editors (original and modified for diffs)
          const editors = container.querySelectorAll('.monaco-editor');
          editors.forEach(editor => {
            const lines = editor.querySelectorAll('.view-lines .view-line');
            if (lines.length) {
              const editorCode = Array.from(lines)
                .map(line => line.innerText.replace(/\u00A0/g, ' '))
                .filter(line => line.trim())
                .join('\n');
              if (editorCode) {
                code += (code ? '\n---\n' : '') + editorCode;
              }
            }
          });
        }
        
        if (code) {
          codeBlocks.push({ type: 'code', filename, code });
        }
      });
      
      return codeBlocks;
    }
  
    /** Check if message is from assistant (not user) */
    function isAssistantMessage(bubble) {
      // Check if this bubble contains markdown sections (assistant messages usually have these)
      const hasMarkdown = bubble.querySelector('.anysphere-markdown-container-root, section.markdown-section, .markdown-section');
      
      // Check if it's NOT a user input (user messages typically don't have these structures)
      const isUserInput = bubble.querySelector('.aislash-editor-input, [contenteditable="true"]');
      
      // Assistant messages typically have markdown rendering, user messages don't
      return hasMarkdown && !isUserInput;
    }
  
    /** Extract message data from a bubble element */
    function extractMessage(bubble) {
      const id = bubble.id || null;
      const index = bubble.getAttribute('data-message-index') || null;
  
      // find markdown sections inside this bubble
      const container = bubble.querySelector('.anysphere-markdown-container-root') || bubble;
      const sections = Array.from(container.querySelectorAll('section.markdown-section, .markdown-section'));
  
      // build text by joining sectionText with double newline between logical sections
      const pieces = sections.length ? sections.map(sectionText).filter(Boolean) : [ (bubble.innerText||'').trim() ];
      const text = pieces.join('\n\n').trim();
      
      // Extract code blocks separately
      const codeBlocks = extractCodeBlocks(bubble);
  
      return { 
        id, 
        index, 
        text, 
        codeBlocks,
        isAssistant: isAssistantMessage(bubble),
        timestamp: Date.now() 
      };
    }
    
    /** Inject text into Cursor and send */
    async function injectAndSend(newText) {
      const el = document.querySelector('.aislash-editor-input');
      if (!el) {
        throw new Error('Could not find Cursor input element');
      }
      
      el.focus();
    
      // Select all contents
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    
      // Fire a genuine delete
      el.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'deleteByCut',
        data: null,
        bubbles: true,
        cancelable: true,
      }));
    
      // Now insert new text
      el.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: newText,
        bubbles: true,
        cancelable: true,
      }));
    
      await new Promise(resolve => setTimeout(resolve, 500));
    
      const btn = document.querySelector('div.anysphere-icon-button[data-mode="agent"][data-outlined="true"]');
      if (!btn) {
        throw new Error('Could not find send button');
      }
      btn.click();
    }
  
    /** Initial scan - collect all existing messages */
    const bubbles = Array.from(document.querySelectorAll('[data-message-index]'));
    const allMessages = bubbles.map(extractMessage);
    
    // Filter to only assistant messages for our collection
    const messages = allMessages.filter(m => m.isAssistant);
    
    // Track seen messages by index to avoid duplicates (including user messages)
    const seenIndices = new Set(allMessages.map(m => m.index).filter(Boolean));
  
    // show initial messages in console
    console.warn(`🚀 Cursor Mobile: found ${messages.length} assistant message(s) (${allMessages.length} total)`);
  
    // expose for later use
    window.cursorMessages = messages;
  
    /** Track active prompts waiting for responses */
    const activePrompts = new Map(); // client_msg_id -> { prompt, resolve, reject, startTime }
    
    /** Track message polling intervals */
    const pollingIntervals = new Map();
    const lastMessageContent = new Map();
    
    function startPollingMessage(bubble, clientMsgId) {
      const index = bubble.getAttribute('data-message-index');
      
      // Clear existing interval if any
      if (pollingIntervals.has(index)) {
        clearInterval(pollingIntervals.get(index));
      }
      
      const interval = setInterval(() => {
        const msg = extractMessage(bubble);
        const currentContent = JSON.stringify({ text: msg.text, codeBlocks: msg.codeBlocks });
        const lastContent = lastMessageContent.get(index);
        
        if (lastContent === currentContent) {
          // Content hasn't changed - it's done streaming
          clearInterval(interval);
          pollingIntervals.delete(index);
          lastMessageContent.delete(index);
          
          // Double-check this is an assistant message
          if (!msg.isAssistant) {
            console.warn(`⏭️  Skipping completed user message [${msg.index}]`);
            return;
          }
          
          // Update final message in array
          const idx = window.cursorMessages.findIndex(m => m.index === index);
          if (idx !== -1) {
            window.cursorMessages[idx] = msg;
          } else {
            window.cursorMessages.push(msg);
          }
          
          console.warn(`🔔 NEW MESSAGE [${msg.index}]:`);
          if (msg.text) {
            console.warn(msg.text);
          }
          if (msg.codeBlocks && msg.codeBlocks.length) {
            msg.codeBlocks.forEach(block => {
              console.warn(`📄 CODE BLOCK: ${block.filename}`);
              console.warn(block.code);
            });
          }
          if (!msg.text && (!msg.codeBlocks || !msg.codeBlocks.length)) {
            console.warn('(empty)');
          }
          
          // Send via WebSocket if connected (only assistant messages)
          sendMessageViaWS(msg, clientMsgId);
          
          // Resolve active prompt if this was a response to one
          if (clientMsgId && activePrompts.has(clientMsgId)) {
            const promptData = activePrompts.get(clientMsgId);
            activePrompts.delete(clientMsgId);
            promptData.resolve(msg);
          }
        } else {
          // Content changed - keep polling
          lastMessageContent.set(index, currentContent);
        }
      }, 2000);
      
      pollingIntervals.set(index, interval);
    }
    
    /** WebSocket connection */
    let ws = null;
    let wsReconnectTimeout = null;
    
    function sendMessageViaWS(msg, clientMsgId) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      
      // Format text with code blocks included
      let fullText = msg.text || '';
      
      if (msg.codeBlocks && msg.codeBlocks.length) {
        const codeBlocksText = msg.codeBlocks
          .map(block => `\n\n[CODE: ${block.filename}]\n${block.code}`)
          .join('');
        fullText += codeBlocksText;
      }
      
      const payload = {
        type: 'response',
        session_id: RELAY_CONFIG.sessionId,
        client_msg_id: clientMsgId || msg.index || `cursor-${msg.id}`,
        text: fullText || '(empty)',
        metadata: {
          cursor_id: msg.id,
          cursor_index: msg.index,
          timestamp: msg.timestamp,
          has_code_blocks: (msg.codeBlocks?.length || 0) > 0,
          code_blocks: msg.codeBlocks || []
        }
      };
      
      try {
        ws.send(JSON.stringify(payload));
        console.warn(`✅ Sent via WebSocket: ${msg.index}`);
      } catch (err) {
        console.warn(`❌ WebSocket send error:`, err.message);
      }
    }
    
    function connectWebSocket() {
      if (!RELAY_CONFIG.enabled) return;
      
      console.warn(`🔌 Connecting to WebSocket: ${RELAY_CONFIG.wsUrl}/ws/${RELAY_CONFIG.sessionId}`);
      
      try {
        ws = new WebSocket(`${RELAY_CONFIG.wsUrl}/ws/${RELAY_CONFIG.sessionId}`);
        window.cursorWebSocket = ws;
        
        ws.onopen = () => {
          console.warn('✅ WebSocket connected');
          
          // Send startup message
          const startupMsg = {
            id: 'startup',
            index: 'startup',
            text: '🚀 Cursor Mobile full payload connected',
            codeBlocks: [],
            timestamp: Date.now()
          };
          sendMessageViaWS(startupMsg, 'startup');
        };
        
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ping') {
              // Respond to ping with pong
              ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
              return;
            }
            
            if (data.type === 'prompt') {
              // Received a prompt from server - inject and send in Cursor
              console.warn(`📥 Received prompt [${data.client_msg_id}]:`, data.prompt);
              
              try {
                // Store as active prompt
                const promptPromise = new Promise((resolve, reject) => {
                  activePrompts.set(data.client_msg_id, {
                    prompt: data.prompt,
                    resolve,
                    reject,
                    startTime: Date.now()
                  });
                });
                
                // Inject and send the prompt
                await injectAndSend(data.prompt);
                console.warn(`✅ Injected prompt into Cursor`);
                
                // Wait for the response (will be resolved by message polling)
                // Set a timeout
                const timeoutMs = 120000; // 2 minutes
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Response timeout')), timeoutMs);
                });
                
                await Promise.race([promptPromise, timeoutPromise]);
                
              } catch (err) {
                console.warn(`❌ Error processing prompt:`, err.message);
                activePrompts.delete(data.client_msg_id);
                
                // Send error back
                ws.send(JSON.stringify({
                  type: 'response',
                  session_id: RELAY_CONFIG.sessionId,
                  client_msg_id: data.client_msg_id,
                  text: `Error: ${err.message}`,
                  metadata: { error: true }
                }));
              }
            }
            
            if (data.type === 'message') {
              console.warn('📨 Server sent message:', data.data);
            }
            
            if (data.type === 'error') {
              console.warn('❌ Server error:', data.error, data.details);
            }
          } catch (err) {
            console.warn('❌ Error handling WebSocket message:', err);
          }
        };
        
        ws.onerror = (error) => {
          console.warn('❌ WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.warn('🔌 WebSocket disconnected');
          window.cursorWebSocket = null;
          
          // Attempt reconnect after 5 seconds
          if (RELAY_CONFIG.enabled) {
            console.warn('🔄 Reconnecting in 5 seconds...');
            wsReconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };
      } catch (err) {
        console.warn('❌ WebSocket connection error:', err.message);
      }
    }
    
    /** Set up MutationObserver to watch for new messages */
    const observer = new MutationObserver((mutations) => {
      const affectedBubbles = new Set();
      
      mutations.forEach(mutation => {
        // Only handle new nodes being added
        mutation.addedNodes.forEach(node => {
          // Check if the node itself is a message bubble
          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-message-index')) {
            affectedBubbles.add(node);
          }
          
          // Also check children in case messages are nested
          if (node.querySelectorAll) {
            const newBubbles = node.querySelectorAll('[data-message-index]');
            newBubbles.forEach(bubble => affectedBubbles.add(bubble));
          }
        });
      });
      
      // Process new bubbles
      affectedBubbles.forEach(bubble => {
        const index = bubble.getAttribute('data-message-index');
        
        if (!seenIndices.has(index)) {
          seenIndices.add(index);
          
          // Quick check if this is an assistant message
          // We do a preliminary check to avoid starting polling for user messages
          const quickCheck = isAssistantMessage(bubble);
          
          if (!quickCheck) {
            console.warn(`⏭️  Skipping user message [${index}]`);
            return;
          }
          
          // Brand new assistant message - start polling it
          console.warn(`👀 Watching assistant message [${index}]`);
          
          // Check if this is a response to an active prompt
          let clientMsgId = null;
          for (const [id, promptData] of activePrompts.entries()) {
            // Assume the newest message is for the oldest active prompt
            clientMsgId = id;
            break;
          }
          
          startPollingMessage(bubble, clientMsgId);
        }
      });
    });
  
    // Start observing the document body for new messages
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  
    console.warn('👁️ Watching for new messages...');
    console.warn('🌐 Relay server:', RELAY_CONFIG.enabled ? RELAY_CONFIG.serverUrl : 'DISABLED');
    console.warn('📝 Session ID:', RELAY_CONFIG.sessionId);
    console.warn('⚙️  To configure: window.configureCursorRelay({ sessionId: "your-id", enabled: true })');
    
    // Connect to WebSocket
    if (RELAY_CONFIG.enabled) {
      connectWebSocket();
    }
    
    // Store observer for cleanup if needed
    window.cursorObserver = observer;
    
    // Expose utility function for manual testing
    window.sendPromptToCursor = injectAndSend;
    
    return messages;
  })();

