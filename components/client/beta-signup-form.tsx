"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BetaSignupFormProps {
  variant?: "default" | "compact"
  className?: string
}

export function BetaSignupForm({ variant = "default", className = "" }: BetaSignupFormProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const checkRateLimit = (): boolean => {
    const time = new Date()
    const timestamp = time.valueOf()
    const previousTimestamp = localStorage.getItem("loops-form-timestamp")

    // If last sign up was less than a minute ago, show rate limit error
    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      setErrorMessage("Too many signups, please try again in a little while")
      return true
    }
    
    localStorage.setItem("loops-form-timestamp", String(timestamp))
    return false
  }

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    // Reset previous error
    setErrorMessage("")

    // Check rate limiting
    if (checkRateLimit()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const formBody = `userGroup=landingpage-signups&mailingLists=&email=${encodeURIComponent(email)}`
      
      const response = await fetch("https://app.loops.so/api/newsletter-form/cmeipigisb5pezp0im69quneg", {
        method: "POST",
        body: formBody,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })

      if (response.ok) {
        setIsSubmitted(true)
        setEmail("")
      } else {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(data.message || response.statusText || "Something went wrong, please try again")
      }
    } catch (error) {
      console.error("Beta signup error:", error)
      
      // Check for cloudflare/network error
      if (error instanceof Error && error.message === "Failed to fetch") {
        setErrorMessage("Too many signups, please try again in a little while")
      } else {
        setErrorMessage("Something went wrong, please try again")
      }
      
      // Clear timestamp on error to allow retry
      localStorage.setItem("loops-form-timestamp", '')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setErrorMessage("")
    setEmail("")
  }

  const isCompact = variant === "compact"
  
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <AnimatePresence mode="wait">
        {!isSubmitted && !errorMessage ? (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleBetaSignup} 
            className="space-y-4"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              size={isCompact ? "sm" : "default"}
            >
              {isSubmitting ? "Signing up..." : "Join Waitlist"}
            </Button>
          </motion.form>
        ) : isSubmitted ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="text-center p-6 bg-card border border-border rounded-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Thanks! We'll be in touch!</h3>
            <p className="text-muted-foreground">
              You've been added to our beta waitlist. We'll notify you when it's ready!
            </p>
            <button
              onClick={handleReset}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer transition-colors duration-200"
            >
              ← Back
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="text-center p-6 bg-card border border-destructive/20 rounded-lg"
          >
            <Mail className="h-8 w-8 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Oops! Something went wrong</h3>
            <p className="text-destructive mb-4">
              {errorMessage}
            </p>
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer transition-colors duration-200"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}