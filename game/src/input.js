// Moonlit Catch: keyboard and mouse input. Arrow keys / A D steer the boat and
// the hook, Down / S or a click casts the line, Space casts too, P pauses,
// M mutes, R restarts, Enter starts and advances screens.
export function createFishingInput(canvas, callbacks) {
  const keys = new Set();
  let mouseX = null;

  function keyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Space' || event.code === 'ArrowDown' || event.code === 'KeyS') callbacks.onCast();
    if (event.code === 'Enter') callbacks.onConfirm();
    if (event.code === 'KeyP' || event.code === 'Escape') callbacks.onPause();
    if (event.code === 'KeyR') callbacks.onRestart();
    if (event.code === 'KeyM') callbacks.onMute();
  }

  function keyUp(event) {
    keys.delete(event.code);
  }

  function mouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  }

  function mouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    callbacks.onClick(x, y);
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('mousedown', mouseDown);

  // -1, 0 or 1: the direction the player is steering this frame.
  function steerDirection() {
    let direction = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) direction -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) direction += 1;
    return direction;
  }

  function mouseSteerTarget() {
    return mouseX;
  }

  function clearMouse() {
    mouseX = null;
  }

  return { steerDirection, mouseSteerTarget, clearMouse };
}
