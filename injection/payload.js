(() => {
    // Cleanup any existing observer from previous runs
    if (window.cursorObserver) {
      console.warn('🧹 Cleaning up previous observer...');
      window.cursorObserver.disconnect();
      window.cursorObserver = null;
    }
    
    // Clear console for fresh start
    console.clear();
    
    /** Configuration */
    const RELAY_CONFIG = {
      serverUrl: 'http://localhost:8000',
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
        timestamp: Date.now() 
      };
    }
  
    /** Initial scan - collect all existing messages */
    const bubbles = Array.from(document.querySelectorAll('[data-message-index]'));
    const messages = bubbles.map(extractMessage);
    
    // Track seen messages by index to avoid duplicates
    const seenIndices = new Set(messages.map(m => m.index).filter(Boolean));
  
    // show initial messages in console
    console.warn(`🚀 Cursor Mobile: found ${messages.length} existing message(s)`);
  
    // expose for later use
    window.cursorMessages = messages;
  
  
    /** Send message to relay server */
    async function sendToRelay(msg) {
      if (!RELAY_CONFIG.enabled) return;
      
      try {
        // Format text with code blocks included
        let fullText = msg.text || '';
        
        if (msg.codeBlocks && msg.codeBlocks.length) {
          const codeBlocksText = msg.codeBlocks
            .map(block => `\n\n[CODE: ${block.filename}]\n${block.code}`)
            .join('');
          fullText += codeBlocksText;
        }
        
        const payload = {
          session_id: RELAY_CONFIG.sessionId,
          client_msg_id: msg.index || `cursor-${msg.id}`,
          text: fullText || '(empty)',
          metadata: {
            cursor_id: msg.id,
            cursor_index: msg.index,
            timestamp: msg.timestamp,
            has_code_blocks: (msg.codeBlocks?.length || 0) > 0,
            code_blocks: msg.codeBlocks || []
          }
        };
        
        const response = await fetch(`${RELAY_CONFIG.serverUrl}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.warn(`✅ Sent to relay: ${msg.index}`, result);
        } else {
          const error = await response.text();
          console.warn(`❌ Relay failed: ${response.status}`, error);
        }
      } catch (err) {
        console.warn(`❌ Relay error:`, err.message);
      }
    }
    
    /** Track message polling intervals */
    const pollingIntervals = new Map();
    const lastMessageContent = new Map();
    
    function startPollingMessage(bubble) {
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
          
          // Send to relay server
          sendToRelay(msg);
        } else {
          // Content changed - keep polling
          lastMessageContent.set(index, currentContent);
        }
      }, 2000);
      
      pollingIntervals.set(index, interval);
    }
    
    /** Set up MutationObserver to watch for new messages only */
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
      
      // Process new bubbles only
      affectedBubbles.forEach(bubble => {
        const index = bubble.getAttribute('data-message-index');
        
        if (!seenIndices.has(index)) {
          // Brand new message - start polling it
          seenIndices.add(index);
          startPollingMessage(bubble);
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
    
    // Send startup message to relay
    if (RELAY_CONFIG.enabled) {
      const startupMsg = {
        id: 'startup',
        index: 'startup',
        text: '🚀 Cursor Mobile payload connected',
        codeBlocks: [],
        timestamp: Date.now()
      };
      sendToRelay(startupMsg);
    }
    
    // Store observer for cleanup if needed
    window.cursorObserver = observer;
    
    return messages;
  })();