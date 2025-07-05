'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, UserCheck, Smartphone, Download } from 'react-feather'
import { useEffect, useState } from 'react'

interface WelcomeScreenProps {
  onStartInterview: () => void
}

export default function WelcomeScreen({ onStartInterview }: WelcomeScreenProps) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Detect mobile platform
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    
    // Show install prompt for mobile users
    if (isIOSDevice || isAndroidDevice) {
      setShowInstallPrompt(true)
    }

    // Handle beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallButton(false)
        setShowInstallPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UserCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Medical History Interview
          </h1>
          <p className="text-gray-600 text-lg">
            Your AI care team is ready to help
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-accent-teal rounded-full flex items-center justify-center bg-opacity-20">
              <Clock className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Quick & Efficient</h3>
              <p className="text-gray-600 text-sm">Takes approximately 5-10 minutes</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Private & Secure</h3>
              <p className="text-gray-600 text-sm">Your information is protected and confidential</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-accent-pink rounded-full flex items-center justify-center bg-opacity-20">
              <UserCheck className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Comprehensive</h3>
              <p className="text-gray-600 text-sm">Covers all essential medical history areas</p>
            </div>
          </motion.div>
        </div>

        {/* Install App Prompt for Mobile */}
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Install App for Better Experience</h3>
                {isIOS ? (
                  <p className="text-blue-800 text-sm">
                    Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong> to install this app.
                  </p>
                ) : isAndroid ? (
                  <p className="text-blue-800 text-sm">
                    Look for the <strong>"Install"</strong> option in your browser menu (⋮) or address bar to add this app to your home screen.
                  </p>
                ) : (
                  <p className="text-blue-800 text-sm">
                    Install this app for a better mobile experience and offline access.
                  </p>
                )}
                {showInstallButton && (
                  <button
                    onClick={handleInstallClick}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* What to expect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-brand-secondary rounded-lg p-4 mb-8"
        >
          <h3 className="font-semibold text-primary mb-2">What to expect:</h3>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Natural voice conversation with our AI interviewer</li>
            <li>• Questions about your medical history and current health</li>
            <li>• Real-time transcription of your responses</li>
            <li>• Summary and next steps at the end</li>
          </ul>
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartInterview}
          className="btn-primary w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg"
        >
          <span>Start Interview</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Privacy notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center text-gray-500 text-xs mt-4"
        >
          By starting the interview, you agree to our privacy policy and terms of service.
        </motion.p>
      </motion.div>
    </div>
  )
} 