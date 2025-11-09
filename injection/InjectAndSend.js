const el = document.querySelector('.aislash-editor-input');
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
const newText = 'Tell me about the history of the 67 meme!';
el.dispatchEvent(new InputEvent('beforeinput', {
  inputType: 'insertText',
  data: newText,
  bubbles: true,
  cancelable: true,
}));

await new Promise(resolve => setTimeout(resolve, 500));

const btn = document.querySelector('div.anysphere-icon-button[data-mode="agent"][data-outlined="true"]');
console.log(btn);
btn.click();