// Analytics helper - tracks key conversion events
export function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params)
  }
}

// Pre-defined events
export const analytics = {
  pageView: (page) => trackEvent('page_view', { page_title: page }),
  premiumClick: () => trackEvent('premium_click', { value: 4.99 }),
  messagesSent: (count) => trackEvent('messages_sent', { count }),
  iaUsed: (iaName) => trackEvent('ia_used', { ia_name: iaName }),
  scannerUsed: () => trackEvent('scanner_used'),
  shopClick: (store) => trackEvent('shop_click', { store }),
  affiliateClick: (url) => trackEvent('affiliate_click', { url }),
}
