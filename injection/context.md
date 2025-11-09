Skip to content
Chat history

You said:
can you help me brainstorm ways that i can get input in and out of the Cursor (a vscode based AI ide) input box. we need to do it for an app where we need to interact with it, we were thinking of maybe an extension but idk if that'll work, can you brainstorm as my ideas as you can?
ChatGPT said:
Alright, cool — you’re trying to programmatically send input to and receive output from Cursor’s prompt box, right? Essentially automating or integrating with its chat or code suggestion interface. Let’s explore different possible pathways — from “clean and proper” to “hacky but maybe doable” depending on Cursor’s restrictions.

Here’s a brainstorm of directions you could investigate:

🧩 1. VS Code Extension API (the “clean” route)
Since Cursor is built on VS Code:

You could make an extension that hooks into the window.activeTextEditor, workspace.onDidChangeTextDocument, or command APIs.

You’d use it to capture input from or send output to the editor (or chat if Cursor exposes that through a custom API).

If Cursor’s chat box isn’t exposed through the VS Code API, you might still access its webview elements (if any) using vscode.window.createWebviewPanel or monkey-patching a command that Cursor uses internally.

Challenge: Cursor’s chat input is likely not exposed through the standard VS Code API, so you may need to find internal command names via the Command Palette → “Developer: Show Running Extensions” or Developer Tools (Ctrl+Shift+I).

🧠 2. Automate UI interactions
If you can’t touch it programmatically:

Simulate user input using something like:

Node.js + robotjs or nut.js (simulate keystrokes, mouse clicks)

AppleScript / Automator (on macOS, to send keystrokes)

Python + pyautogui (cross-platform UI automation)

You could detect when new output appears by watching:

the clipboard (if Cursor lets you copy from the chat)

a window capture (using OCR to read responses)

This is hacky, but it works when you can’t access internal APIs.

⚙️ 3. Intercept network or local API calls
Cursor’s AI chat likely makes HTTP or WebSocket requests to its backend. You could:

Run a proxy (e.g., mitmproxy or Charles Proxy) to capture requests.

Identify the API endpoints Cursor uses to send/receive messages.

Then, replicate those requests directly from your app (essentially creating an unofficial API wrapper).

Risk: could break if Cursor updates or encrypts its traffic. You’d also need to handle auth (tokens, etc.).

🧩 4. Inspect local files / logs
Sometimes Cursor stores:

Session data

Prompts

Responses
in local files (SQLite, JSON, etc.) inside its app data folder.

You could watch those files for changes using fs.watch and treat that as your “input/output pipe.”

🧰 5. Custom webview or inline input
If you want two-way interaction inside Cursor:

Build an extension that adds your own webview panel or sidebar.

That panel can talk to your backend or app directly.

You could then paste responses into Cursor’s editor or prompt box programmatically (via vscode.commands.executeCommand('type', { text: ... })).

So instead of hijacking Cursor’s UI, you create your own “parallel chat box” that uses the same space.

⚡ 6. Command Palette bridge
If Cursor exposes custom commands (like “Cursor: Ask AI”):

You can invoke those commands using the VS Code API (vscode.commands.executeCommand).

You might be able to feed them arguments or even override their behavior.

Use vscode.commands.getCommands(true) to see the full list of registered commands — Cursor’s commands will probably start with something like "cursor.".

🕳️ 7. Reverse-engineer Cursor’s renderer (deep hacky path)
Because it’s Electron-based, you could:

Launch Cursor with the --remote-debugging-port flag.

Use Chrome DevTools to inspect its web contents.

Find the DOM node representing the input box.

Inject JavaScript directly to read/write its value.

This is obviously fragile but very direct if you’re just experimenting.

Would you like me to focus on one route (e.g. writing a VS Code extension that can “type” into Cursor’s input box or capture its output)?
That’d let me sketch an actual plan for how to technically hook in.

