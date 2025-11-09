(() => {
    // Cleanup any existing observer from previous runs
    if (window.cursorObserver) {
      console.warn('🧹 Cleaning up previous observer...');
      window.cursorObserver.disconnect();
      window.cursorObserver = null;
    }
    
    // Clear console for fresh start
    console.clear();
    
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
  
    /** Extract message data from a bubble element */
    function extractMessage(bubble) {
      const id = bubble.id || null;
      const index = bubble.getAttribute('data-message-index') || null;
  
      // find markdown sections inside this bubble
      const container = bubble.querySelector('.anysphere-markdown-container-root') || bubble;
      const sections = Array.from(container.querySelectorAll('section.markdown-section, .markdown-section'));
  
      // if none found, try to fallback to text nodes inside the bubble
      const rawSections = sections.length ? sections.map(s => ({ raw: s.getAttribute('data-markdown-raw')||null })) : [{ raw: null }];
  
      // build text by joining sectionText with double newline between logical sections
      const pieces = sections.length ? sections.map(sectionText).filter(Boolean) : [ (bubble.innerText||'').trim() ];
      const text = pieces.join('\n\n').trim();
  
      return { id, index, text, rawSections, timestamp: Date.now() };
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
        const lastContent = lastMessageContent.get(index);
        
        if (lastContent === msg.text) {
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
          console.warn(msg.text || '(empty)');
        } else {
          // Content changed - keep polling
          lastMessageContent.set(index, msg.text);
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
    
    // Store observer for cleanup if needed
    window.cursorObserver = observer;
    
    return messages;
  })();