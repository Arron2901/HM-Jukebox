import React from 'react'

/**
 * Embla thumbnail button – currently a placeholder image, but still exposes
 * `selected` state so the carousel UI can highlight the active slide.
 */
export const Thumb = (props) => {
  const { selected, index, onClick } = props

  return (
    <div
      className={'embla-thumbs__slide'.concat(
        selected ? ' embla-thumbs__slide--selected' : ''
      )}
    >
      <img
        onClick={onClick}
        type="button"
        className="embla-thumbs__slide__number"
        src='https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045'
        alt={`Embla slide thumbnail ${index}`}
      >
      </img>
    </div>
  )
}