You said:
i was able to open the command pallet, and i can like see it ont he dom and stuff and eventually ready the html, but feels a bit sketchy. any idea of how we might want to do it? how we can just read things from it? im interested in injecting this js idea. any idea of what kind of like vode we could put into it to read whats in teh chat window, or then insert text into the text window? lets work on it together
ChatGPT said:
Nice — since you already see the DOM, injecting JS is the most direct route. Below I’ll give a short, practical toolset you can paste into DevTools (or run through a remote-debugging injection) that:

Finds the Cursor chat input reliably (with fallbacks).

Reads messages from the chat area and returns them as {role, text, node} items.

Watches for new messages (MutationObserver).

Inserts text into the input and triggers send (via send button if available, otherwise simulates Enter).

Heads-up: this is fragile (class names / structure change), so treat it as exploratory tooling. Don’t use it to exfiltrate private data or bypass auth — also check Cursor’s TOS.

1) Utilities — find the input & send button
Paste this into the console to create a helper object CursorBridge:

// CursorBridge: quick DOM helpers for reading/inserting into a chat-like UI
window.CursorBridge = (function(){
  function findInputElement(){
    // Candidate selectors: contenteditable, textarea, input[type="text"]
    const candidates = [
      ...document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"], input[type="search"]')
    ];

    // Heuristics: placeholder text, aria-label, or visible and focused-able
    const prefer = candidates.sort((a,b) => {
      const score = el => {
        const p = (el.getAttribute('placeholder')||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.className||'');
        let s = 0;
        if (/ask|message|prompt|send|chat|query|type/i.test(p)) s += 10;
        if (el.isContentEditable) s += 5;
        if (el.offsetParent === null) s -= 5; // hidden
        return s;
      };
      return score(b) - score(a);
    });
    return prefer[0] || null;
  }

  function findSendButton(inputEl){
    // Look nearby for a button with aria/label or icon resembling "send"
    if(!inputEl) return null;
    // check ancestor for toolbar with buttons
    const toolbar = inputEl.closest('form, .toolbar, [role="group"], [role="form"]') || document;
    const btns = [...toolbar.querySelectorAll('button, [role="button"], input[type="submit"]')];
    // heuristic match
    const send = btns.find(b => {
      const a = (b.getAttribute('aria-label')||'') + ' ' + (b.title||'') + ' ' + (b.innerText||'') + ' ' + (b.className||'');
      return /send|submit|enter|↵|paper-plane|send-icon|cursor-send/i.test(a);
    });
    return send || null;
  }

  function focusAndSet(el, text){
    if(!el) throw new Error('No input element found');
    el.focus();
    if(el.isContentEditable){
      // replace innerText safely
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', {bubbles:true, composed:true}));
    } else {
      el.value = text;
      el.dispatchEvent(new Event('input', {bubbles:true}));
    }
  }

  function sendViaEnter(el){
    // Trigger key events - many apps listen for keydown.
    el.focus();
    const down = new KeyboardEvent('keydown', {key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true});
    const up   = new KeyboardEvent('keyup',   {key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true});
    el.dispatchEvent(down);
    el.dispatchEvent(up);
  }

  // Attempts to click a send button; falls back to Enter key
  function sendText(text){
    const el = findInputElement();
    if(!el) { console.warn('CursorBridge: input not found'); return false; }
    focusAndSet(el, text);
    const sendBtn = findSendButton(el);
    if(sendBtn){
      sendBtn.click();
    } else {
      sendViaEnter(el);
    }
    return true;
  }

  return {
    findInputElement,
    findSendButton,
    focusAndSet,
    sendViaEnter,
    sendText
  };
})();
Usage: CursorBridge.sendText("Hello from my script").

2) Reading messages from the chat area
We need a heuristic to find the message container and extract messages. Paste:

