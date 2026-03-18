import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[MAESTROMIND] Erreur capturée par ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const styles = {
      wrapper: {
        minHeight: '100vh',
        backgroundColor: '#06080D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      },
      card: {
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#0D1117',
        border: '1px solid #C9A84C33',
        borderRadius: '16px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 0 40px #C9A84C18',
      },
      logoWrapper: { marginBottom: '28px' },
      logoText: {
        fontSize: '22px',
        fontWeight: '700',
        letterSpacing: '0.12em',
        color: '#C9A84C',
        textTransform: 'uppercase',
      },
      logoSubText: {
        fontSize: '11px',
        letterSpacing: '0.25em',
        color: '#C9A84C88',
        textTransform: 'uppercase',
        marginTop: '4px',
      },
      divider: {
        width: '48px',
        height: '2px',
        backgroundColor: '#C9A84C',
        margin: '0 auto 28px auto',
        borderRadius: '2px',
      },
      title: { fontSize: '18px', fontWeight: '600', color: '#E8E8E8', marginBottom: '12px' },
      subtitle: { fontSize: '13px', color: '#888', marginBottom: '24px', lineHeight: '1.6' },
      errorBox: {
        backgroundColor: '#12060699',
        border: '1px solid #C9A84C22',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '32px',
        textAlign: 'left',
      },
      errorLabel: {
        fontSize: '10px',
        letterSpacing: '0.18em',
        color: '#C9A84C',
        textTransform: 'uppercase',
        marginBottom: '6px',
      },
      errorMessage: { fontSize: '12px', color: '#cc6666', fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: '1.5' },
      buttonsWrapper: { display: 'flex', flexDirection: 'column', gap: '12px' },
      btnPrimary: {
        width: '100%',
        padding: '13px 20px',
        backgroundColor: '#C9A84C',
        color: '#06080D',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '0.06em',
        cursor: 'pointer',
      },
      btnSecondary: {
        width: '100%',
        padding: '13px 20px',
        backgroundColor: 'transparent',
        color: '#C9A84C',
        border: '1px solid #C9A84C55',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
      },
    }

    const errorMessage = this.state.error?.message || 'Erreur inconnue'

    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoText}>MAESTROMIND</div>
            <div style={styles.logoSubText}>IA Bâtiment</div>
          </div>
          <div style={styles.divider} />
          <div style={styles.title}>Une erreur est survenue</div>
          <div style={styles.subtitle}>
            L'application a rencontré un problème inattendu.<br />
            Rechargez la page ou effacez les données pour continuer.
          </div>
          <div style={styles.errorBox}>
            <div style={styles.errorLabel}>Détail de l'erreur</div>
            <div style={styles.errorMessage}>{errorMessage}</div>
          </div>
          <div style={styles.buttonsWrapper}>
            <button
              style={styles.btnPrimary}
              onClick={() => window.location.reload()}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Recharger l'application
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => { localStorage.clear(); window.location.reload() }}
            >
              Effacer les données
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
