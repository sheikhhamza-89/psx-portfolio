export function Toast({ message, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? 'show' : ''}`}>
      {message}
    </div>
  )
}

