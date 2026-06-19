export default function FilterButton({ active, children, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-ghost btn-sm${active ? ' active' : ''}`}
      style={{ justifyContent: 'center', ...style }}
    >
      {children}
    </button>
  )
}
