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
  const [showStickyButton, setShowStickyButton] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const handleStartInterview = () => {
    setIsFadingOut(true)
    // Delay the actual phase change to allow fade-out animation
    setTimeout(() => {
      onStartInterview()
    }, 500)
  }

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

    // Handle scroll to show/hide sticky button
    const handleScroll = () => {
      const scrolled = window.scrollY > 200
      setShowStickyButton(scrolled)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('scroll', handleScroll)
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
    <>
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isFadingOut ? 0 : 1, y: 0 }}
          transition={{ duration: isFadingOut ? 0.5 : 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <UserCheck className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary mb-1">
              Medical History Interview
            </h1>
            <p className="text-gray-600">
              Your AI care team is ready to help
            </p>
          </div>

          {/* Start Button - Moved to top for mobile visibility */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartInterview}
            className="btn-primary w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg mb-6"
          >
            <span>Start Interview</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Features - Condensed */}
          <div className="space-y-3 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary text-sm">Quick & Efficient</h3>
                <p className="text-gray-600 text-xs">Takes approximately 5-10 minutes</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary text-sm">Private & Secure</h3>
                <p className="text-gray-600 text-xs">Your information is protected and confidential</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary text-sm">Comprehensive</h3>
                <p className="text-gray-600 text-xs">Covers all essential medical history areas</p>
              </div>
            </motion.div>
          </div>

          {/* Install App Prompt for Mobile - Condensed */}
          {showInstallPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
            >
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1 text-sm">Install App</h3>
                  {isIOS ? (
                    <p className="text-blue-800 text-xs">
                      Tap <strong>Share</strong> → <strong>"Add to Home Screen"</strong>
                    </p>
                  ) : isAndroid ? (
                    <p className="text-blue-800 text-xs">
                      Look for <strong>"Install"</strong> in browser menu (⋮)
                    </p>
                  ) : (
                    <p className="text-blue-800 text-xs">
                      Install for better mobile experience
                    </p>
                  )}
                  {showInstallButton && (
                    <button
                      onClick={handleInstallClick}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* What to expect - Condensed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-brand-secondary rounded-lg p-3 mb-4"
          >
            <h3 className="font-semibold text-primary mb-2 text-sm">What to expect:</h3>
            <ul className="text-gray-600 text-xs space-y-1">
              <li>• Natural voice conversation</li>
              <li>• Medical history questions</li>
              <li>• Real-time transcription</li>
              <li>• Summary and next steps</li>
            </ul>
          </motion.div>

          {/* Privacy notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-center text-gray-500 text-xs"
          >
            By starting, you agree to our privacy policy and terms of service.
          </motion.p>
        </motion.div>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      {showStickyButton && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden"
        >
          <button
            onClick={handleStartInterview}
            className="btn-primary w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2"
          >
            <span>Start Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </>
  )
} 