// ios-frame.jsx — iOS 26 device frame (Liquid Glass status bar). Self-contained.
// Exports IOSDevice + IOSStatusBar to window. Pass screen content as children.
const h = React.createElement;

function IOSStatusBar({ dark = false, time = '9:41' }) {
  const c = dark ? '#FFFFFF' : '#0A0A0A';
  return h('div', {
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '17px 34px 0', height: 54, boxSizing: 'border-box',
      position: 'relative', zIndex: 20, width: '100%',
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    },
  },
    h('span', { style: { fontWeight: 600, fontSize: 16, letterSpacing: 0.2, color: c, width: 54 } }, time),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 7 } },
      h('svg', { width: 18, height: 12, viewBox: '0 0 18 12' },
        h('rect', { x: 0, y: 7.5, width: 3, height: 4.5, rx: 0.7, fill: c }),
        h('rect', { x: 4.5, y: 5, width: 3, height: 7, rx: 0.7, fill: c }),
        h('rect', { x: 9, y: 2.5, width: 3, height: 9.5, rx: 0.7, fill: c }),
        h('rect', { x: 13.5, y: 0, width: 3, height: 12, rx: 0.7, fill: c })
      ),
      h('svg', { width: 16, height: 12, viewBox: '0 0 16 12' },
        h('path', { d: 'M8 3C10.2 3 12.2 3.9 13.6 5.3L14.7 4.2C13 2.5 10.6 1.4 8 1.4C5.4 1.4 3 2.5 1.3 4.2L2.4 5.3C3.8 3.9 5.8 3 8 3Z', fill: c }),
        h('path', { d: 'M8 6.4C9.3 6.4 10.5 6.9 11.3 7.8L12.4 6.7C11.2 5.5 9.7 4.8 8 4.8C6.3 4.8 4.8 5.5 3.6 6.7L4.7 7.8C5.5 6.9 6.7 6.4 8 6.4Z', fill: c }),
        h('circle', { cx: 8, cy: 10, r: 1.4, fill: c })
      ),
      h('svg', { width: 26, height: 13, viewBox: '0 0 26 13' },
        h('rect', { x: 0.5, y: 0.5, width: 22, height: 12, rx: 3.5, stroke: c, strokeOpacity: 0.35, fill: 'none' }),
        h('rect', { x: 2, y: 2, width: 19, height: 9, rx: 2, fill: c }),
        h('path', { d: 'M24 4.5V8.5C24.8 8.2 25.4 7.4 25.4 6.5C25.4 5.6 24.8 4.8 24 4.5Z', fill: c, fillOpacity: 0.4 })
      )
    )
  );
}

function IOSDevice({ children, width = 402, height = 874, dark = false, time = '9:41' }) {
  return h('div', {
    style: {
      width, height, borderRadius: 56, position: 'relative', background: '#0A0A0A',
      boxShadow: '0 50px 90px -24px rgba(17,24,38,0.40), 0 0 0 1px rgba(17,24,38,0.10)',
      overflow: 'hidden', flexShrink: 0,
    },
  },
    // inner screen
    h('div', {
      style: {
        position: 'absolute', inset: 6, borderRadius: 50, overflow: 'hidden',
        background: dark ? '#0A0A0A' : '#F6F4ED',
      },
    },
      // content (fills; manages its own top inset via padding)
      h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden' } }, children),
      // status bar
      h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 } },
        h(IOSStatusBar, { dark, time })
      ),
      // dynamic island
      h('div', {
        style: {
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 122, height: 35, borderRadius: 20, background: '#0A0A0A', zIndex: 30,
        },
      }),
      // home indicator
      h('div', {
        style: {
          position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex',
          justifyContent: 'center', zIndex: 40, pointerEvents: 'none',
        },
      },
        h('div', { style: { width: 134, height: 5, borderRadius: 100, background: dark ? 'rgba(255,255,255,0.55)' : 'rgba(17,24,38,0.28)' } })
      )
    )
  );
}

if (typeof window !== 'undefined') { window.IOSDevice = IOSDevice; window.IOSStatusBar = IOSStatusBar; }
