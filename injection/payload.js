(() => {
    /** Utility: decode HTML entities safely */
    function decodeHtml(html) {
      try {
        const txt = document.createElement('textarea');
        txt.textContent = html;
        return txt.value;
      } catch (e) {
        // Fallback if Trusted Types blocks this
        return html;
      }
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
  
    /** Debounce helper for streaming updates */
    const debounceTimers = new Map();
    const completionTimers = new Map();
    const completedMessages = new Set();
    
    function debounce(key, callback, delay = 300) {
      if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
      }
      debounceTimers.set(key, setTimeout(() => {
        callback();
        debounceTimers.delete(key);
      }, delay));
    }
    
    function markCompleteAfterDelay(index, bubble) {
      // Clear existing completion timer
      if (completionTimers.has(index)) {
        clearTimeout(completionTimers.get(index));
      }
      
      // Set new timer - if no updates for 2s, mark complete
      completionTimers.set(index, setTimeout(() => {
        if (!completedMessages.has(index)) {
          completedMessages.add(index);
          const msg = extractMessage(bubble);
          
          // Update in array with completed flag
          const idx = window.cursorMessages.findIndex(m => m.index === index);
          if (idx !== -1) {
            window.cursorMessages[idx] = { ...msg, completed: true };
          }
          
          console.warn(`✅ COMPLETE [${msg.index}]`);
          console.log(msg.text || '(empty)');
        }
        completionTimers.delete(index);
      }, 2000));
    }
  
    /** Set up MutationObserver to watch for new messages and updates */
    const observer = new MutationObserver((mutations) => {
      const affectedBubbles = new Set();
      
      mutations.forEach(mutation => {
        // Handle new nodes being added
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
        
        // Handle changes to existing nodes (streaming content updates)
        if (mutation.type === 'characterData' || mutation.type === 'attributes' || mutation.type === 'childList') {
          // Walk up to find the message bubble
          let elem = mutation.target;
          while (elem && elem !== document.body) {
            if (elem.hasAttribute && elem.hasAttribute('data-message-index')) {
              affectedBubbles.add(elem);
              break;
            }
            elem = elem.parentElement;
          }
        }
      });
      
      // Process all affected bubbles
      affectedBubbles.forEach(bubble => {
        const index = bubble.getAttribute('data-message-index');
        
        if (!seenIndices.has(index)) {
          // Brand new message
          seenIndices.add(index);
          const msg = extractMessage(bubble);
          window.cursorMessages.push(msg);
          
          console.warn(`🔔 NEW MESSAGE [${msg.index}]`);
          console.log(msg.text || '(empty)');
          
          // Start completion tracking
          markCompleteAfterDelay(index, bubble);
        } else {
          // Existing message being updated (streaming)
          // Remove from completed set if it was marked complete (edge case)
          completedMessages.delete(index);
          
          debounce(`update-${index}`, () => {
            const msg = extractMessage(bubble);
            // Update in array
            const idx = window.cursorMessages.findIndex(m => m.index === index);
            if (idx !== -1) {
              window.cursorMessages[idx] = msg;
            }
            
            console.warn(`📝 UPDATE [${msg.index}]`);
            console.log(msg.text || '(empty)');
          }, 500);
          
          // Reset completion timer on every update
          markCompleteAfterDelay(index, bubble);
        }
      });
    });
  
    // Start observing the document body for new messages and content changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-markdown-raw']
    });
  
    console.warn('👁️ Watching for new messages...');
    
    // Store observer for cleanup if needed
    window.cursorObserver = observer;
    
    return messages;
  })();