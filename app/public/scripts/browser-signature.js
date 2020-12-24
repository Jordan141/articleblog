/**
 * Library: https://github.com/successtar/browser-signature/ 1.0.4
 * LICENSE: MIT Hammed Olalekan Osanyinpeju https://successtar.github.io/
 */
function browserSignature() {
  var e,
    n = window || global,
    r =
      ((e =
        (navigator.mimeTypes.length + navigator.userAgent.length).toString(36) +
        (function (t) {
          var e = [];
          for (var r in n) e.push(r);
          return e.length.toString(36);
        })()),
      (new Array(5).join("0") + e).slice(-4)),
    i = n.screen.width.toString(36),
    o = n.screen.height.toString(36),
    g = n.screen.availWidth.toString(36),
    a = n.screen.availHeight.toString(36),
    h = n.screen.colorDepth.toString(36),
    l = n.screen.pixelDepth.toString(36);
  return btoa(r + i + o + g + a + h + l);
}
