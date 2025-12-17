/**
 * Koenig Chatbot Widget Loader
 *
 * Usage:
 * <script>
 *   (function(w,d,s,o,f,js,fjs){
 *     w['KoenigChat']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
 *     js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
 *     js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
 *   }(window,document,'script','kchat','https://chat.learnova.training/widget/loader.js'));
 *
 *   kchat('init', {
 *     apiKey: 'YOUR_API_KEY',
 *     position: 'bottom-right',
 *     primaryColor: '#0066CC'
 *   });
 * </script>
 */

(function() {
  'use strict';

  // Configuration
  var WIDGET_BASE_URL = window.KOENIG_CHAT_URL || 'https://chat.learnova.training';

  // Widget state
  var isInitialized = false;
  var config = {
    apiKey: null,
    position: 'bottom-right',
    primaryColor: '#0066CC',
    greeting: 'Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?',
    placeholder: 'Type your message...',
    companyName: 'Koenig Solutions',
    agentName: 'Koenig Assistant',
    collectEmail: true,
    pageContext: null
  };

  var widgetContainer = null;
  var widgetFrame = null;
  var widgetButton = null;
  var isOpen = false;

  // Process queued commands
  function processQueue() {
    var queue = window.kchat.q || [];
    for (var i = 0; i < queue.length; i++) {
      executeCommand(queue[i]);
    }
    window.kchat.q = [];
  }

  // Execute a command
  function executeCommand(args) {
    var command = args[0];
    var params = args[1];

    switch (command) {
      case 'init':
        init(params);
        break;
      case 'open':
        open();
        break;
      case 'close':
        close();
        break;
      case 'toggle':
        toggle();
        break;
      case 'setPageContext':
        setPageContext(params);
        break;
      case 'destroy':
        destroy();
        break;
    }
  }

  // Initialize widget
  function init(params) {
    if (isInitialized) {
      console.warn('Koenig Chat widget already initialized');
      return;
    }

    // Merge config
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        config[key] = params[key];
      }
    }

    // Set page context if not provided
    if (!config.pageContext) {
      config.pageContext = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer
      };
    }

    // Create widget container
    createWidget();
    isInitialized = true;

    console.log('Koenig Chat widget initialized');
  }

  // Create widget elements
  function createWidget() {
    // Container
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'koenig-chat-widget';
    widgetContainer.style.cssText = 'position:fixed;z-index:999999;' +
      (config.position === 'bottom-left' ? 'left:16px;' : 'right:16px;') +
      'bottom:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    // Chat button
    widgetButton = document.createElement('button');
    widgetButton.id = 'koenig-chat-button';
    widgetButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    widgetButton.style.cssText = 'width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;' +
      'background:' + config.primaryColor + ';color:white;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s,box-shadow 0.2s;';
    widgetButton.onmouseover = function() {
      this.style.transform = 'scale(1.05)';
      this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    };
    widgetButton.onmouseout = function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    };
    widgetButton.onclick = toggle;

    // Chat frame container
    var frameContainer = document.createElement('div');
    frameContainer.id = 'koenig-chat-frame-container';
    frameContainer.style.cssText = 'display:none;position:absolute;bottom:70px;' +
      (config.position === 'bottom-left' ? 'left:0;' : 'right:0;') +
      'width:380px;height:600px;max-height:calc(100vh - 100px);border-radius:12px;' +
      'box-shadow:0 10px 40px rgba(0,0,0,0.2);overflow:hidden;background:white;';

    // Iframe
    widgetFrame = document.createElement('iframe');
    widgetFrame.id = 'koenig-chat-frame';
    widgetFrame.style.cssText = 'width:100%;height:100%;border:none;';
    widgetFrame.src = WIDGET_BASE_URL + '/widget?config=' + encodeURIComponent(JSON.stringify(config));

    frameContainer.appendChild(widgetFrame);
    widgetContainer.appendChild(frameContainer);
    widgetContainer.appendChild(widgetButton);

    document.body.appendChild(widgetContainer);

    // Listen for messages from iframe
    window.addEventListener('message', handleMessage);
  }

  // Handle messages from iframe
  function handleMessage(event) {
    // Verify origin
    if (event.origin !== WIDGET_BASE_URL) return;

    var data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
      case 'koenig-chat-close':
        close();
        break;
      case 'koenig-chat-minimize':
        close();
        break;
      case 'koenig-chat-lead-captured':
        // Trigger custom event for integrations
        var customEvent = new CustomEvent('koenigChatLeadCaptured', { detail: data.payload });
        window.dispatchEvent(customEvent);
        break;
    }
  }

  // Open chat
  function open() {
    if (!isInitialized || isOpen) return;

    var frameContainer = document.getElementById('koenig-chat-frame-container');
    frameContainer.style.display = 'block';
    frameContainer.style.animation = 'koenig-slide-up 0.3s ease';

    widgetButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    isOpen = true;

    // Update page context
    postMessage({ type: 'update-context', payload: config.pageContext });
  }

  // Close chat
  function close() {
    if (!isInitialized || !isOpen) return;

    var frameContainer = document.getElementById('koenig-chat-frame-container');
    frameContainer.style.display = 'none';

    widgetButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    isOpen = false;
  }

  // Toggle chat
  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  // Set page context
  function setPageContext(context) {
    config.pageContext = context;
    if (isInitialized && widgetFrame) {
      postMessage({ type: 'update-context', payload: context });
    }
  }

  // Post message to iframe
  function postMessage(data) {
    if (widgetFrame && widgetFrame.contentWindow) {
      widgetFrame.contentWindow.postMessage(data, WIDGET_BASE_URL);
    }
  }

  // Destroy widget
  function destroy() {
    if (widgetContainer) {
      widgetContainer.remove();
    }
    window.removeEventListener('message', handleMessage);
    isInitialized = false;
    isOpen = false;
  }

  // Add CSS animation
  var style = document.createElement('style');
  style.textContent = '@keyframes koenig-slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  // Override kchat function
  window.kchat = function() {
    executeCommand(arguments);
  };
  window.kchat.q = window.kchat.q || [];

  // Process any queued commands
  processQueue();

})();