(function(){
  function findMessageContainer(){
    // common: large scrollable area with many child nodes containing text
    const candidates = [...document.querySelectorAll('main, [role="main"], .chat, .messages, .conversation, .scroller, [aria-live]')];
    // rank by number of text-containing descendants
    candidates.sort((a,b) => (b.querySelectorAll('*').length - a.querySelectorAll('*').length));
    return candidates[0] || document.body;
  }

  function extractMessages(container){
    // Search for elements that look like message bubbles
    const bubbles = [...container.querySelectorAll('div, li, p, article')]
      .filter(n => {
        const txt = (n.innerText||'').trim();
        if(!txt) return false;
        // exclude code blocks or tiny labels
        if(txt.length < 2) return false;
        // avoid very large containers that are likely the whole UI
        if(n.querySelectorAll('*').length > 50) return false;
        return true;
      });

    // Map to structured messages; best-effort role detection
    const msgs = bubbles.map(n => {
      const text = n.innerText.trim();
      // try to detect who wrote it via class/aria or parent node
      const role = (/assistant|bot|ai|cursor/i.test(n.className + ' ' + (n.getAttribute('aria-label')||''))) ? 'assistant' :
                   (/user|you|me|owner/i.test(n.className + ' ' + (n.getAttribute('aria-label')||''))) ? 'user' :
                   (n.closest('.assistant,.bot,.ai')) ? 'assistant' :
                   (n.closest('.user,.you,.me')) ? 'user' : 'unknown';
      return {role, text, node: n};
    });

    // Optional: de-duplicate contiguous duplicates
    const deduped = [];
    for(const m of msgs){
      if(deduped.length && deduped[deduped.length-1].text === m.text) continue;
      deduped.push(m);
    }
    return deduped;
  }

  // Expose for quick use
  window.CursorReader = {
    getContainer: findMessageContainer,
    read: function(){ return extractMessages(findMessageContainer()); }
  };
})();
Usage: CursorReader.read() — returns an array of {role, text, node}.

3) Watching for new messages (live updates)
If you want callbacks for new assistant replies:

// watch for appended messages inside the detected container
const container = CursorReader.getContainer();
const observer = new MutationObserver(muts => {
  for(const m of muts){
    for(const n of m.addedNodes){
      try {
        if(n.nodeType!==1) continue;
        const txt = (n.innerText||'').trim();
        if(!txt) continue;
        console.log('New node added:', txt.slice(0,200));
        // you can run a custom handler here:
        // myHandler({text: txt, node: n});
      } catch(e) { /* ignore */ }
    }
  }
});
observer.observe(container, {childList: true, subtree: true});
// To stop: observer.disconnect();
This is fast and lets you stream the assistant output as it appears.

4) More robust send: handle contenteditable with selection / composition
If the input uses contenteditable and supports rich editing, some apps listen for compositionend or rely on selection range. An improved setter:

