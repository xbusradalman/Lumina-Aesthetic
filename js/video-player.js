function showVideoOverlay() {
  const overlay = document.getElementById('videoOverlay');
  const frame = document.getElementById('youtubeFrame');
  // Show overlay
  overlay.classList.remove('d-none');
  // Add autoplay
  if (!frame.src.includes('autoplay=1')) {
    frame.src += (frame.src.includes('?') ? '&' : '?') + 'autoplay=1';
  }
}

function hideVideoOverlay() {
  const overlay = document.getElementById('videoOverlay');
  const frame = document.getElementById('youtubeFrame');
  // Hide overlay
  overlay.classList.add('d-none');
  // Remove autoplay to stop video
  frame.src = frame.src.replace('&autoplay=1', '').replace('?autoplay=1', '');
}
