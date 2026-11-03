(function () {
  'use strict';
  var noop = function () {};
  try {
    ['log', 'info', 'warn', 'error', 'debug', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'count', 'assert'].forEach(function (k) {
      try { console[k] = noop; } catch (e) {}
    });
  } catch (e) {}

  var field = function (t) {
    return !!(t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'));
  };

  addEventListener('contextmenu', function (e) {
    if (!field(e.target)) e.preventDefault();
  }, true);

  addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  }, true);

  addEventListener('keydown', function (e) {
    var k = String(e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    var blocked =
      e.key === 'F12' ||
      (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) ||
      (mod && (k === 'u' || k === 's')) ||
      (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u'));
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
})();
