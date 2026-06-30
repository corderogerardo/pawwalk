// android-frame.jsx — Android (Material 3) device frame. Self-contained.
// Exports AndroidDevice + AndroidStatusBar to window. Pass screen content as children.
const h = React.createElement;

function AndroidStatusBar({ dark = false, time = '9:30' }) {
  const c = dark ? '#FFFFFF' : '#111826';
  return h('div', {
    style: {
      height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px 0 22px', position: 'relative', flexShrink: 0, zIndex: 20,
      fontFamily: 'Roboto, system-ui, sans-serif',
    },
  },
    h('span', { style: { fontSize: 13, fontWeight: 600, letterSpacing: 0.2, color: c } }, time),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
      h('svg', { width: 15, height: 12, viewBox: '0 0 16 16' }, h('path', { d: 'M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z', fill: c })),
      h('svg', { width: 14, height: 12, viewBox: '0 0 16 16' }, h('path', { d: 'M14.67 14.67V1.33L1.33 14.67h13.34z', fill: c })),
      h('svg', { width: 15, height: 12, viewBox: '0 0 16 16' },
        h('rect', { x: 3.4, y: 2, width: 9.2, height: 13, rx: 1.6, fill: c }),
        h('rect', { x: 5.4, y: 0.8, width: 5.2, height: 2, rx: 0.5, fill: c })
      )
    )
  );
}

function AndroidDevice({ children, width = 412, height = 892, dark = false, time = '9:30' }) {
  return h('div', {
    style: {
      width, height, borderRadius: 44, background: dark ? '#0A0A0A' : '#F6F4ED',
      boxShadow: '0 50px 90px -24px rgba(17,24,38,0.40), 0 0 0 9px #0A0A0A, 0 0 0 10px rgba(17,24,38,0.18)',
      overflow: 'hidden', boxSizing: 'border-box', position: 'relative', flexShrink: 0,
      fontFamily: 'Roboto, system-ui, sans-serif',
    },
  },
    h('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' } },
      h(AndroidStatusBar, { dark, time }),
      // camera punch hole
      h('div', {
        style: {
          position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
          width: 13, height: 13, borderRadius: 100, background: '#0A0A0A', zIndex: 30,
        },
      }),
      // content
      h('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' } }, children),
      // gesture nav pill
      h('div', { style: { height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
        h('div', { style: { width: 120, height: 4, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,38,0.35)' } })
      )
    )
  );
}

if (typeof window !== 'undefined') { window.AndroidDevice = AndroidDevice; window.AndroidStatusBar = AndroidStatusBar; }
