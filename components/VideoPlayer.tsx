import React from 'react'
import { FaTimes } from 'react-icons/fa'

interface VideoPlayerProps {
  movieId: string
  title: string
  onClose: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId, title, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative w-full max-w-5xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors"
          aria-label="Close video"
        >
          <FaTimes />
        </button>
        <div className="aspect-video bg-black">
          {/* Here you would normally integrate with a video provider like YouTube, Vimeo, etc. */}
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-gray-400 mb-4">
              {`Video player for "${title}" (ID: ${movieId})`}
            </p>
            <p className="text-gray-500 text-sm">
              This is a placeholder. In a production app, you would integrate with a video service API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer 