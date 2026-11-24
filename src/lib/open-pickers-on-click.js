// Browsers open a date / time picker only from the small calendar icon: clicking the field itself just puts the
// cursor in a day or hour segment. Open the picker on any click on the field, for every such input in the app.
// showPicker() needs a user gesture (a click is one) and throws if the picker is already open: ignore that.
const PICKER_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week']);

document.addEventListener('click', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || !PICKER_TYPES.has(el.type) || el.readOnly || el.disabled) return;
  try {
    el.showPicker?.();
  } catch {
    // already open, or the browser does not allow it here: the native behaviour still works
  }
});