function setContentEditableText(el, text){
  el.focus();
  // clear existing
  while(el.firstChild) el.removeChild(el.firstChild);
  el.appendChild(document.createTextNode(text));
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  el.dispatchEvent(new InputEvent('input', {bubbles:true, composed:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
}
Use that inside CursorBridge.focusAndSet if el.isContentEditable.

5) Putting it together — example flow
// Example: send a prompt, wait for new assistant message, print it
CursorBridge.sendText("Please summarize the last 3 messages in one sentence.");

let last = CursorReader.read().map(m => m.text).join('\n').slice(0,200); // snapshot
const cont = CursorReader.getContainer();
const obs = new MutationObserver((muts, o) => {
  const msgs = CursorReader.read();
  const assistant = msgs.reverse().find(x => x.role === 'assistant');
  if(assistant){
    console.log("Assistant replied:", assistant.text);
    o.disconnect();
  }
});
obs.observe(cont, {childList:true, subtree:true});
6) Notes, caveats & safer alternatives
Fragility: classnames, aria attributes, or DOM shapes change — your script will break often. Wrap everything in try/catch and use multiple heuristics.

Timing: Some UIs use virtualized lists; nodes may be recycled. Using the container + aria-live or a network-level approach is sometimes more reliable.

Auth & APIs: If you can intercept the app’s network calls (via remote debugging or a local proxy), you may be able to call the same backend more reliably — but be careful with tokens and TOS.

Better long-term approach: Build a small VS Code extension / webview that provides a stable API: it can executeCommand('type', {text}) to insert text into an editor and can register commands to read editor text. If Cursor exposes commands (check vscode.commands.getCommands(true)), call those. That’s much cleaner and less fragile.

Legal / ethical: don’t use this to scrape private conversations or bypass access controls.

Want me to:

tighten the selectors for the exact DOM you saw (paste a small snippet of the relevant HTML and I’ll adapt the code), or

draft a minimal VS Code extension plan that uses vscode.commands.executeCommand('type', {text}) plus a sidebar webview for two-way comms?

Pick one and I’ll give the code/manifest next.

You said:
here is what the text looks like in html. 

<div tabindex="0" data-message-index="5" class="relative hide-if-empty composer-message-blur" id="bubble-966968a30f5c" style="display: block; outline: none; padding: 0px 18px 0.4rem; background-color: var(--composer-pane-background); opacity: 1; z-index: 99;"><div class="" style="background-color: transparent;"><div style="position: sticky; top: 0px;"><div style="padding: 0px 2px;"><span class="anysphere-markdown-container-root" style="user-select: text; font-size: 1em; line-height: 1.5; min-height: 22.2px;"><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-0" class="markdown-section chat-fade-in" data-markdown-raw="" data-section-index="0"></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-1" class="markdown-section chat-fade-in" data-markdown-raw="
Here are two sentences in separate paragraphs, followed by a code block:" data-section-index="1"><span>Here are tw</span><span>o sentences in</span><span> separate paragraphs, followed by a</span><span> code block:</span></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-2" class="markdown-section chat-fade-in" data-markdown-raw="
" data-section-index="2"></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-3" class="markdown-section chat-fade-in" data-markdown-raw="
This is the first sentence in its own paragraph." data-section-index="3"><span>This is the first senten</span><span>ce in its own paragraph</span><span>.</span></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-4" class="markdown-section chat-fade-in" data-markdown-raw="
" data-section-index="4"></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-5" class="markdown-section chat-fade-in" data-markdown-raw="
This is the second sentence in its own paragraph." data-section-index="5"><span>This is the second senten</span><span>ce in its own paragraph.</span></section><section id="markdown-section-ccff869a-d0ff-4123-b3ef-966968a30f5c-6" class="markdown-section chat-fade-in" data-markdown-raw="

python
def example_function():
    &quot;&quot;&quot;This is a code block example.&quot;&quot;&quot;
    return &quot;Hello, World!&quot;
" data-section-index="6"><div class="markdown-code-outer-container" id="a4d1fe35-d403-476f-9833-928577c0250f" style="display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative;"><div style="height: 100%; width: 100%;"><div class="composer-code-block-container composer-message-codeblock" style="transition: border-color 0.1s ease-in-out;"><div style="position: relative;"><div class="composer-code-block-content" style="display: block;"><div class="scrollable-div-container show-only-on-hover" data-keybinding-context="41" data-mode-id="worktree-python" style="height: 66px;"><div class="monaco-editor no-user-select mac  showUnused showDeprecated vs-dark" role="code" data-uri="composer-code-block-anysphere://qeicbqosci" style="width: 115px; height: 66px;"><div data-mprt="3" class="overflow-guard" style="width: 115px; height: 66px;"><textarea data-mprt="7" class="inputarea monaco-mouse-cursor-text" wrap="off" autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="The editor is not accessible at this time. To enable screen reader optimized mode, use Shift+Option+F1" aria-required="false" tabindex="0" role="textbox" aria-roledescription="editor" aria-multiline="true" aria-autocomplete="none" style="tab-size: 28.9062px; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 12px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 18px; letter-spacing: 0px; top: 6px; left: 0px; width: 1px; height: 18px;"></textarea><div style="position: absolute; top: 0px; left: 0px; width: 0px; height: 0px;" class="monaco-editor-background textAreaCover"></div><div class="margin" role="presentation" aria-hidden="true" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; height: 66px; width: 0px;"><div class="glyph-margin" style="left: 0px; width: 0px; height: 66px;"></div><div class="margin-view-zones" role="presentation" aria-hidden="true" style="position: absolute;"></div><div class="margin-view-overlays" role="presentation" aria-hidden="true" style="position: absolute; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 12px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 18px; letter-spacing: 0px; width: 0px; height: 66px;"><div style="top:6px;height:18px;"><div class="current-line" style="width:0px"></div></div><div style="top:24px;height:18px;"></div><div style="top:42px;height:18px;"></div></div><div class="glyph-margin-widgets" style="position: absolute; top: 0px;"></div></div><div class="monaco-scrollable-element editor-scrollable vs-dark mac" role="presentation" data-mprt="6" style="position: absolute; overflow: hidden; left: 0px; width: 115px; height: 66px;"><div class="lines-content monaco-editor-background" style="position: absolute; overflow: hidden; width: 1.67772e+07px; height: 1.67772e+07px; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; left: 0px;"><div class="view-overlays" role="presentation" aria-hidden="true" style="position: absolute; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 12px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 18px; letter-spacing: 0px; height: 0px; width: 310px;"><div style="top:6px;height:18px;"></div><div style="top:24px;height:18px;"></div><div style="top:42px;height:18px;"></div></div><div role="presentation" aria-hidden="true" class="view-rulers"></div><div class="view-zones" role="presentation" aria-hidden="true" style="position: absolute;"></div><div class="view-lines monaco-mouse-cursor-text" role="presentation" aria-hidden="true" data-mprt="8" style="position: absolute; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 12px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 18px; letter-spacing: 0px; width: 310px; height: 66px;"><div style="top:6px;height:18px;" class="view-line"><span><span class="mtk6">def</span><span class="mtk1">&nbsp;</span><span class="mtk16">example_function</span><span class="mtk1">():</span></span></div><div style="top:24px;height:18px;" class="view-line"><span><span class="mtk1">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="mtk12">"""This&nbsp;is&nbsp;a&nbsp;code&nbsp;block&nbsp;example."""</span></span></div><div style="top:42px;height:18px;" class="view-line"><span><span class="mtk1">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="mtk18">return</span><span class="mtk1">&nbsp;</span><span class="mtk12">"Hello,&nbsp;World!"</span></span></div></div><div data-mprt="1" class="contentWidgets" style="position: absolute; top: 0px;"></div><div role="presentation" aria-hidden="true" class="cursors-layer cursor-line-thin-style cursor-solid"><div class="cursor  monaco-mouse-cursor-text " style="height: 18px; top: 6px; left: 0px; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 12px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; font-variation-settings: normal; line-height: 18px; letter-spacing: 0px; display: block; visibility: hidden; padding-left: 0px; width: 1px;"></div></div></div><div role="presentation" aria-hidden="true" class="invisible scrollbar horizontal fade" style="position: absolute; width: 115px; height: 6px; left: 0px; bottom: 0px;"><div class="slider" style="position: absolute; top: 0px; left: 0px; height: 6px; transform: translate3d(0px, 0px, 0px); contain: strict; width: 42px;"></div></div><canvas class="decorationsOverviewRuler" aria-hidden="true" width="0" height="0" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; top: 0px; right: 0px; width: 0px; height: 66px; display: none;"></canvas><div role="presentation" aria-hidden="true" class="invisible scrollbar vertical" style="position: absolute; width: 0px; height: 66px; right: 0px; top: 0px;"><div class="slider" style="position: absolute; top: 0px; left: 0px; width: 0px; transform: translate3d(0px, 0px, 0px); contain: strict; height: 66px;"></div></div></div><div role="presentation" aria-hidden="true" style="width: 115px;"></div><div data-mprt="4" class="overlayWidgets" style="width: 115px;"></div><div data-mprt="9" class="minimap slider-mouseover" role="presentation" aria-hidden="true" style="position: absolute; left: 0px; width: 0px; height: 66px;"><div class="minimap-shadow-hidden" style="height: 66px;"></div><canvas width="0" height="132" style="position: absolute; left: 0px; width: 0px; height: 66px;"></canvas><canvas class="minimap-decorations-layer" width="0" height="132" style="position: absolute; left: 0px; width: 0px; height: 66px;"></canvas><div class="minimap-slider" style="position: absolute; transform: translate3d(0px, 0px, 0px); contain: strict; width: 0px;"><div class="minimap-slider-horizontal" style="position: absolute; width: 0px; height: 0px;"></div></div></div><div role="presentation" aria-hidden="true" class="blockDecorations-container"></div></div><div data-mprt="2" class="overflowingContentWidgets"></div><div data-mprt="5" class="overflowingOverlayWidgets"></div></div></div><div class="composer-codeblock-copy-overlay"><div style="overflow: hidden; display: flex; justify-content: flex-end; align-items: center; position: relative;"><div style="display: flex; justify-content: flex-end; justify-self: flex-end; flex-shrink: 0; position: relative; align-items: center;"><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 0; pointer-events: none;"></div><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 1; pointer-events: auto; margin-left: 4px;"><div class="anysphere-icon-button bg-[transparent] border-none text-[var(--cursor-text-primary)] flex w-4 items-center justify-center  " style="height: 20px; width: 20px;"><span class="codicon codicon-copy-two  !text-[12px] "></span></div></div><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 0; pointer-events: none;"></div><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 0; pointer-events: none;"></div><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 0; pointer-events: none;"></div><div style="flex-shrink: 0; height: 100%; transition: opacity 0.1s ease-in-out; opacity: 0; pointer-events: none;"></div></div></div></div></div><div class="composer-diff-block" style="box-sizing: border-box; position: relative; background: var(--vscode-editor-background); overflow: auto hidden; display: none; height: 90px;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 8px; color: var(--vscode-descriptionForeground); font-size: 12px;">Loading</div><div style="transition: opacity 0.15s ease-in-out; height: 90px; opacity: 0;"></div></div></div></div></div></div></section></span></div></div></div></div>


so can you give me the javascript i should inject to be able to like fetch these messages that it gave me and jsut print them out? i want a pastable thing in the terminal
ChatGPT said:
Nice — thanks for the HTML snippet. Below is a single pasteable JS snippet you can drop into DevTools (or paste in a terminal connected to the page) that:

finds all message bubbles ([data-message-index]),

extracts each bubble’s textual sections (preserving code blocks),

decodes HTML entities,

prints a friendly summary to the console, and

returns an array window.cursorMessages with { id, index, text, rawSections }.

Paste the whole block into the Console and run it.

(() => {
  /** Utility: decode HTML entities safely */
  function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
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

  /** Main collector */
  const bubbles = Array.from(document.querySelectorAll('[data-message-index]'));
  const messages = bubbles.map(b => {
    const id = b.id || null;
    const index = b.getAttribute('data-message-index') || null;

    // find markdown sections inside this bubble
    const container = b.querySelector('.anysphere-markdown-container-root') || b;
    const sections = Array.from(container.querySelectorAll('section.markdown-section, .markdown-section'));

    // if none found, try to fallback to text nodes inside the bubble
    const rawSections = sections.length ? sections.map(s => ({ raw: s.getAttribute('data-markdown-raw')||null })) : [{ raw: null }];

    // build text by joining sectionText with double newline between logical sections
    const pieces = sections.length ? sections.map(sectionText).filter(Boolean) : [ (b.innerText||'').trim() ];
    const text = pieces.join('\n\n').trim();

    return { id, index, text, rawSections };
  });

  // show nicely in console
  console.groupCollapsed(`Cursor: found ${messages.length} message(s)`);
  messages.forEach(m => {
    console.group(`message index=${m.index} id=${m.id}`);
    console.log(m.text || '(empty)');
    console.groupEnd();
  });
  console.groupEnd();

  // expose for later use
  window.cursorMessages = messages;
  return messages;
})();
What this gives you

console output showing each bubble and its content.

window.cursorMessages array you can reuse from other scripts.

reasonable handling of code blocks (it attempts to pull the Monaco editor lines if present).

If you want a small variant that watches for newly added messages and logs them as they appear, say so and I’ll give a MutationObserver version you can paste next.




No file chosenNo file chosen
ChatGPT can make mistakes. Check important info.
