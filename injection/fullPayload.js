(() => {
    // Force cleanup of ALL previous instances
    if (window.CURSOR_MOBILE_CLEANUP) {
      console.warn('🧹 Cleaning up previous instance...');
      try {
        window.CURSOR_MOBILE_CLEANUP();
      } catch (e) {
        console.warn('⚠️  Cleanup error:', e);
      }
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
      
      console.warn('🔬 DEBUG extractCodeBlocks START');
      console.warn('  Bubble ID:', bubble.id);
      console.warn('  Bubble classes:', bubble.className);
      
      // Log FULL outerHTML to see complete structure (first 10000 chars)
      console.warn('  📝 FULL BUBBLE HTML:');
      console.warn(bubble.outerHTML.substring(0, 10000));
      
      // Log ALL divs with "composer" or "code" in class name
      const allComposerDivs = bubble.querySelectorAll('[class*="composer"], [class*="code"], [class*="monaco"]');
      console.warn(`  Found ${allComposerDivs.length} divs with composer/code/monaco in class`);
      
      // Try different selectors for code blocks
      const containers = bubble.querySelectorAll('.composer-code-block-container, .composer-tool-former-message, .composer-message-codeblock');
      console.warn(`  Found ${containers.length} containers with our selectors`);
      
      // Check for Monaco editors
      const allMonaco = bubble.querySelectorAll('.monaco-editor');
      console.warn(`  Found ${allMonaco.length} .monaco-editor elements`);
      
      // Check for diff editors
      const diffEditors = bubble.querySelectorAll('.monaco-diff-editor');
      console.warn(`  Found ${diffEditors.length} .monaco-diff-editor elements`);
      
      // Check for view-lines anywhere in bubble
      const allViewLines = bubble.querySelectorAll('.view-lines');
      console.warn(`  Found ${allViewLines.length} .view-lines elements`);
      
      if (allViewLines.length > 0) {
        allViewLines.forEach((vl, i) => {
          const lines = vl.querySelectorAll('.view-line');
          console.warn(`    view-lines[${i}]: ${lines.length} lines`);
          if (lines.length > 0 && lines.length < 20) {
            const sample = Array.from(lines).slice(0, 3).map(l => l.innerText).join(' | ');
            console.warn(`      Sample: ${sample}`);
          }
        });
      }
      
      containers.forEach((container, idx) => {
        console.warn(`  🎯 Processing container ${idx}:`);
        
        // Get filename
        const filenameEl = container.querySelector('.composer-code-block-filename, span.composer-code-block-filename');
        const filename = filenameEl ? filenameEl.textContent.trim() : 'untitled';
        console.warn(`    Filename: ${filename}`);
        
        // Get code content from Monaco editor - try multiple approaches
        let code = '';
        
        // Approach 1: Direct view-lines
        const viewLines = container.querySelectorAll('.view-lines .view-line');
        console.warn(`    Approach 1: ${viewLines.length} .view-lines .view-line`);
        if (viewLines && viewLines.length) {
          code = Array.from(viewLines)
            .map(line => line.innerText.replace(/\u00A0/g, ' '))
            .join('\n');
          console.warn(`    ✅ Approach 1 extracted ${code.length} chars`);
        }
        
        // Approach 2: Get from each Monaco editor separately (for diffs)
        if (!code) {
          const editors = container.querySelectorAll('.monaco-editor');
          console.warn(`    Approach 2: ${editors.length} .monaco-editor`);
          editors.forEach((editor, editorIdx) => {
            const lines = editor.querySelectorAll('.view-lines .view-line');
            console.warn(`      Editor ${editorIdx}: ${lines.length} lines`);
            if (lines.length) {
              const editorCode = Array.from(lines)
                .map(line => line.innerText.replace(/\u00A0/g, ' '))
                .filter(line => line.trim())
                .join('\n');
              if (editorCode) {
                code += (code ? '\n---\n' : '') + editorCode;
                console.warn(`      ✅ Editor ${editorIdx} extracted ${editorCode.length} chars`);
              }
            }
          });
        }
        
        // Approach 3: Fallback to any code-like content
        if (!code) {
          const codeContent = container.querySelector('.composer-code-block-content');
          console.warn(`    Approach 3: composer-code-block-content ${codeContent ? 'found' : 'not found'}`);
          if (codeContent) {
            code = codeContent.innerText.trim();
            console.warn(`    ✅ Approach 3 extracted ${code.length} chars`);
          }
        }
        
        // Approach 4: Try getting from diff-block
        if (!code) {
          const diffBlock = container.querySelector('.composer-diff-block');
          console.warn(`    Approach 4: composer-diff-block ${diffBlock ? 'found' : 'not found'}`);
          if (diffBlock) {
            const allLines = diffBlock.querySelectorAll('.view-line');
            console.warn(`      Found ${allLines.length} view-lines in diff-block`);
            if (allLines.length > 0) {
              code = Array.from(allLines)
                .map(line => line.innerText.replace(/\u00A0/g, ' '))
                .filter(line => line.trim())
                .join('\n');
              console.warn(`    ✅ Approach 4 extracted ${code.length} chars`);
            }
          }
        }
        
        if (code && code.length > 0) {
          console.warn(`    ✅ ADDED code block: ${filename} (${code.length} chars)`);
          codeBlocks.push({ type: 'code', filename, code });
        } else {
          console.warn(`    ⚠️  NO CODE extracted from this container`);
        }
      });
      
      console.warn(`🔬 DEBUG extractCodeBlocks END: ${codeBlocks.length} blocks extracted`);
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
        // DEBUG: Try to find what buttons exist
        console.warn('🔍 DEBUG: Send button not found. Checking alternatives...');
        const allButtons = document.querySelectorAll('.anysphere-icon-button');
        console.warn(`  Found ${allButtons.length} .anysphere-icon-button elements`);
        allButtons.forEach((b, i) => {
          console.warn(`  Button ${i}: mode="${b.getAttribute('data-mode')}" outlined="${b.getAttribute('data-outlined')}" class="${b.className}"`);
        });
        
        // Try alternative selector
        const altBtn = document.querySelector('.anysphere-icon-button[data-mode="agent"]');
        if (altBtn) {
          console.warn('  ✅ Found button with data-mode="agent" (without outlined check)');
          altBtn.click();
          return;
        }
        
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
    console.warn(`🔬 Cursor Mobile (DEBUG): found ${messages.length} assistant message(s) (${allMessages.length} total)`);
  
    // expose for later use
    window.cursorMessages = messages;
  
    /** Track active prompts waiting for responses */
    const activePrompts = new Map(); // client_msg_id -> { prompt, resolve, reject, startTime }
    
    /** Track message polling intervals */
    const pollingIntervals = new Map();
    const lastMessageContent = new Map();
    const stableCount = new Map(); // Track how many polls content has been stable
    
    function startPollingMessage(bubble, clientMsgId) {
      const index = bubble.getAttribute('data-message-index');
      
      // Clear existing interval if any
      if (pollingIntervals.has(index)) {
        clearInterval(pollingIntervals.get(index));
      }
      
      stableCount.set(index, 0);
      
      const interval = setInterval(() => {
        const msg = extractMessage(bubble);
        
        // Check if there are code block containers waiting to render
        const containers = bubble.querySelectorAll('.composer-code-block-container, .composer-tool-former-message, .composer-message-codeblock');
        const hasContainers = containers.length > 0;
        const hasCodeContent = (msg.codeBlocks?.length || 0) > 0;
        const hasEmptyContainers = hasContainers && !hasCodeContent;
        
        // If we have containers but no code, the Monaco editors haven't rendered yet
        if (hasEmptyContainers) {
          console.warn(`⏳ Message [${index}]: Waiting for ${containers.length} code container(s) to render...`);
          lastMessageContent.set(index, 'WAITING_FOR_CODE');
          stableCount.set(index, 0);
          return; // Don't lock in yet
        }
        
        // Create content signature including code block count and text
        const currentContent = JSON.stringify({ 
          text: msg.text, 
          codeBlockCount: msg.codeBlocks?.length || 0,
          // Include first 100 chars of each code block to detect changes
          codePreview: (msg.codeBlocks || []).map(b => b.code.substring(0, 100))
        });
        const lastContent = lastMessageContent.get(index);
        
        if (lastContent === currentContent) {
          // Content hasn't changed - increment stable counter
          const currentStable = stableCount.get(index) || 0;
          stableCount.set(index, currentStable + 1);
          
          // Wait for 2 consecutive stable polls (4 seconds total) to ensure code blocks are fully loaded
          if (currentStable >= 1) {
            // Content is stable - finalize the message
            clearInterval(interval);
            pollingIntervals.delete(index);
            lastMessageContent.delete(index);
            stableCount.delete(index);
            
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
            
            console.warn(`🎉 NEW MESSAGE [${msg.index}]:`, msg.text || '(empty)');
            if (msg.codeBlocks && msg.codeBlocks.length > 0) {
              console.warn(`  ✅ ${msg.codeBlocks.length} code block(s): ${msg.codeBlocks.map(b => b.filename).join(', ')}`);
            } else {
              console.warn(`  ⚠️  No code blocks found in this message`);
            }
            
            // Send via WebSocket if connected (only assistant messages)
            sendMessageViaWS(msg, clientMsgId);
            
            // Resolve active prompt if this was a response to one
            if (clientMsgId && activePrompts.has(clientMsgId)) {
              const promptData = activePrompts.get(clientMsgId);
              activePrompts.delete(clientMsgId);
              promptData.resolve(msg);
            }
          }
        } else {
          // Content changed - reset stable counter and keep polling
          stableCount.set(index, 0);
          lastMessageContent.set(index, currentContent);
        }
      }, 1000);
      
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
        console.warn(`✅ Sent via WebSocket: ${msg.index} (${payload.metadata.code_blocks.length} code blocks in metadata)`);
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
        
        let startupSent = false;
        
        ws.onopen = () => {
          console.warn('✅ WebSocket connected');
          
          // Send startup message only once
          if (!startupSent) {
            startupSent = true;
            const startupMsg = {
              id: 'startup',
              index: 'startup',
              text: '🔬 Cursor Mobile payload connected (DEBUG MODE)',
              codeBlocks: [],
              timestamp: Date.now()
            };
            sendMessageViaWS(startupMsg, 'startup');
          }
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
                const promptWithComplete = data.prompt + '\n\nWhen the prompt is finished, write [TASK COMPLETE]';
                await injectAndSend(promptWithComplete);
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
    
    // SEPARATE observer for code blocks appearing (they might be added after the bubble)
    const codeBlockObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Check if any code-related elements were added
          if (node.nodeType === 1) {
            const hasCodeBlock = node.classList?.contains('composer-code-block-container') ||
                                 node.classList?.contains('composer-diff-block') ||
                                 node.classList?.contains('monaco-editor') ||
                                 node.querySelector?.('.composer-code-block-container, .composer-diff-block, .monaco-editor');
            
            if (hasCodeBlock) {
              console.warn('🎨 CODE BLOCK DETECTED! Finding parent bubble...');
              
              // Find the parent bubble
              let current = node;
              while (current && current !== document.body) {
                if (current.hasAttribute?.('data-message-index')) {
                  const index = current.getAttribute('data-message-index');
                  console.warn(`  ↳ Code block belongs to bubble [${index}]`);
                  
                  // If we're currently polling this message, the next poll will catch the code
                  // If we already locked it in, re-extract it
                  if (!pollingIntervals.has(index)) {
                    console.warn(`  ↳ Re-extracting message [${index}] to capture code blocks`);
                    const msg = extractMessage(current);
                    
                    // Update in array
                    const idx = window.cursorMessages.findIndex(m => m.index === index);
                    if (idx !== -1) {
                      window.cursorMessages[idx] = msg;
                      console.warn(`  ✅ Updated message [${index}] with ${msg.codeBlocks?.length || 0} code blocks`);
                      
                      // Re-send via WebSocket
                      sendMessageViaWS(msg);
                    }
                  }
                  break;
                }
                current = current.parentElement;
              }
            }
          }
        });
      });
    });
    
    codeBlockObserver.observe(document.body, {
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
    
    // Store cleanup function for next reload
    window.CURSOR_MOBILE_CLEANUP = () => {
      console.warn('🛑 Shutting down Cursor Mobile payload...');
      
      // Disconnect observers
      if (observer) {
        observer.disconnect();
      }
      if (codeBlockObserver) {
        codeBlockObserver.disconnect();
      }
      
      // Close WebSocket
      if (ws) {
        ws.close();
      }
      
      // Clear all polling intervals
      for (const interval of pollingIntervals.values()) {
        clearInterval(interval);
      }
      pollingIntervals.clear();
      lastMessageContent.clear();
      stableCount.clear();
      
      // Clear reconnect timeout
      if (wsReconnectTimeout) {
        clearTimeout(wsReconnectTimeout);
      }
      
      // Clear active prompts
      activePrompts.clear();
      
      console.warn('✅ Cleanup complete');
    };
    
    // Expose utility functions
    window.sendPromptToCursor = injectAndSend;
    window.cursorMessages = messages;
    
    console.warn('💾 To manually stop: window.CURSOR_MOBILE_CLEANUP()');
    
    return messages;
  })();

