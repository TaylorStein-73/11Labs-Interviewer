import { useEffect, useState } from 'react'

export const useTypingEffect = (
  text: string,
  duration: number = 50,
  isTypeByLetter = false
) => {
  const [currentPosition, setCurrentPosition] = useState(0)
  const [prevComplete, setPrevComplete] = useState('')

  const items = isTypeByLetter ? text.split('') : text.split(' ')

  // Reset animation when new text arrives but keep previous complete caption
  useEffect(() => {
    setCurrentPosition(0)
  }, [text])

  // Advance the typing animation
  useEffect(() => {
    if (currentPosition >= items.length) {
      // Animation finished – store as the previous full sentence
      const complete = items.join(isTypeByLetter ? '' : ' ')
      if (complete.trim()) setPrevComplete(complete)
      return
    }

    const id = setInterval(() => {
      setCurrentPosition((pos) => pos + 1)
    }, duration)

    return () => clearInterval(id)
  }, [currentPosition, items, duration, isTypeByLetter])

  // If we haven’t started typing the new text yet, show the previous sentence
  if (currentPosition === 0) return prevComplete

  return items
    .slice(0, currentPosition)
    .join(isTypeByLetter ? '' : ' ')
}
