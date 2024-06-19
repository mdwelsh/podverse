/* This code is used to embed the Podverse chat widget onto your page. */

(function () {
  function embedPodverseChat(containerId, options) {
    var iframe = document.createElement('iframe');
    var host = options.host || 'https://www.podverse.ai';
    var baseUrl = `${host}/embed/chat/${options.podcast}`;
    iframe.src = options.episode ? baseUrl + `/episode/${options.episode}` : baseUrl;
    iframe.width = options.width || '600px';
    iframe.height = options.height || '400px';
    iframe.style.border = 'none';
    document.getElementById(containerId).appendChild(iframe);
  }
  window.embedPodverseChat = embedPodverseChat;
})();
