export default function Loader({ label = 'Chargement', fullScreen = true }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 60,
        minHeight: fullScreen ? '60vh' : undefined,
      }}
    >
      <div className="loader-ring" />
      <div className="loader-label">{label}</div>
    </div>
  )
}
