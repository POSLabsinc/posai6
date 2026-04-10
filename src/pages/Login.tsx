import { useCallback, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, UtensilsCrossed, Zap, Users, Truck, ShieldCheck, ArrowLeft, Delete, Loader2, Clock, MapPin, Briefcase, CheckCircle2, Monitor, Smartphone, KeyRound, AlertCircle, Send, ShieldX, Mail, MessageSquare, RefreshCw, Lock, Eye, EyeOff, Sun, Moon, Sunrise, Sunset, Fingerprint, ScanFace, Phone, X, ScanLine, Camera, HelpCircle, Info, FlaskConical, Timer, Wine, ChefHat, Sparkles, Link2, UserPlus, ChevronDown, ChevronLeft, LayoutGrid, CreditCard, BarChart3, Settings, ChevronRight, Building2, Search, LogIn } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import eatosLogo from "@/assets/icons/posai-logo.png";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactAdminDialog from "@/components/ContactAdminDialog";
import { NumericKeypad } from "@/components/NumericKeypad";
import InlineIOSKeyboard from "@/components/InlineIOSKeyboard";
import { DeviceSetupLayout } from "@/components/DeviceSetupLayout";
import { PersonalDeviceAuthPanel } from "@/components/PersonalDeviceAuthPanel";
import { SplashScreen } from "@/components/SplashScreen";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import DeviceSetupAIChat from "@/components/DeviceSetupAIChat";
import BusinessSearchOnboarding from "@/components/BusinessSearchOnboarding";
import MerchantOnboarding from "@/components/MerchantOnboarding";
import { countryCodes } from "@/components/CountryCodeSelector";
import DeviceSetupTutorialOverlay from "@/components/DeviceSetupTutorialOverlay";


import { revenueCenters, employeePinMapping, locationEmployees, getRoleIcon, getRoleBadgeStyle, getTimeOfDayInfo, PIN_LENGTH, DeviceType } from "@/data/loginData";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deviceType, setDeviceType] = useState<DeviceType>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const [pendingDeviceType, setPendingDeviceType] = useState<DeviceType>(null);
  const [userType, setUserType] = useState<"new" | "existing" | null>(null);
  const [showDeviceConnected, setShowDeviceConnected] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof locationEmployees[0] | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showClockIn, setShowClockIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Personal device states
  const [personalActivationApproach, setPersonalActivationApproach] = useState<"ai" | "manual" | null>(null);
  const [deviceCode, setDeviceCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [showIdentityVerification, setShowIdentityVerification] = useState(false);
  const [invitedUser, setInvitedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [identityBlocked, setIdentityBlocked] = useState(false);
  
  // 2FA OTP states
  const [show2FA, setShow2FA] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"sms" | "email" | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showOtpSuccess, setShowOtpSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Login credentials states
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPolicy2FA, setRequiresPolicy2FA] = useState(true); // Based on org policy
  
  // Personal device clock-in states
  const [showPersonalPinEntry, setShowPersonalPinEntry] = useState(false);
  const [personalPin, setPersonalPin] = useState("");
  const [personalPinError, setPersonalPinError] = useState("");
  const [isVerifyingPersonalPin, setIsVerifyingPersonalPin] = useState(false);
  const [showPersonalClockIn, setShowPersonalClockIn] = useState(false);
  const [personalClockInTime, setPersonalClockInTime] = useState<Date | null>(null);
  const [showPersonalSuccess, setShowPersonalSuccess] = useState(false);
  
  // Personal device clock-out states
  const [showPersonalClockOut, setShowPersonalClockOut] = useState(false);
  const [personalClockOutTime, setPersonalClockOutTime] = useState<Date | null>(null);
  const [showClockOutSuccess, setShowClockOutSuccess] = useState(false);
  
  // Help tooltip auto-show state
  const [helpTooltipOpen, setHelpTooltipOpen] = useState(false);
  const [helpTooltipInteracted, setHelpTooltipInteracted] = useState(false);

  // Organization policy: post clock-out behavior
  // "logout" = return to device selection (logged-out state)
  // "home" = return to home screen but still require re-auth on next action
  const [postClockOutPolicy] = useState<"logout" | "home">("logout"); // Based on org policy
  
  // Contact admin dialog state
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  
  // Company Device - First-time device setup state
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
const [activationMethod, setActivationMethod] = useState<"code" | "link" | "password" | "signup" | null>(null);
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupCountry, setSignupCountry] = useState("United States");
  const [signupAgreed, setSignupAgreed] = useState(false);
  const [signupStep, setSignupStep] = useState<"form" | "otp" | "trial" | "business" | "onboarding">("form");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupVerifyingOtp, setSignupVerifyingOtp] = useState(false);
  const [signupOtpResendCooldown, setSignupOtpResendCooldown] = useState(0);
  const [trialStepIndex, setTrialStepIndex] = useState(0);
  const [activationApproach, setActivationApproach] = useState<"ai" | "manual" | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationContactValue, setActivationContactValue] = useState("");
  const [activationContactType, setActivationContactType] = useState<"email" | "phone">("email");
  const [activationCodeSent, setActivationCodeSent] = useState(false);
  const [activationSendingCode, setActivationSendingCode] = useState(false);
  
  // Device activation - QR/Email verification states
  const [ownerContact, setOwnerContact] = useState("");
  const [ownerContactType, setOwnerContactType] = useState<"email" | "phone">("email");
  const [ownerSelectedCountry, setOwnerSelectedCountry] = useState(countryCodes[0]);
  const [showOwnerCountryPicker, setShowOwnerCountryPicker] = useState(false);
  const [ownerCountrySearch, setOwnerCountrySearch] = useState("");
  const ownerCountryRef = useRef<HTMLDivElement>(null);
  const [ownerCodeSent, setOwnerCodeSent] = useState(false);
  const [ownerSendingCode, setOwnerSendingCode] = useState(false);
  const [ownerVerificationCode, setOwnerVerificationCode] = useState("");
  const [ownerVerifyingCode, setOwnerVerifyingCode] = useState(false);
  const [ownerVerificationError, setOwnerVerificationError] = useState("");
  const [ownerResendCooldown, setOwnerResendCooldown] = useState(0);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceNameError, setDeviceNameError] = useState("");
  
  // Existing user sign-in states (reusing same activate device UI)
  const [existingUserSignInTab, setExistingUserSignInTab] = useState<"code" | "link">("code");
  const [existingUserSelectedOption, setExistingUserSelectedOption] = useState<"code" | "link" | "demo" | null>(null);
  const [existingUserContact, setExistingUserContact] = useState("");
  const [existingUserLinkContact, setExistingUserLinkContact] = useState("");
  const [existingUserLinkSent, setExistingUserLinkSent] = useState(false);
  const [existingUserLinkSending, setExistingUserLinkSending] = useState(false);
  const [existingUserLinkResendCooldown, setExistingUserLinkResendCooldown] = useState(0);
  const [existingUserContactType, setExistingUserContactType] = useState<"email" | "phone">("email");
  const [existingUserSelectedCountry, setExistingUserSelectedCountry] = useState(countryCodes[0]);
  const [showExistingUserCountryPicker, setShowExistingUserCountryPicker] = useState(false);
  const [existingUserCountrySearch, setExistingUserCountrySearch] = useState("");
  const existingUserCountryRef = useRef<HTMLDivElement>(null);
  const [existingUserCodeSent, setExistingUserCodeSent] = useState(false);
  const [existingUserSendingCode, setExistingUserSendingCode] = useState(false);
  const [existingUserVerificationCode, setExistingUserVerificationCode] = useState("");
  const [existingUserVerifyingCode, setExistingUserVerifyingCode] = useState(false);
  const [existingUserVerificationError, setExistingUserVerificationError] = useState("");
  const [existingUserResendCooldown, setExistingUserResendCooldown] = useState(0);
  const [existingUserVerified, setExistingUserVerified] = useState(false);
  
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [generatedDeviceCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  });
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [selectedDemoBusinessType, setSelectedDemoBusinessType] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoEmailVerified, setDemoEmailVerified] = useState(false);
  const [demoOtpSent, setDemoOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [demoOtpError, setDemoOtpError] = useState("");
  const [demoSendingOtp, setDemoSendingOtp] = useState(false);
  const [demoVerifyingOtp, setDemoVerifyingOtp] = useState(false);
  const [demoOtpResendCooldown, setDemoOtpResendCooldown] = useState(0);
  const [demoOtpResendCount, setDemoOtpResendCount] = useState(0);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkPhone, setMagicLinkPhone] = useState("");
  const [magicLinkInputType, setMagicLinkInputType] = useState<"email" | "phone">("email");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkResendCooldown, setMagicLinkResendCooldown] = useState(0);
  const [magicLinkResendCount, setMagicLinkResendCount] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showDemoEmailKeyboard, setShowDemoEmailKeyboard] = useState(false);
  const [showAdminEmailKeyboard, setShowAdminEmailKeyboard] = useState(false);
  const [showVerificationEmailKeyboard, setShowVerificationEmailKeyboard] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState("");
  const [forgotPasswordKeyboardField, setForgotPasswordKeyboardField] = useState<"none" | "email" | "phone">("none");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpMethod, setResetOtpMethod] = useState<"email" | "phone" | null>(null);
  const [resetOtp, setResetOtp] = useState("");
  const [resetOtpError, setResetOtpError] = useState("");
  const [isVerifyingResetOtp, setIsVerifyingResetOtp] = useState(false);
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [resetResendCooldown, setResetResendCooldown] = useState(0);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  
  // Live clock state for context panel
  const [currentTime, setCurrentTime] = useState(new Date());
  // CRITICAL: Clear sessions SYNCHRONOUSLY before first render
  // This ensures no redirects can happen before sessions are cleared
  // Using useRef to ensure this only runs once
  const hasCleared = useRef(false);
  if (!hasCleared.current) {
    hasCleared.current = true;
    localStorage.removeItem("pos_device_session");
    localStorage.removeItem("pos_session");
  }

  useEffect(() => {
    // Reset all state to initial values on mount
    setDeviceType(null);
    setSelectedEmployee(null);
    setPin("");
    setPinError("");
    setIsVerifying(false);
    setShowClockIn(false);
    setClockInTime(null);
    setShowSuccess(false);
    setDeviceCode("");
    setCodeError("");
    setIsVerifyingCode(false);
    setShowRequestAccess(false);
    setAccessRequested(false);
    setShowIdentityVerification(false);
    setInvitedUser(null);
    setVerificationEmail("");
    setIdentityError("");
    setIsVerifyingIdentity(false);
    setIdentityBlocked(false);
    setShow2FA(false);
    setOtpMethod(null);
    setOtp("");
    setOtpError("");
    setIsVerifyingOtp(false);
    setOtpSent(false);
    setResendCooldown(0);
    setLoginPassword("");
    setShowPassword(false);
    setShowPersonalClockIn(false);
    setPersonalClockInTime(null);
    setShowPersonalSuccess(false);
    setShowPersonalClockOut(false);
    setPersonalClockOutTime(null);
    setShowClockOutSuccess(false);
    setShowContactAdmin(false);
    setActivationApproach(null);
    setPersonalActivationApproach(null);
    setShowDemoEmailKeyboard(false);
    setShowAdminEmailKeyboard(false);
    setShowVerificationEmailKeyboard(false);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Magic link resend cooldown timer
  useEffect(() => {
    if (magicLinkResendCooldown > 0) {
      const timer = setTimeout(() => setMagicLinkResendCooldown(magicLinkResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [magicLinkResendCooldown]);

  // Demo OTP resend cooldown timer
  useEffect(() => {
    if (demoOtpResendCooldown > 0) {
      const timer = setTimeout(() => setDemoOtpResendCooldown(demoOtpResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [demoOtpResendCooldown]);

  // Signup OTP resend cooldown timer
  useEffect(() => {
    if (signupOtpResendCooldown > 0) {
      const timer = setTimeout(() => setSignupOtpResendCooldown(signupOtpResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [signupOtpResendCooldown]);

  // Reset password resend cooldown timer
  useEffect(() => {
    if (resetResendCooldown > 0) {
      const timer = setTimeout(() => setResetResendCooldown(resetResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetResendCooldown]);

  // Owner verification resend cooldown timer
  useEffect(() => {
    if (ownerResendCooldown > 0) {
      const timer = setTimeout(() => setOwnerResendCooldown(ownerResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ownerResendCooldown]);

  // Existing user resend cooldown timer
  useEffect(() => {
    if (existingUserResendCooldown > 0) {
      const timer = setTimeout(() => setExistingUserResendCooldown(existingUserResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [existingUserResendCooldown]);

  // Existing user link resend cooldown timer
  useEffect(() => {
    if (existingUserLinkResendCooldown > 0) {
      const timer = setTimeout(() => setExistingUserLinkResendCooldown(existingUserLinkResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [existingUserLinkResendCooldown]);

  // Reset OTP timer (5 minute countdown)
  useEffect(() => {
    if (resetOtpTimer > 0) {
      const timer = setTimeout(() => setResetOtpTimer(resetOtpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetOtpTimer]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Auto-show help tooltip after 3 seconds for first-time visitors
  useEffect(() => {
    if (deviceType === "personal" && !showQRScanner && !helpTooltipInteracted) {
      const timer = setTimeout(() => {
        setHelpTooltipOpen(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setHelpTooltipOpen(false), 5000);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [deviceType, showQRScanner, helpTooltipInteracted]);

  // Keep inline email keyboards visible by default on email entry screens
  useEffect(() => {
    if (activationMethod === "password") {
      setShowAdminEmailKeyboard(true);
    } else {
      setShowAdminEmailKeyboard(false);
    }
  }, [activationMethod]);

  useEffect(() => {
    if (showIdentityVerification && !identityBlocked) {
      setShowVerificationEmailKeyboard(true);
    } else {
      setShowVerificationEmailKeyboard(false);
    }
  }, [showIdentityVerification, identityBlocked]);

  useEffect(() => {
    if (showDemoMode && !demoEmailVerified && !demoOtpSent) {
      setShowDemoEmailKeyboard(true);
    } else {
      setShowDemoEmailKeyboard(false);
    }
  }, [showDemoMode, demoEmailVerified, demoOtpSent]);

  useEffect(() => {
    if (showForgotPassword && !resetOtpSent && !showNewPasswordForm) {
      setForgotPasswordKeyboardField((prev) => (prev === "none" ? "email" : prev));
    }
  }, [showForgotPassword, resetOtpSent, showNewPasswordForm]);

  const handleVerifyDeviceCode = useCallback(() => {
    if (!deviceCode.trim()) {
      setCodeError("Please enter a device code");
      return;
    }
    
    // Normalize code by removing dashes for comparison
    const normalizedCode = deviceCode.replace(/-/g, '');
    
    // Accept any 6-digit code for demo purposes
    if (normalizedCode.length !== 6 || !/^\d{6}$/.test(normalizedCode)) {
      setCodeError("Please enter a valid 6-digit code");
      return;
    }
    
    setIsVerifyingCode(true);
    setCodeError("");
    
    // Simulate code verification - any 6-digit code is accepted
    setTimeout(() => {
      // Code is valid - show identity verification
      setIsVerifyingCode(false);
      setInvitedUser({
        name: "Alex Johnson",
        email: "alex.johnson@restaurant.com",
        role: "Manager"
      });
      setShowIdentityVerification(true);
    }, 1000);
  }, [deviceCode]);

  const handleVerifyIdentity = useCallback(() => {
    if (!verificationEmail.trim()) {
      setIdentityError("Please enter your email address");
      return;
    }
    if (!loginPassword.trim()) {
      setIdentityError("Please enter your password");
      return;
    }
    
    setIsVerifyingIdentity(true);
    setIdentityError("");
    
    setTimeout(() => {
      // Mock identity verification - email must match invited user, password is "password123"
      if (verificationEmail.toLowerCase() === invitedUser?.email.toLowerCase()) {
        if (loginPassword === "password123") {
          // Identity confirmed - check if 2FA is required by policy
          setIsVerifyingIdentity(false);
          if (requiresPolicy2FA) {
            setShow2FA(true);
          } else {
            // No 2FA required - proceed to clock-in confirmation
            setPersonalClockInTime(new Date());
            setShowPersonalClockIn(true);
          }
        } else {
          setIsVerifyingIdentity(false);
          setIdentityError("Incorrect password");
        }
      } else {
        setIsVerifyingIdentity(false);
        setIdentityError("Email doesn't match invited user");
        setIdentityBlocked(true);
      }
    }, 1000);
  }, [verificationEmail, loginPassword, invitedUser, requiresPolicy2FA, toast, navigate]);

  const handleSendOtp = useCallback((method: "sms" | "email") => {
    setOtpMethod(method);
    setOtpSent(true);
    setResendCooldown(30);
    setOtp("");
    setOtpError("");
    toast({
      title: "Verification code sent",
      description: method === "sms" ? "Check your phone for the code" : "Check your email for the code"
    });
  }, [toast]);

  const handleResendOtp = useCallback(() => {
    if (resendCooldown > 0 || !otpMethod) return;
    setResendCooldown(30);
    setOtp("");
    setOtpError("");
    toast({
      title: "Code resent",
      description: otpMethod === "sms" ? "Check your phone" : "Check your email"
    });
  }, [resendCooldown, otpMethod, toast]);

  const handleVerifyOtp = useCallback(() => {
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code");
      return;
    }
    
    setIsVerifyingOtp(true);
    setOtpError("");
    
    setTimeout(() => {
      // Accept any 6-digit code for demo purposes
      // Show success state first
      setIsVerifyingOtp(false);
      setShowOtpSuccess(true);
      
      // After success animation, trust device and navigate to Dashboard (ClockInOverlay will handle clock-in)
      setTimeout(() => {
        setShowOtpSuccess(false);
        setShow2FA(false);
        setOtpSent(false);
        setOtpMethod(null);
        setOtp("");
        // Trust the device and navigate to Dashboard
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "personal",
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      }, 1200);
    }, 800);
  }, [otp]);

  const handlePersonalClockIn = useCallback(() => {
    localStorage.setItem("pos_session", JSON.stringify({
      employeeId: "personal-1",
      employeeName: invitedUser!.name,
      employeeRole: invitedUser!.role,
      revenueCenter: "Main Dining",
      deviceType: "personal",
      loginTime: personalClockInTime!.toISOString()
    }));
    
    setShowPersonalClockIn(false);
    setShowPersonalSuccess(true);
    
    setTimeout(() => {
      navigate("/");
    }, 1500);
  }, [invitedUser, personalClockInTime, navigate]);

  const handlePersonalClockOut = useCallback(() => {
    // CRITICAL: Remove POS session immediately - never keep active after clock-out
    localStorage.removeItem("pos_session");
    
    setShowPersonalClockOut(false);
    setShowClockOutSuccess(true);
    
    // Post clock-out behavior based on organization policy
    setTimeout(() => {
      if (postClockOutPolicy === "logout") {
        // Full logout: Reset to device selection screen (logged-out state)
        setDeviceType(null);
        setShowClockOutSuccess(false);
        setInvitedUser(null);
        setPersonalClockInTime(null);
        setPersonalClockOutTime(null);
        setVerificationEmail("");
        setLoginPassword("");
        setShow2FA(false);
        setOtp("");
        setOtpSent(false);
        setShowIdentityVerification(false);
        setDeviceCode("");
        
        toast({
          title: "Session ended",
          description: "You have been logged out successfully"
        });
      } else {
        // Return to home but session is cleared - next action requires re-auth
        setShowClockOutSuccess(false);
        setShowPersonalClockIn(false);
        setPersonalClockInTime(null);
        setPersonalClockOutTime(null);
        
        // Navigate to login to re-authenticate
        toast({
          title: "Shift ended",
          description: "Please sign in again to start a new shift"
        });
      }
    }, 2500);
  }, [postClockOutPolicy, toast]);

  // Close country picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ownerCountryRef.current && !ownerCountryRef.current.contains(e.target as Node)) {
        setShowOwnerCountryPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);


  // QR Scanner handlers
  const startQRScanner = useCallback(async () => {
    setScannerError("");
    setShowQRScanner(true);
    
    // Wait for DOM to render scanner container
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        qrScannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Format the scanned code
            const rawValue = decodedText.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const formatted = rawValue.slice(0, 9).replace(/(.{3})(?=.)/g, '$1-');
            setDeviceCode(formatted);
            setCodeError("");
            setShowRequestAccess(false);
            stopQRScanner();
            toast({
              title: "QR Code scanned",
              description: "Device code captured successfully"
            });
          },
          () => {
            // Ignore scan failures (no QR code found)
          }
        );
      } catch (err) {
        console.error("QR Scanner error:", err);
        setScannerError("Unable to access camera. Please check permissions.");
      }
    }, 100);
  }, [toast]);

  const stopQRScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setShowQRScanner(false);
    setScannerError("");
  }, []);

  // Calculate shift duration
  const getShiftDuration = useCallback((startTime: Date, endTime: Date) => {
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);


  const handleRequestAccess = useCallback(() => {
    setAccessRequested(true);
    toast({
      title: "Access request sent",
      description: "Your administrator will be notified"
    });
  }, [toast]);


  const handleBackToDeviceSelection = useCallback(() => {
    setDeviceType(null);
    setSelectedEmployee(null);
    setPin("");
    setPinError("");
    setShowClockIn(false);
    setClockInTime(null);
  }, []);

const handlePinComplete = useCallback((enteredPin: string) => {
    setIsVerifying(true);
    
    // Simulate verification delay
    setTimeout(() => {
      // Look up employee by PIN (company device flow)
      const employeeId = employeePinMapping[enteredPin];
      
      if (employeeId) {
        // Find the employee from the list
        const employee = locationEmployees.find(e => e.id === employeeId);
        if (employee) {
          setSelectedEmployee(employee);
          setIsVerifying(false);
          setClockInTime(new Date());
          setShowClockIn(true);
        } else {
          setIsVerifying(false);
          setPinError("Invalid PIN");
          setPin("");
        }
      } else {
        setIsVerifying(false);
        // Generic error - don't reveal if PIN exists or not
        setPinError("Invalid PIN");
        setPin("");
      }
    }, 800);
  }, []);

  const handleConfirmClockIn = useCallback(() => {
    // Handle both company device (selectedEmployee) and personal device (invitedUser)
    const employee = selectedEmployee || (invitedUser ? {
      id: "personal-1",
      name: invitedUser.name,
      role: invitedUser.role,
      avatar: ""
    } : null);
    
    if (!employee) return;
    
    // Trust the device for future logins (company device flow)
    if (deviceType === "company") {
      localStorage.setItem("pos_device_session", JSON.stringify({
        deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        deviceType: "company",
        trustedAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
      }));
    }
    
    localStorage.setItem("pos_session", JSON.stringify({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role,
      employeeAvatar: employee.avatar || "",
      revenueCenter: selectedEmployee ? revenueCenters[selectedEmployee.id] : "Main Dining",
      deviceType: deviceType,
      loginTime: clockInTime!.toISOString()
    }));
    
    setShowClockIn(false);
    setShowSuccess(true);
    
    // Auto-transition to dashboard after delay
    setTimeout(() => {
      navigate("/");
    }, 1500);
  }, [selectedEmployee, invitedUser, clockInTime, deviceType, navigate]);

  const handleNumberPress = useCallback((num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError("");
      if (newPin.length === PIN_LENGTH) {
        handlePinComplete(newPin);
      }
    }
  }, [pin, handlePinComplete]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setPinError("");
  }, []);

  // Personal device PIN handlers
  const handlePersonalPinComplete = useCallback((enteredPin: string) => {
    setIsVerifyingPersonalPin(true);
    setPersonalPinError("");
    
    setTimeout(() => {
      // Accept any 4-digit PIN for demo purposes
      setIsVerifyingPersonalPin(false);
      // Set clock-in time and show confirmation
      setPersonalClockInTime(new Date());
      setShowPersonalPinEntry(false);
      setShowPersonalClockIn(true);
    }, 800);
  }, []);

  const handlePersonalPinPress = useCallback((num: string) => {
    if (personalPin.length < PIN_LENGTH) {
      const newPin = personalPin + num;
      setPersonalPin(newPin);
      setPersonalPinError("");
      if (newPin.length === PIN_LENGTH) {
        handlePersonalPinComplete(newPin);
      }
    }
  }, [personalPin, handlePersonalPinComplete]);

  const handlePersonalPinDelete = useCallback(() => {
    setPersonalPin(prev => prev.slice(0, -1));
    setPersonalPinError("");
  }, []);

  // Initial Splash Screen on page load
  if (showInitialSplash) {
    return (
      <SplashScreen
        duration={2500}
        onComplete={() => {
          setShowInitialSplash(false);
        }}
      />
    );
  }

  // Splash Screen - shown when tapping New User or Existing User
  if (showSplash) {
    return (
      <SplashScreen
        duration={2500}
        variant="brand"
        onComplete={() => {
          setShowSplash(false);
          if (pendingDeviceType === "company") {
            setUserType("new");
          } else if (pendingDeviceType === "personal") {
            setDeviceType("personal");
          }
          setPendingDeviceType(null);
        }}
      />
    );
  }

  // Device Connected Animation (after QR scan)
  if (showDeviceConnected) {
    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Device Connected
          </motion.h2>
          <motion.p
            className="text-sm text-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Redirecting to sign in...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Welcome Screen - New User / Existing User selection
  if (!deviceType && !userType) {
    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl px-8">
          <motion.img
            src={eatosLogo}
            alt="POS AI"
            className="w-28 h-auto mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome to Point of Sale
          </motion.h1>
          <motion.p
            className="text-sm text-foreground/40 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Select a scenario to preview the login flow
          </motion.p>

          <motion.div
            className="grid grid-cols-2 gap-4 w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => {
                setPendingDeviceType("company");
                setShowSplash(true);
              }}
              className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">New User</p>
                <p className="text-xs text-foreground/40 mt-0.5">First time activating this device</p>
              </div>
            </button>

            <button
              onClick={() => {
                setPendingDeviceType("personal");
                setShowSplash(true);
              }}
              className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <LogIn className="w-5 h-5 text-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Existing User</p>
                <p className="text-xs text-foreground/40 mt-0.5">Device already activated - sign in with PIN</p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Device Activation Screen (Spotify-style pairing) - Only for New Users
  if (!deviceType && userType === "new") {
    const activationQrValue = `posai://activate/${Date.now().toString(36)}`;

    // Auto-suggest device name from browser/OS
    const getAutoDeviceName = () => {
      const ua = navigator.userAgent;
      if (/iPad/.test(ua)) return "iPad Terminal";
      if (/iPhone/.test(ua)) return "iPhone Terminal";
      if (/Android/.test(ua)) return "Android Terminal";
      if (/Mac/.test(ua)) return "Mac Terminal";
      if (/Windows/.test(ua)) return "Windows Terminal";
      return "POS Terminal";
    };

    // Device Name step after code verification
    if (ownerVerified) {
      const handleSetDeviceNameAndContinue = () => {
        const name = deviceName.trim() || getAutoDeviceName();
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          deviceName: name,
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      };

      // Initialize device name suggestion if not already set
      if (!deviceName) {
        setTimeout(() => setDeviceName("Point of Sale"), 0);
      }

      return (
        <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-30" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md flex flex-col items-center px-6"
          >
            <motion.img
              src={eatosLogo}
              alt="POS AI"
              className="w-28 h-auto mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Set Device Name
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-foreground/50 mb-8 text-center"
            >
              Give this device a name to identify it easily
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full space-y-4"
            >
              <div className="relative">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                <Input
                  type="text"
                  placeholder="e.g. Front Counter, Bar Terminal"
                  value={deviceName}
                  onChange={(e) => {
                    setDeviceName(e.target.value);
                    setDeviceNameError("");
                  }}
                  className="pl-12 h-14 text-base rounded-2xl bg-foreground/[0.05] border-foreground/[0.1] focus:border-primary/40"
                  autoFocus
                />
              </div>

              {deviceNameError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">{deviceNameError}</p>
                </motion.div>
              )}

              <Button
                onClick={handleSetDeviceNameAndContinue}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center">
          {/* Logo + Title - Centered */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center flex flex-col items-center"
          >
            <motion.img
              src={eatosLogo}
              alt="POS AI"
              className="w-28 h-auto mb-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Activate this device
            </h1>
            <p className="text-base text-foreground/50 whitespace-nowrap">
              To start using this Point of Sale, activate your device using one of the options below
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Two-column layout - QR on left, right side toggles between Browser and Activate with Code */}
            <motion.div
              key={showOtherOptions ? "code-view" : "browser-view"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col md:flex-row items-stretch gap-0 w-full"
            >
              {/* Left: QR Code (always visible) */}
              <div className="flex-1 pr-0 md:pr-12 pb-8 md:pb-0">
                <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 1</p>
                <h2 className="text-lg md:text-xl font-bold text-foreground mb-6">Point the camera on your phone or tablet at the QR code.</h2>
                
                <div className="flex flex-col items-center gap-5">
                  <button
                    onClick={() => {
                      setShowDeviceConnected(true);
                      setDeviceName("Point of Sale");
                      setTimeout(() => {
                        setShowDeviceConnected(false);
                        setOwnerVerified(true);
                      }, 2500);
                    }}
                    className="bg-foreground rounded-2xl p-5 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <QRCodeSVG
                      value={activationQrValue}
                      size={180}
                      bgColor="hsl(0 0% 100%)"
                      fgColor="hsl(0 0% 0%)"
                      level="M"
                    />
                  </button>
                  <p className="text-sm text-foreground/50 leading-relaxed text-left w-full">
                    Tap the link that appears and follow the steps on your mobile device.
                  </p>
                </div>
              </div>

              {/* Divider with OR - vertically centered */}
              <div className="hidden md:flex flex-col items-center justify-center px-4 self-stretch">
                <div className="w-px flex-1 bg-foreground/10" />
                <span className="text-xs font-medium text-foreground/30 py-2">OR</span>
                <div className="w-px flex-1 bg-foreground/10" />
              </div>
              <div className="md:hidden flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-xs font-medium text-foreground/30">OR</span>
                <div className="flex-1 h-px bg-foreground/10" />
              </div>

              {/* Right side */}
              <div className="flex-[1.2] pl-0 md:pl-12">
                {!showOtherOptions ? (
                  /* Option 2: Browser pairing */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 2</p>
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-6">Use a browser</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <span className="text-lg font-bold text-foreground/30 mt-0.5 flex-shrink-0">1</span>
                        <div>
                          <p className="text-sm text-foreground/70 mb-2">Go to this link:</p>
                          <div className="inline-block px-5 py-2.5 rounded-xl bg-foreground/[0.08] border border-foreground/[0.1]">
                            <span className="text-base font-semibold text-foreground tracking-wide">posai.com/pair</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="text-lg font-bold text-foreground/30 mt-0.5 flex-shrink-0">2</span>
                        <div>
                          <p className="text-sm text-foreground/70 mb-3">When asked, enter this code:</p>
                          <div className="flex gap-2">
                            {generatedDeviceCode.split('').map((char, i) => (
                              <div
                                key={i}
                                className="w-12 h-14 rounded-xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center"
                              >
                                <span className="text-xl font-bold text-foreground">{char}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : !activationCodeSent ? (
                  /* Activate with Code - email/phone input */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 2</p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Activate with Code</h2>
                    <p className="text-sm text-foreground/50 mb-6">
                      Enter your email or mobile number to receive a code
                    </p>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Email or phone number"
                          value={activationContactValue}
                          onChange={(e) => setActivationContactValue(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.08] text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors text-base"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!activationContactValue.trim()) return;
                          setActivationSendingCode(true);
                          setTimeout(() => {
                            setActivationCodeSent(true);
                            setActivationSendingCode(false);
                            toast({ title: "Verification code sent", description: `Check ${activationContactValue} for your code` });
                          }, 800);
                        }}
                        disabled={!activationContactValue.trim() || activationSendingCode}
                        className="w-full h-14 rounded-2xl bg-foreground/[0.08] hover:bg-foreground/[0.12] text-foreground font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                      >
                        {activationSendingCode ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Code
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* OTP entry */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Verification</p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Enter Code</h2>
                    <p className="text-sm text-foreground/50 mb-6">
                      Enter the 6-digit code sent to <span className="font-semibold text-foreground">{activationContactValue}</span>
                    </p>
                    <div className="flex gap-2 mb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                            activationCode[i]
                              ? "border-primary bg-primary/5 text-foreground"
                              : i === activationCode.length
                                ? "border-primary/50 bg-foreground/[0.03]"
                                : "border-foreground/10 bg-foreground/[0.03]"
                          }`}
                        >
                          {activationCode[i] || ""}
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={activationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setActivationCode(val);
                        if (val.length === 6) {
                          // Show device connected animation, then go to device name step
                          setShowDeviceConnected(true);
                          setTimeout(() => {
                            setShowDeviceConnected(false);
                            setOwnerVerified(true);
                          }, 2500);
                        }
                      }}
                      className="sr-only"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => {
                          setActivationCodeSent(false);
                          setActivationCode("");
                        }}
                        className="text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Change contact
                      </button>
                      <span className="text-foreground/30">Resend in 55s</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer: Try another way (centered button) + Need Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 w-full flex flex-col items-center gap-3"
          >
            <button
              onClick={() => {
                if (showOtherOptions) {
                  setShowOtherOptions(false);
                  setActivationCodeSent(false);
                  setActivationCode("");
                  setActivationContactValue("");
                } else {
                  setShowOtherOptions(true);
                }
              }}
              className="px-6 py-2.5 rounded-full border border-foreground/[0.12] bg-foreground/[0.05] text-sm text-foreground/60 hover:text-foreground/80 hover:bg-foreground/[0.08] transition-all"
            >
              {showOtherOptions ? "Back to options" : "Try another way"}
            </button>
            <button
              onClick={() => setShowTutorialOverlay(true)}
              className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              Need Help?
            </button>
          </motion.div>
        </div>

        <ContactAdminDialog 
          open={showContactAdmin} 
          onOpenChange={setShowContactAdmin} 
        />
        <DeviceSetupTutorialOverlay
          open={showTutorialOverlay}
          onClose={() => setShowTutorialOverlay(false)}
          variant="new"
        />
      </div>
    );
  }

  // Company Device - Activation Approach Choice Screen (QR Code + Email/Phone Verification)
  if (deviceType === "company" && showDeviceSetup && !activationApproach) {
    const handleOwnerSendCode = async () => {
      if (!ownerContact.trim()) {
        setOwnerVerificationError("Please enter a valid email or phone number");
        return;
      }
      setOwnerSendingCode(true);
      setOwnerVerificationError("");
      const isEmail = ownerContact.includes("@");
      setOwnerContactType(isEmail ? "email" : "phone");

      // Accept any input for demo purposes
      setTimeout(() => {
        setOwnerCodeSent(true);
        setOwnerResendCooldown(60);
        setOwnerSendingCode(false);
        toast({ title: "Verification code sent", description: `Check ${isEmail ? ownerContact : "your phone"} for your code` });
      }, 800);
    };

    const handleOwnerVerifyCode = async () => {
      if (ownerVerificationCode.length !== 6) {
        setOwnerVerificationError("Please enter the 6-digit code");
        return;
      }
      setOwnerVerifyingCode(true);
      setOwnerVerificationError("");

      // Accept any 6-digit code for demo purposes
      setTimeout(() => {
        setOwnerVerifyingCode(false);
        setOwnerVerified(true);
      }, 800);
    };

    const activationQrValue = `posai://activate/${Date.now().toString(36)}`;

    // Device Name step after OTP verified
    if (ownerVerified) {
      const handleSetDeviceName = () => {
        if (!deviceName.trim()) {
          setDeviceNameError("Please enter a device name");
          return;
        }
        // Trust the device and go to PIN pad
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          deviceName: deviceName.trim(),
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      };

      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            {/* POS AI Logo */}
            <motion.img
              src={eatosLogo}
              alt="POS AI"
              className="w-32 h-auto mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />

            {/* Success Check */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Device Verified
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-foreground/50 mb-8 text-center"
            >
              Give this device a name to identify it easily.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full space-y-4"
            >
              <div className="relative">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                <Input
                  type="text"
                  placeholder="e.g. Front Counter, Bar Terminal"
                  value={deviceName}
                  onChange={(e) => {
                    setDeviceName(e.target.value);
                    setDeviceNameError("");
                  }}
                  className="pl-12 h-14 text-base rounded-2xl bg-foreground/[0.05] border-foreground/[0.1] focus:border-primary/40"
                  autoFocus
                />
              </div>

              {deviceNameError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">{deviceNameError}</p>
                </motion.div>
              )}

              <Button
                onClick={handleSetDeviceName}
                disabled={!deviceName.trim()}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full flex flex-col items-center pt-12 p-4 md:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl flex flex-col items-center"
        >
          {/* POS AI Logo */}
          <motion.img
            src={eatosLogo}
            alt="POS AI"
            className="w-32 h-auto mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-12"
          >
            Activate Device
          </motion.h1>

          {/* Two Column Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col md:flex-row gap-0"
          >
            {/* Option 1: QR Code */}
            <div className="flex-1 pr-0 md:pr-10 pb-8 md:pb-0">
              <p className="text-sm font-medium text-primary/70 mb-1">Option 1</p>
              <h2 className="text-xl font-bold text-foreground mb-6">Scan to Activate</h2>
              
              <div className="flex flex-row items-start gap-6">
                <div className="bg-foreground rounded-2xl p-5 flex-shrink-0">
                  <QRCodeSVG
                    value={activationQrValue}
                    size={200}
                    bgColor="hsl(0 0% 100%)"
                    fgColor="hsl(0 0% 0%)"
                    level="M"
                  />
                </div>
                <ul className="text-sm text-foreground/60 leading-relaxed space-y-3 list-none pt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Got a link via email or text? Tap it, then scan the code to activate instantly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>No link? Scan the code, then enter your email and code to activate the device.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:flex flex-col items-center px-2">
              <div className="w-px flex-1 bg-foreground/10" />
            </div>
            <div className="md:hidden w-full h-px bg-foreground/10 my-4" />

            {/* Option 2: Email/Phone Verification */}
            <div className="flex-1 pl-0 md:pl-10">
              <p className="text-sm font-medium text-primary/70 mb-1">Option 2</p>
              <h2 className="text-xl font-bold text-foreground mb-6">Activate</h2>

              <AnimatePresence mode="wait">
                {!ownerCodeSent ? (
                  <motion.div
                    key="contact-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-sm text-foreground/60 mb-3">
                        Enter your email or mobile number to activate
                      </p>
                      {(() => {
                        const isPhone = /^[\d(+]/.test(ownerContact.trim()) && !ownerContact.includes('@');
                        
                        const formatPhoneForCountry = (digits: string, dialCode: string) => {
                          if (dialCode === '+1') {
                            if (digits.length <= 3) return `(${digits}`;
                            if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
                          }
                          if (dialCode === '+44') {
                            if (digits.length <= 4) return digits;
                            if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
                            return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
                          }
                          if (dialCode === '+91') {
                            if (digits.length <= 5) return digits;
                            return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
                          }
                          if (digits.length <= 4) return digits;
                          if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
                          return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 12)}`;
                        };

                        return (
                          <div className="relative flex items-center">
                            {isPhone && (
                              <div ref={ownerCountryRef} className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowOwnerCountryPicker(!showOwnerCountryPicker);
                                    setOwnerCountrySearch("");
                                  }}
                                  className="h-14 px-3 rounded-l-2xl border border-r-0 border-foreground/[0.1] bg-foreground/[0.05] flex items-center gap-1.5 hover:bg-foreground/[0.08] transition-colors"
                                >
                                  <span className="text-lg">{ownerSelectedCountry.flag}</span>
                                  <span className="text-sm font-medium text-foreground/70">{ownerSelectedCountry.dialCode}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-foreground/40" />
                                </button>
                                {showOwnerCountryPicker && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-[#252525] border border-foreground/[0.1] rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-2 border-b border-foreground/[0.08]">
                                      <div className="flex items-center gap-2 bg-foreground/[0.06] rounded-lg px-3 py-2">
                                        <Search className="w-4 h-4 text-foreground/40" />
                                        <input
                                          type="text"
                                          value={ownerCountrySearch}
                                          onChange={(e) => setOwnerCountrySearch(e.target.value)}
                                          placeholder="Search country..."
                                          className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground/40 outline-none"
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {countryCodes
                                        .filter(c =>
                                          c.name.toLowerCase().includes(ownerCountrySearch.toLowerCase()) ||
                                          c.dialCode.includes(ownerCountrySearch) ||
                                          c.code.toLowerCase().includes(ownerCountrySearch.toLowerCase())
                                        )
                                        .map((country) => (
                                          <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                              setOwnerSelectedCountry(country);
                                              setShowOwnerCountryPicker(false);
                                              setOwnerContact("");
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/[0.06] transition-colors text-left ${
                                              ownerSelectedCountry.code === country.code ? 'bg-foreground/[0.06]' : ''
                                            }`}
                                          >
                                            <span className="text-lg">{country.flag}</span>
                                            <span className="text-foreground text-sm flex-1">{country.name}</span>
                                            <span className="text-foreground/40 text-sm">{country.dialCode}</span>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {!isPhone && (
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 z-10 pointer-events-none" />
                            )}
                            <Input
                              type="text"
                              placeholder={isPhone ? "Phone number" : "Email or phone number"}
                              value={isPhone ? formatPhoneForCountry(ownerContact.replace(/\D/g, ''), ownerSelectedCountry.dialCode) : ownerContact}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (isPhone || (/^[\d(+]/.test(val.trim()) && !val.includes('@'))) {
                                  setOwnerContact(val.replace(/\D/g, '').slice(0, 15));
                                } else {
                                  setOwnerContact(val);
                                }
                                setOwnerVerificationError("");
                              }}
                              className={`${isPhone ? 'rounded-l-none rounded-r-2xl' : 'pl-12 rounded-2xl'} h-14 text-base bg-foreground/[0.05] border-foreground/[0.1] focus:border-primary/40 flex-1`}
                              disabled={ownerSendingCode}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {ownerVerificationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{ownerVerificationError}</p>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleOwnerSendCode}
                      disabled={!ownerContact.trim() || ownerSendingCode}
                      className="w-full h-14 text-base font-medium rounded-2xl"
                      size="lg"
                    >
                      {ownerSendingCode ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Code
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-foreground/60 mb-1">
                      Enter the 6-digit code sent to <span className="text-foreground font-medium">{ownerContact}</span>
                    </p>

                    {/* Code input boxes */}
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={ownerVerificationCode[i] || ""}
                          autoFocus={i === 0}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value) {
                              const newCode = ownerVerificationCode.split('');
                              newCode[i] = value[value.length - 1];
                              const joined = newCode.join('').slice(0, 6);
                              setOwnerVerificationCode(joined);
                              setOwnerVerificationError("");
                              if (joined.length === 6) {
                                setTimeout(() => handleOwnerVerifyCode(), 300);
                              } else {
                                const nextInput = (e.target as HTMLElement).nextElementSibling as HTMLInputElement;
                                if (nextInput && value) nextInput.focus();
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              if (!ownerVerificationCode[i]) {
                                const prevInput = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                                if (prevInput) prevInput.focus();
                              }
                              const newCode = ownerVerificationCode.split('');
                              newCode[i] = '';
                              setOwnerVerificationCode(newCode.join(''));
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setOwnerVerificationCode(pasted);
                            if (pasted.length === 6) {
                              setTimeout(() => handleOwnerVerifyCode(), 300);
                            }
                          }}
                          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-foreground/[0.03] focus:outline-none focus:border-primary transition-all ${
                            ownerVerificationCode[i]
                              ? "border-primary/40 bg-primary/5 text-foreground"
                              : "border-foreground/[0.1] text-foreground/30"
                          }`}
                        />
                      ))}
                    </div>

                    {ownerVerificationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{ownerVerificationError}</p>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleOwnerVerifyCode}
                      disabled={ownerVerificationCode.length !== 6 || ownerVerifyingCode}
                      className="w-full h-14 text-base font-medium rounded-2xl"
                      size="lg"
                    >
                      {ownerVerifyingCode ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>

                    {/* Resend / Change */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          setOwnerCodeSent(false);
                          setOwnerVerificationCode("");
                          setOwnerVerificationError("");
                        }}
                        className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Change contact
                      </button>
                      <button
                        onClick={() => {
                          if (ownerResendCooldown > 0) return;
                          setOwnerResendCooldown(60);
                          handleOwnerSendCode();
                        }}
                        disabled={ownerResendCooldown > 0 || ownerSendingCode}
                        className="text-xs text-primary hover:text-primary/80 transition-colors disabled:text-foreground/30 disabled:cursor-not-allowed"
                      >
                        {ownerResendCooldown > 0 ? `Resend in ${ownerResendCooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Help Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => setShowContactAdmin(true)}
              className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              Need help?
            </button>
          </motion.div>
        </motion.div>

        <ContactAdminDialog 
          open={showContactAdmin} 
          onOpenChange={setShowContactAdmin} 
        />
      </div>
    );
  }

  // Company Device - First-Time Device Setup Screen (Manual approach)
  if (deviceType === "company" && showDeviceSetup && activationApproach === "manual") {
    const handleActivateWithCode = () => {
      if (!activationCode.trim()) {
        setActivationError("Please enter an activation code");
        return;
      }
      
      const normalizedCode = activationCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      if (normalizedCode.length < 6) {
        setActivationError("Please enter a valid activation code");
        return;
      }
      
      setIsActivating(true);
      setActivationError("");
      
      setTimeout(() => {
        setIsActivating(false);
        // Trust the device and navigate to Dashboard (ClockInOverlay will handle clock-in)
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      }, 1200);
    };

    const handleSendMagicLink = () => {
      if (!magicLinkEmail.trim() || !magicLinkEmail.includes("@")) {
        setActivationError("Please enter a valid email address");
        return;
      }
      
      setIsActivating(true);
      setActivationError("");
      
      setTimeout(() => {
        setIsActivating(false);
        setMagicLinkSent(true);
      }, 1000);
    };

    const handleAdminSignIn = () => {
      if (!adminEmail.trim() || !adminEmail.includes("@")) {
        setActivationError("Please enter a valid email address");
        return;
      }
      if (!adminPassword.trim()) {
        setActivationError("Please enter your password");
        return;
      }
      
      setIsActivating(true);
      setActivationError("");
      
      setTimeout(() => {
        setIsActivating(false);
        // Trust the device and navigate to Dashboard (ClockInOverlay will handle clock-in)
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      }, 1200);
    };

    const handleTryDemo = () => {
      setShowDemoMode(true);
      setDemoEmailVerified(false);
      setDemoOtpSent(false);
      setDemoEmail("");
      setDemoOtp("");
      setDemoOtpError("");
    };

    const handleDemoSendOtp = async () => {
      if (!demoEmail || !demoEmail.includes("@")) {
        setDemoOtpError("Please enter a valid email address");
        return;
      }
      setDemoSendingOtp(true);
      setDemoOtpError("");
      setShowDemoEmailKeyboard(false);
      
      try {
        // Use Supabase OTP (magic link as OTP)
        const { error } = await supabase.auth.signInWithOtp({
          email: demoEmail,
          options: {
            shouldCreateUser: true,
          },
        });
        
        if (error) {
          setDemoOtpError(error.message);
        } else {
          setDemoOtpSent(true);
          setDemoOtpResendCooldown(60);
          toast({
            title: "Verification code sent",
            description: `Check ${demoEmail} for your code`,
          });
        }
      } catch {
        setDemoOtpError("Failed to send verification code. Try again.");
      } finally {
        setDemoSendingOtp(false);
      }
    };

    const handleDemoVerifyOtp = async () => {
      if (demoOtp.length !== 6) {
        setDemoOtpError("Please enter the 6-digit code");
        return;
      }
      setDemoVerifyingOtp(true);
      setDemoOtpError("");
      
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: demoEmail,
          token: demoOtp,
          type: "email",
        });
        
        if (error) {
          setDemoOtpError("Invalid or expired code. Please try again.");
          setDemoOtp("");
        } else {
          setDemoEmailVerified(true);
          // Sign out after verification — demo doesn't need a real session
          await supabase.auth.signOut();
          toast({
            title: "Email verified!",
            description: "Select a business type to start exploring",
          });
        }
      } catch {
        setDemoOtpError("Verification failed. Please try again.");
        setDemoOtp("");
      } finally {
        setDemoVerifyingOtp(false);
      }
    };

    const maxDemoResends = 3;
    const handleDemoResendOtp = async () => {
      if (demoOtpResendCooldown > 0 || demoOtpResendCount >= maxDemoResends) return;
      setDemoOtpResendCount((c) => c + 1);
      const cooldown = 30 * (demoOtpResendCount + 1); // 30s, 60s, 90s
      setDemoOtpResendCooldown(cooldown);
      await handleDemoSendOtp();
    };

    // Demo Mode Screen
    if (showDemoMode) {
      // Step 1: Email verification (gate)
      if (!demoEmailVerified) {
        return (
          <DeviceSetupLayout variant="demo" leftPanelContent={{
              icon: <Monitor className="w-6 h-6 text-amber-500" />,
              title: "Demo Verification",
              description: "Verify your identity to access the demo environment with sample data.",
              features: ["Quick email verification", "No real data affected", "Full feature access"]
            }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full flex flex-col items-center"
            >
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setShowDemoMode(false);
                  setDemoEmail("");
                  setDemoOtp("");
                  setDemoOtpSent(false);
                  setDemoOtpError("");
                  setShowDemoEmailKeyboard(false);
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5"
              >
                <Mail className="w-8 h-8 text-amber-500" />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-1"
              >
                <h1 className="text-xl font-semibold text-foreground text-center">
                  Verify Your Email
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-500">
                  Demo
                </span>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-6 text-center max-w-xs"
              >
                {demoOtpSent 
                  ? `Enter the 6-digit code sent to ${demoEmail}`
                  : "Enter your email to access demo mode"
                }
              </motion.p>

              <AnimatePresence mode="wait">
                {!demoOtpSent ? (
                  /* Email Input */
                  <motion.div
                    key="email-input"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ delay: 0.2 }}
                    className="w-full space-y-4"
                  >
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={demoEmail}
                        onFocus={() => setDemoOtpError("")}
                        onChange={(e) => {
                          setDemoEmail(e.target.value);
                          setDemoOtpError("");
                        }}
                        className="pl-12 h-14 text-base rounded-2xl bg-foreground/[0.03] border-foreground/[0.08] focus:border-amber-500/40"
                        disabled={demoSendingOtp}
                      />
                    </div>

                    {demoOtpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{demoOtpError}</p>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleDemoSendOtp}
                      disabled={!demoEmail || !demoEmail.includes("@") || demoSendingOtp}
                      className="w-full h-14 text-base font-medium rounded-2xl"
                      size="lg"
                    >
                      {demoSendingOtp ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  /* OTP Input */
                  <motion.div
                    key="otp-input"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ delay: 0.1 }}
                    className="w-full space-y-4"
                  >
                    {/* OTP digit boxes */}
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-semibold transition-all ${
                            demoOtp[i]
                              ? "border-amber-500/40 bg-amber-500/5 text-foreground"
                              : i === demoOtp.length
                                ? "border-amber-500/30 bg-foreground/[0.02]"
                                : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/30"
                          }`}
                        >
                          {demoOtp[i] || ""}
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={demoOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDemoOtp(val);
                        setDemoOtpError("");
                      }}
                      className="sr-only"
                    />

                    {demoOtpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{demoOtpError}</p>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleDemoVerifyOtp}
                      disabled={demoOtp.length !== 6 || demoVerifyingOtp}
                      className="w-full h-14 text-base font-medium rounded-2xl"
                      size="lg"
                    >
                      {demoVerifyingOtp ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5 mr-2" />
                          Verify & Continue
                        </>
                      )}
                    </Button>

                    {/* Resend / Change email */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setDemoOtpSent(false);
                          setDemoOtp("");
                          setDemoOtpError("");
                        }}
                        className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Change email
                      </button>
                      <button
                        onClick={handleDemoResendOtp}
                        disabled={demoOtpResendCooldown > 0 || demoSendingOtp || demoOtpResendCount >= maxDemoResends}
                        className="text-xs text-primary hover:text-primary/80 transition-colors disabled:text-foreground/30 disabled:cursor-not-allowed"
                      >
                        {demoOtpResendCount >= maxDemoResends
                          ? "Max attempts reached"
                          : demoOtpResendCooldown > 0
                            ? `Resend in ${demoOtpResendCooldown}s`
                            : "Resend code"
                        }
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 text-xs text-foreground/30 text-center"
              >
                Ready to get started for real?{" "}
                <button
                  onClick={() => {
                    setShowDemoMode(false);
                    setDemoEmail("");
                    setDemoOtp("");
                    setDemoOtpSent(false);
                  }}
                  className="text-primary hover:underline"
                >
                  Activate your device
                </button>
              </motion.p>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Step 2: Business type selection (after email verified)
      const businessTypes = [
        {
          id: "restaurant",
          name: "Full Service",
          icon: UtensilsCrossed,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          hoverBg: "hover:bg-orange-500/15",
        },
        {
          id: "cafe",
          name: "Quick Service",
          icon: Zap,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          hoverBg: "hover:bg-amber-500/15",
        },
        {
          id: "foodtruck",
          name: "Food Truck",
          icon: Truck,
          color: "text-violet-500",
          bgColor: "bg-violet-500/10",
          borderColor: "border-violet-500/20",
          hoverBg: "hover:bg-violet-500/15",
        },
      ];

      const handleStartDemo = () => {
        if (!selectedDemoBusinessType) return;
        
        setIsLoadingDemo(true);
        
        setTimeout(() => {
          localStorage.setItem("pos_device_session", JSON.stringify({
            deviceId: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            deviceType: "company",
            trustedAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            isDemo: true,
            businessType: selectedDemoBusinessType,
            demoEmail: demoEmail,
          }));
          
          localStorage.setItem("pos_session", JSON.stringify({
            employeeId: "demo-user",
            employeeName: "Demo User",
            employeeRole: "Manager",
            employeeAvatar: "",
            revenueCenter: "Demo Station",
            deviceType: "company",
            isDemo: true,
            businessType: selectedDemoBusinessType,
            loginTime: new Date().toISOString()
          }));
          
          setIsLoadingDemo(false);
          navigate("/");
        }, 1500);
      };

      return (
        <DeviceSetupLayout variant="demo" leftPanelContent={{
            icon: <Monitor className="w-6 h-6 text-amber-500" />,
            title: "Demo Experience",
            description: "Explore eatOS with sample data. Perfect for training or evaluation.",
            features: ["Sample menu and categories", "Mock orders and transactions", "Full feature exploration"]
          }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setShowDemoMode(false);
                setSelectedDemoBusinessType(null);
                setDemoEmailVerified(false);
                setDemoEmail("");
              }}
              disabled={isLoadingDemo}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            {/* Verified badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">{demoEmail}</span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-1"
            >
              <h1 className="text-xl font-semibold text-foreground text-center">
                Explore the POS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-500">
                Demo
              </span>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-4 text-center max-w-xs"
            >
              Select a business type to explore with sample data
            </motion.p>

            {/* Business Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-2.5 mb-4"
            >
              {businessTypes.map((type, index) => {
                const Icon = type.icon;
                const isSelected = selectedDemoBusinessType === type.id;
                
                return (
                  <motion.button
                    key={type.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    onClick={() => setSelectedDemoBusinessType(type.id)}
                    disabled={isLoadingDemo}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? `${type.bgColor} ${type.borderColor} border-2`
                        : `bg-foreground/[0.03] border border-foreground/[0.06] hover:bg-foreground/[0.08] hover:border-foreground/[0.12]`
                    } disabled:opacity-50`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center flex-shrink-0 transition-colors ${type.hoverBg}`}>
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {type.name}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-5 h-5 rounded-full ${type.bgColor} ${type.borderColor} border flex items-center justify-center`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${type.color}`} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Demo Warning */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/[0.08] mb-4"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-foreground/50">
                Demo environment — no real payments or saved settings
              </p>
            </motion.div>

            {/* Start Demo Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full"
            >
              <Button
                onClick={handleStartDemo}
                disabled={!selectedDemoBusinessType || isLoadingDemo}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isLoadingDemo ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading Demo...
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-5 h-5 mr-2" />
                    Start Exploring
                  </>
                )}
              </Button>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-xs text-foreground/30 text-center"
            >
              Ready to get started for real?{" "}
              <button
                onClick={() => {
                  setShowDemoMode(false);
                  setSelectedDemoBusinessType(null);
                  setDemoEmailVerified(false);
                  setDemoEmail("");
                }}
                disabled={isLoadingDemo}
                className="text-primary hover:underline disabled:opacity-50"
              >
                Activate your device
              </button>
            </motion.p>
          </motion.div>
        </DeviceSetupLayout>
      );
    }

    const handleBackFromMethod = () => {
      setActivationMethod(null);
      setActivationCode("");
      setActivationError("");
      setMagicLinkEmail("");
      setMagicLinkPhone("");
      setMagicLinkInputType("email");
      setMagicLinkSent(false);
      setAdminEmail("");
      setAdminPassword("");
      setShowAdminEmailKeyboard(false);
      setActivationContactValue("");
      setActivationContactType("email");
      setActivationCodeSent(false);
      setActivationSendingCode(false);
    };

    // Sub-screen: Activate with Code (with email/phone step first)
    if (activationMethod === "code") {
      const CODE_LENGTH = 6;
      const codeDigits = activationCode.split('');

      const isContactEmail = activationContactType === "email";
      const isValidContact = isContactEmail
        ? activationContactValue.includes("@") && activationContactValue.includes(".")
        : activationContactValue.replace(/\D/g, '').length >= 10;

      const formatActivationPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      };

      const handleSendActivationCode = () => {
        if (!isValidContact) {
          setActivationError(isContactEmail ? "Please enter a valid email address" : "Please enter a valid phone number");
          return;
        }
        setActivationSendingCode(true);
        setActivationError("");
        setTimeout(() => {
          setActivationSendingCode(false);
          setActivationCodeSent(true);
          toast({
            title: "Activation code sent",
            description: isContactEmail
              ? `Check ${activationContactValue} for your code`
              : `Check your phone for the code`,
          });
        }, 1200);
      };

      // Step 1: Collect email or phone
      if (!activationCodeSent) {
        return (
          <DeviceSetupLayout variant="activation" leftPanelContent={{
              icon: <ShieldCheck className="w-6 h-6 text-primary" />,
              title: "Activate with Code",
              description: "Enter your email or phone to receive a secure activation code for this device.",
              features: ["Time-limited activation codes", "Secure email or SMS delivery", "Device trust establishment"]
            }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full flex flex-col items-center"
            >
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBackFromMethod}
                className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5"
              >
                <KeyRound className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-1 text-center"
              >
                Activate with Code
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-6 text-center max-w-xs"
              >
                Enter your email or phone number to receive an activation code
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full space-y-4"
              >
                <div className="relative flex gap-2">
                  {activationContactType === "phone" && activationContactValue.replace(/\D/g, '').length > 0 && (
                    <div className="flex items-center gap-1 px-3 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] shrink-0">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm text-foreground/50">+1</span>
                    </div>
                  )}
                  <div className="relative flex-1">
                    {activationContactValue.includes("@") ? (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    ) : /^\d|^\(/.test(activationContactValue) && activationContactValue.replace(/\D/g, '').length > 0 ? (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    )}
                    <Input
                      type="text"
                      placeholder="your@email.com or phone number"
                      value={activationContactType === "phone" ? formatActivationPhone(activationContactValue.replace(/\D/g, '')) : activationContactValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes("@")) {
                          setActivationContactType("email");
                          setActivationContactValue(val);
                        } else if (/^\d|^\(/.test(val) && val.replace(/\D/g, '').length > 0) {
                          setActivationContactType("phone");
                          setActivationContactValue(val.replace(/\D/g, '').slice(0, 10));
                        } else {
                          setActivationContactType("email");
                          setActivationContactValue(val);
                        }
                        setActivationError("");
                      }}
                      className="pl-12 h-14 text-base rounded-2xl bg-foreground/[0.03] border-foreground/[0.08] focus:border-primary/40"
                      disabled={activationSendingCode}
                    />
                  </div>
                </div>
                {activationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">{activationError}</p>
                  </motion.div>
                )}

                <Button
                  onClick={handleSendActivationCode}
                  disabled={!activationContactValue || !isValidContact || activationSendingCode}
                  className="w-full h-14 text-base font-medium rounded-2xl"
                  size="lg"
                >
                  {activationSendingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Code
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Step 2: Enter the activation code
      return (
        <DeviceSetupLayout variant="activation" leftPanelContent={{
            icon: <ShieldCheck className="w-6 h-6 text-primary" />,
            title: "Code Verification",
            description: "Enter the 6-digit code sent to your email or phone to complete activation.",
            features: ["6-digit secure code", "Auto-expires for security", "One-time use verification"]
          }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setActivationCodeSent(false);
                setActivationCode("");
                setActivationError("");
              }}
              disabled={isActivating}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-foreground mb-1 text-center"
            >
              Enter Activation Code
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-4 text-center"
            >
              Enter the 6-digit code sent to {isContactEmail ? activationContactValue : formatActivationPhone(activationContactValue)}
            </motion.p>

            {/* Code Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 mb-3 cursor-text"
              onClick={() => document.getElementById('activation-code-hidden')?.focus()}
            >
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={activationError ? { x: [0, -3, 3, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                    activationError
                      ? "border-destructive bg-destructive/5"
                      : i < codeDigits.length
                        ? "border-primary bg-primary/5"
                        : i === codeDigits.length
                          ? "border-foreground/30 bg-foreground/[0.02]"
                          : "border-foreground/[0.1] bg-foreground/[0.02]"
                  }`}
                >
                  {codeDigits[i] ? (
                    <span className="text-2xl font-semibold text-foreground">
                      {codeDigits[i]}
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>

            {/* Error/Status Message */}
            <div className="h-8 flex items-center justify-center mb-2 w-full">
              <AnimatePresence mode="wait">
                {isActivating ? (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground/60">Verifying code...</span>
                  </motion.div>
                ) : activationError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 max-w-full"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-sm font-medium text-destructive">{activationError}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Hidden input for native keyboard */}
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={activationCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
                if (val.length <= CODE_LENGTH) {
                  setActivationCode(val);
                  setActivationError("");
                  if (val.length === CODE_LENGTH && !isActivating) {
                    setIsActivating(true);
                    setTimeout(() => {
                      if (val.startsWith("0")) {
                        setIsActivating(false);
                        setActivationError("This code has expired. Please request a new one.");
                        setActivationCode("");
                      } else if (val.startsWith("9")) {
                        setIsActivating(false);
                        setActivationError("Invalid code. Please check and try again.");
                        setActivationCode("");
                      } else {
                        setIsActivating(false);
                        localStorage.setItem("pos_device_session", JSON.stringify({
                          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                          deviceType: "company",
                          trustedAt: new Date().toISOString(),
                        }));
                        navigate("/");
                      }
                    }, 1500);
                  }
                }
              }}
              className="sr-only"
              maxLength={CODE_LENGTH}
              id="activation-code-hidden"
            />

            {/* Helper Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 flex items-start gap-2 px-4 py-2.5 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/[0.08] max-w-xs"
            >
              <Timer className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/50 leading-relaxed">
                <span className="font-medium text-foreground/60">One-time code:</span>{" "}
                This code expires in 10 minutes and can only be used once.
              </p>
            </motion.div>

            {/* Resend Code Link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => {
                setActivationCode("");
                setActivationError("");
                toast({
                  title: "New code sent",
                  description: isContactEmail
                    ? `Check ${activationContactValue} for a fresh code`
                    : "Check your phone for a fresh code",
                });
              }}
              disabled={isActivating}
              className="mt-4 text-sm text-foreground/40 hover:text-foreground/60 transition-colors disabled:opacity-30"
            >
              Resend code
            </motion.button>
          </motion.div>
        </DeviceSetupLayout>
      );
    }

    // Sub-screen: Sign in with Link (Magic Link)
    if (activationMethod === "link") {
      const isEmail = magicLinkInputType === "email";
      const currentValue = isEmail ? magicLinkEmail : magicLinkPhone;
      const displayValue = isEmail ? magicLinkEmail : magicLinkPhone;
      
      // Simple validation
      const isValidEmail = magicLinkEmail.includes("@") && magicLinkEmail.includes(".");
      const isValidPhone = magicLinkPhone.replace(/\D/g, '').length >= 10;
      const isValid = isEmail ? isValidEmail : isValidPhone;

      const handleSendLink = () => {
        if (!isValid) {
          setActivationError(isEmail ? "Please enter a valid email address" : "Please enter a valid phone number");
          return;
        }
        
        setIsActivating(true);
        setActivationError("");
        
        // Simulate sending - check if registered (mock: emails with "test" are unregistered)
        setTimeout(() => {
          if (isEmail && magicLinkEmail.toLowerCase().includes("test")) {
            setIsActivating(false);
            setActivationError("This email is not registered. Contact your admin.");
          } else if (!isEmail && magicLinkPhone.startsWith("000")) {
            setIsActivating(false);
            setActivationError("This phone number is not registered. Contact your admin.");
          } else {
            setIsActivating(false);
            setMagicLinkSent(true);
          }
        }, 1200);
      };

      const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      };

      // Waiting/Verification Screen - blocks navigation until verified
      if (magicLinkSent) {
        const maxResends = 3;
        const isResendDisabled = magicLinkResendCooldown > 0 || magicLinkResendCount >= maxResends || isActivating;
        
        const handleResendLink = () => {
          if (isResendDisabled) return;
          
          setIsActivating(true);
          setTimeout(() => {
            setIsActivating(false);
            setMagicLinkResendCount(prev => prev + 1);
            // Increase cooldown with each resend: 30s, 60s, 90s
            const cooldownTime = 30 * (magicLinkResendCount + 1);
            setMagicLinkResendCooldown(cooldownTime);
            toast({
              title: "Link resent",
              description: `Check your ${isEmail ? "inbox" : "messages"} for a new link`
            });
          }, 1000);
        };

        return (
          <DeviceSetupLayout variant="activation" leftPanelContent={{
              icon: <Send className="w-6 h-6 text-primary" />,
              title: "Link Sent",
              description: "A secure sign-in link has been sent. Check your inbox or messages to continue.",
              features: ["One-click sign in", "Secure link verification", "Auto-expires for safety"]
            }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full flex flex-col items-center text-center"
            >
              {/* Back Button - Self-aligned at top left */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkResendCount(0);
                  setMagicLinkResendCooldown(0);
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              {/* Animated Waiting Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-violet-500/10 flex items-center justify-center mb-5 md:mb-6 relative"
              >
                {/* Pulsing rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/20"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/20"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/20"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                />
                
                {/* Icon */}
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-violet-500/15 flex items-center justify-center">
                  {isEmail ? (
                    <Mail className="w-6 h-6 md:w-8 md:h-8 text-violet-500" />
                  ) : (
                    <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-violet-500" />
                  )}
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-2"
              >
                Check your {isEmail ? "email" : "SMS"} to continue
              </motion.h1>
              
              {/* Destination */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-1"
              >
                We sent a secure sign-in link to
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base font-semibold text-foreground/80 mb-5 md:mb-6"
              >
                {displayValue}
              </motion.p>

              {/* Waiting Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full px-5 py-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] mb-5 md:mb-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-foreground/70">
                    Waiting for verification...
                  </p>
                </div>
                <p className="text-xs text-foreground/40 leading-relaxed text-left">
                  Tap the link in your {isEmail ? "email" : "message"} to verify your identity and activate this device. This page will update automatically.
                </p>
              </motion.div>

              {/* Resend Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full space-y-3"
              >
                <Button
                  variant="outline"
                  onClick={handleResendLink}
                  disabled={isResendDisabled}
                  className="w-full h-12 rounded-2xl"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : magicLinkResendCooldown > 0 ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Resend in {magicLinkResendCooldown}s
                    </>
                  ) : magicLinkResendCount >= maxResends ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Max resends reached
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Link
                    </>
                  )}
                </Button>

                {/* Resend limit indicator */}
                {magicLinkResendCount > 0 && magicLinkResendCount < maxResends && (
                  <p className="text-xs text-foreground/30">
                    {maxResends - magicLinkResendCount} resend{maxResends - magicLinkResendCount !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="w-full flex items-center gap-4 my-5 md:my-6"
              >
                <div className="flex-1 h-px bg-foreground/[0.06]" />
                <span className="text-xs text-foreground/30">or</span>
                <div className="flex-1 h-px bg-foreground/[0.06]" />
              </motion.div>

              {/* Use different contact */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkEmail("");
                  setMagicLinkPhone("");
                  setMagicLinkResendCount(0);
                  setMagicLinkResendCooldown(0);
                }}
                className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
              >
                Use a different {isEmail ? "email address" : "phone number"}
              </motion.button>

              {/* Security Note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-6 md:mt-8 flex items-center gap-2 text-xs text-foreground/30"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>This screen will update automatically once verified</span>
              </motion.div>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Magic Link Input Screen
      return (
        <DeviceSetupLayout variant="activation" leftPanelContent={{
            icon: <Link2 className="w-6 h-6 text-primary" />,
            title: "Sign in with Link",
            description: "Receive a secure magic link to sign in without a password.",
            features: ["Passwordless authentication", "Secure email or SMS link", "One-click device access"]
          }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Back Button - Self-aligned at top left */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBackFromMethod}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-foreground mb-1 text-center"
            >
              Sign in with Link
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-4 text-center max-w-xs"
            >
              Enter your email or phone to receive a secure activation link
            </motion.p>

            {/* Input Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              <div className="flex gap-2">
                {!isEmail && magicLinkPhone.length > 0 && (
                  <div className="flex items-center gap-1 px-3 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.1] shrink-0">
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-sm text-foreground/50">+1</span>
                  </div>
                )}
                <div className="relative flex-1">
                  {isEmail || magicLinkPhone.length === 0 ? (
                    (isEmail ? magicLinkEmail : "").includes("@") || !(/^\d|^\(/.test(isEmail ? magicLinkEmail : "")) ? (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    )
                  ) : (
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                  )}
                  <Input
                    type="text"
                    placeholder="your@email.com or phone number"
                    value={isEmail ? magicLinkEmail : formatPhoneNumber(magicLinkPhone)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes("@") || !(/^\d|^\(/.test(val) && val.replace(/\D/g, '').length > 0)) {
                        setMagicLinkInputType("email");
                        setMagicLinkEmail(val);
                      } else {
                        setMagicLinkInputType("phone");
                        setMagicLinkPhone(val.replace(/\D/g, "").slice(0, 10));
                      }
                      setActivationError("");
                    }}
                    className={`h-14 pl-12 text-base rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                      activationError ? "border-destructive" : ""
                    }`}
                  />
                </div>
              </div>
              
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {activationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-sm font-medium text-destructive">{activationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Send Button */}
              <Button
                onClick={handleSendLink}
                disabled={isActivating || !currentValue.trim()}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Sign-in Link
                  </>
                )}
              </Button>
            </motion.div>

            {/* Security Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-5 md:mt-6 flex items-start gap-2 px-4 py-3 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/[0.08] max-w-xs"
            >
              <ShieldCheck className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/50 leading-relaxed">
                <span className="font-medium text-foreground/60">No password needed.</span>{" "}
                We'll send a secure, one-time link that verifies your identity and activates this device.
              </p>
            </motion.div>
          </motion.div>
        </DeviceSetupLayout>
      );
    }

    // Sub-screen: Create Account (signup)
    if (activationMethod === "signup") {
      const handleSignUp = async () => {
        if (!signupEmail.trim() || !signupEmail.includes("@")) {
          setSignupError("Please enter a valid email address");
          return;
        }
        if (!signupPassword.trim() || signupPassword.length < 8) {
          setSignupError("Password must be at least 8 characters");
          return;
        }
        if (!signupAgreed) {
          setSignupError("You must agree to the User Seller Agreement and Privacy Policy");
          return;
        }

        setIsSigningUp(true);
        setSignupError("");

        try {
          const { error } = await supabase.auth.signUp({
            email: signupEmail,
            password: signupPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                country: signupCountry,
              },
            },
          });

          if (error) {
            setSignupError(error.message);
            setIsSigningUp(false);
            return;
          }

          setIsSigningUp(false);
          setSignupStep("otp");
          setSignupOtp("");
          setSignupOtpResendCooldown(30);
        } catch (err) {
          setSignupError("Something went wrong. Please try again.");
          setIsSigningUp(false);
        }
      };

      const handleVerifyOtp = async () => {
        if (signupOtp.length !== 6) {
          setSignupError("Please enter the 6-digit code");
          return;
        }
        setSignupVerifyingOtp(true);
        setSignupError("");

        // Accept any 6-digit code for now (same as activation code flow)
        await new Promise(resolve => setTimeout(resolve, 800));
        setSignupVerifyingOtp(false);
        setSignupStep("business");
      };

      const handleResendOtp = async () => {
        if (signupOtpResendCooldown > 0) return;
        setSignupError("");
        try {
          await supabase.auth.resend({
            type: "signup",
            email: signupEmail,
          });
          setSignupOtpResendCooldown(30);
          toast({ title: "Code resent", description: "A new verification code has been sent to your email." });
        } catch {
          setSignupError("Failed to resend code.");
        }
      };


      const handleOtpKeyPress = (key: string) => {
        if (signupOtp.length < 6) {
          setSignupOtp(prev => prev + key);
          setSignupError("");
        }
      };

      const handleOtpDelete = () => {
        setSignupOtp(prev => prev.slice(0, -1));
        setSignupError("");
      };

      // Step 3a: Business Search Onboarding
      if (signupStep === "business") {
        return (
          <DeviceSetupLayout variant="admin" leftPanelContent={{
              icon: <Building2 className="w-6 h-6 text-primary" />,
              title: "Business Setup",
              description: "Search for your business or add it manually to get started with your account.",
              features: ["Google Places integration", "Category and plan selection", "Bank account setup"]
            }}>
            <BusinessSearchOnboarding
              onNext={(business) => {
                localStorage.setItem("onboarding_business", JSON.stringify(business));
                setSignupStep("onboarding");
              }}
              onManualEntry={() => {}}
              onBack={() => {
                setSignupStep("form");
                setActivationMethod(null);
              }}
              onDevicePinComplete={(pin, pinLen) => {
                // Save device session
                localStorage.setItem("pos_device_session", JSON.stringify({
                  deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  deviceType: "company",
                  trustedAt: new Date().toISOString(),
                }));
                // Save business data
                if (localStorage.getItem("onboarding_business") === null) {
                  localStorage.setItem("onboarding_business", JSON.stringify({ name: "My Business" }));
                }
                // Clear signup state and navigate to clock-in
                setSignupStep("form");
                setActivationMethod(null);
                navigate("/");
              }}
            />
          </DeviceSetupLayout>
        );
      }

      // Step 3b: Merchant Onboarding (replaces trial walkthrough)
      if (signupStep === "onboarding") {
        return (
          <DeviceSetupLayout variant="setup" fullWidthRight leftPanelContent={{
              icon: <Settings className="w-6 h-6 text-primary" />,
              title: "Merchant Setup",
              description: "Configure your restaurant hours, departments, roles, and menu to get operational.",
              features: ["Restaurant hours setup", "Staff roles and permissions", "Menu configuration"]
            }}>
            <MerchantOnboarding
              prefillEmail={signupEmail}
              prefillName={signupFullName}
              onBack={() => setSignupStep("business")}
              onComplete={(data) => {
                localStorage.setItem("pos_device_session", JSON.stringify({
                  deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  deviceType: "company",
                  trustedAt: new Date().toISOString(),
                }));
                localStorage.setItem("pos_session", JSON.stringify({
                  employeeId: "owner",
                  employeeName: data.full_name || signupFullName || "Owner",
                  employeeRole: "Owner",
                  employeeAvatar: "",
                  revenueCenter: data.restaurant_name || "Main",
                  loginTime: new Date().toISOString(),
                }));
                setSignupStep("form");
                setActivationMethod(null);
                setSignupEmail("");
                setSignupPassword("");
                setSignupOtp("");
                setSignupAgreed(false);
                setSignupCountry("United States");
                setTrialStepIndex(0);
                navigate("/");
              }}
            />
          </DeviceSetupLayout>
        );
      }

      // Step 3c: Free Trial Features - Step by step walkthrough (legacy)
      if (signupStep === "trial") {
        const trialSteps = [
          {
            title: "Point-of-Sale Terminal",
            desc: "Start taking payments quickly with a flexible setup to manage your business.",
            icon: <Monitor className="w-5 h-5" />,
            features: [
              { icon: <LayoutGrid className="w-4 h-4" />, title: "Free point-of-sale system", desc: "Get set up quickly and accept flexible payment methods at the counter or on the go." },
              { icon: <UtensilsCrossed className="w-4 h-4" />, title: "Unlimited products", desc: "Add your full menu or catalog with variants, modifiers, and categories." },
            ],
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=340&fit=crop",
          },
          {
            title: "Team Management",
            desc: "Manage your employees, shifts, and permissions all in one place.",
            icon: <Users className="w-5 h-5" />,
            features: [
              { icon: <Users className="w-4 h-4" />, title: "Up to 3 employees", desc: "Add team members with individual PINs and role-based access control." },
              { icon: <Clock className="w-4 h-4" />, title: "Shift scheduling", desc: "Create and manage employee shifts with clock-in and clock-out tracking." },
            ],
            image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=340&fit=crop",
          },
          {
            title: "AI Assistant",
            desc: "Your intelligent business companion that helps manage settings and provides insights.",
            icon: <Sparkles className="w-5 h-5" />,
            features: [
              { icon: <Sparkles className="w-4 h-4" />, title: "Smart settings management", desc: "Use natural language to configure your POS system quickly and efficiently." },
              { icon: <BarChart3 className="w-4 h-4" />, title: "Business insights", desc: "Get real-time analytics and intelligent recommendations for your business." },
            ],
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=340&fit=crop",
          },
          {
            title: "Payments & Security",
            desc: "Accept payments securely with end-to-end encryption and flexible options.",
            icon: <ShieldCheck className="w-5 h-5" />,
            features: [
              { icon: <CreditCard className="w-4 h-4" />, title: "Flexible payments", desc: "Accept credit cards, cash, mobile payments, and split checks with ease." },
              { icon: <ShieldCheck className="w-4 h-4" />, title: "Secure & encrypted", desc: "All transactions are protected with industry-standard end-to-end encryption." },
            ],
            image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop",
          },
          {
            title: "Dashboard",
            desc: "Get a real-time overview of your business performance at a glance.",
            icon: <LayoutGrid className="w-5 h-5" />,
            features: [
              { icon: <LayoutGrid className="w-4 h-4" />, title: "Live business overview", desc: "Monitor sales, orders, and team activity from a single unified dashboard." },
              { icon: <Clock className="w-4 h-4" />, title: "Real-time updates", desc: "See live order statuses, payment activity, and shift information as it happens." },
            ],
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
          },
          {
            title: "Reports & Analytics",
            desc: "Track trends, measure performance, and make data-driven decisions.",
            icon: <BarChart3 className="w-5 h-5" />,
            features: [
              { icon: <BarChart3 className="w-4 h-4" />, title: "Sales reports", desc: "View detailed breakdowns of revenue, top products, and payment methods over any period." },
              { icon: <Settings className="w-4 h-4" />, title: "Custom reporting", desc: "Filter and export reports by date, employee, category, or order type." },
            ],
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop",
          },
        ];

        const currentTrialStep = trialSteps[trialStepIndex] || trialSteps[0];
        const isLastStep = trialStepIndex === trialSteps.length - 1;

        return (
          <DeviceSetupLayout variant="admin" leftPanelContent={{
              icon: <Sparkles className="w-6 h-6 text-primary" />,
              title: "Getting Started",
              description: "Explore the key features that will help you manage your business efficiently.",
              features: ["Quick feature overview", "Interactive walkthrough", "Personalized setup"]
            }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full flex flex-col"
            >
              {/* Top bar with back arrow and trial badge */}
              <div className="flex items-center justify-between mb-6">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    if (trialStepIndex > 0) {
                      setTrialStepIndex(trialStepIndex - 1);
                    } else {
                      setSignupStep("form");
                      setActivationMethod(null);
                      setSignupEmail("");
                      setSignupPassword("");
                      setSignupOtp("");
                      setSignupAgreed(false);
                      setSignupCountry("United States");
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center hover:bg-foreground/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground/70" />
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                >
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">7-Day Free Trial</span>
                </motion.div>
              </div>

              {/* Content */}
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={trialStepIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col"
                  >
                    {/* Title and description */}
                    <h1 className="text-xl font-bold text-foreground mb-1.5">{currentTrialStep.title}</h1>
                    <p className="text-sm text-foreground/50 mb-5 leading-relaxed">{currentTrialStep.desc}</p>

                    {/* Image preview */}
                    <div className="w-full rounded-2xl overflow-hidden mb-5 border border-foreground/[0.06] bg-foreground/[0.03]">
                      <img
                        src={currentTrialStep.image}
                        alt={currentTrialStep.title}
                        className="w-full h-[180px] object-cover"
                      />
                    </div>

                    {/* Features list */}
                    <div className="space-y-3">
                      {currentTrialStep.features.map((feature, i) => (
                        <div key={feature.title} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                            {feature.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                            <p className="text-xs text-foreground/45 leading-relaxed">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom section: dots + button */}
              <div className="flex-shrink-0 pt-5 space-y-4">
                {/* Step dots */}
                <div className="flex items-center justify-center gap-1.5">
                  {trialSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTrialStepIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === trialStepIndex
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-foreground/15 hover:bg-foreground/25"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-[11px] text-foreground/40 text-center">All features included free for 7 days. No credit card required.</p>

                {/* Next / Get Started button */}
                <Button
                  onClick={() => {
                    if (isLastStep) {
                      setSignupStep("form");
                      setActivationMethod(null);
                      setSignupEmail("");
                      setSignupPassword("");
                      setSignupOtp("");
                      setSignupAgreed(false);
                      setSignupCountry("United States");
                      setTrialStepIndex(0);
                      navigate("/");
                    } else {
                      setTrialStepIndex(trialStepIndex + 1);
                    }
                  }}
                  className="w-full h-12 rounded-xl text-sm font-semibold"
                >
                  {isLastStep ? "Get Started" : "Next"}
                </Button>
              </div>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Step 2: OTP Verification
      if (signupStep === "otp") {
        return (
          <DeviceSetupLayout variant="admin" leftPanelContent={{
              icon: <ShieldCheck className="w-6 h-6 text-primary" />,
              title: "Verify Identity",
              description: "Enter the verification code sent to your email to secure your new account.",
              features: ["6-digit verification code", "Email confirmation", "Account security"]
            }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full flex flex-col items-center"
            >
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setSignupStep("form");
                  setSignupOtp("");
                  setSignupError("");
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-2 text-center"
              >
                Verify Your Email
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-2 text-center"
              >
                We sent a 6-digit code to
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-primary font-medium mb-8 text-center"
              >
                {signupEmail}
              </motion.p>

              {/* OTP Input Boxes */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center gap-2.5 mb-6"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    id={`signup-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={signupOtp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val) {
                        const newOtp = signupOtp.substring(0, i) + val + signupOtp.substring(i + 1);
                        setSignupOtp(newOtp.slice(0, 6));
                        setSignupError("");
                        // Auto-focus next
                        if (i < 5) {
                          document.getElementById(`signup-otp-${i + 1}`)?.focus();
                        }
                        // Auto-submit when all 6 digits entered
                        if (newOtp.length === 6 && !signupVerifyingOtp) {
                          setTimeout(() => handleVerifyOtp(), 150);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !signupOtp[i] && i > 0) {
                        const newOtp = signupOtp.substring(0, i - 1) + signupOtp.substring(i);
                        setSignupOtp(newOtp);
                        setSignupError("");
                        document.getElementById(`signup-otp-${i - 1}`)?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (pasted) {
                        setSignupOtp(pasted);
                        setSignupError("");
                        const focusIdx = Math.min(pasted.length, 5);
                        document.getElementById(`signup-otp-${focusIdx}`)?.focus();
                        if (pasted.length === 6 && !signupVerifyingOtp) {
                          setTimeout(() => handleVerifyOtp(), 150);
                        }
                      }
                    }}
                    className={`w-11 h-14 rounded-xl border text-center text-xl font-semibold bg-foreground/[0.03] text-foreground outline-none transition-all duration-150 ${
                      signupOtp[i]
                        ? "border-primary/40 bg-primary/5"
                        : "border-foreground/[0.1]"
                    } focus:border-primary/60 focus:bg-primary/5`}
                    autoFocus={i === 0}
                  />
                ))}
              </motion.div>

              <AnimatePresence mode="wait">
                {signupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 mb-4 w-full"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{signupError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                disabled={signupVerifyingOtp || signupOtp.length !== 6}
                className="w-full h-14 text-base font-medium rounded-2xl mb-3"
                size="lg"
              >
                {signupVerifyingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              {/* Resend */}
              <div className="text-center">
                {signupOtpResendCooldown > 0 ? (
                  <p className="text-sm text-foreground/40">
                    Resend code in <span className="text-foreground/60 font-medium">{signupOtpResendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Step 1: Signup Form (default)
      return (
        <DeviceSetupLayout variant="admin" leftPanelContent={{
            icon: <UserPlus className="w-6 h-6 text-primary" />,
            title: "Create Account",
            description: "Set up a new account to activate and manage this device.",
            features: ["Quick account creation", "Secure email verification", "Instant device access"]
          }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setActivationMethod(null);
                setSignupFullName("");
                setSignupAgreed(false);
                setSignupCountry("United States");
                setSignupEmail("");
                setSignupPassword("");
                setSignupError("");
                setSignupStep("form");
              }}
              className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
            >
              <UserPlus className="w-8 h-8 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-foreground mb-2 text-center"
            >
              Create Account
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-8 text-center"
            >
              Set up a new account to get started
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              <Input
                type="email"
                placeholder="Email address"
                value={signupEmail}
                onChange={(e) => {
                  setSignupEmail(e.target.value);
                  setSignupError("");
                }}
                className="h-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
              />

              <div className="relative">
                <Input
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value);
                    setSignupError("");
                  }}
                  className={`h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                    signupError ? "border-destructive" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Country Selector */}
              <div className="relative">
                <select
                  value={signupCountry}
                  onChange={(e) => {
                    setSignupCountry(e.target.value);
                    setSignupError("");
                  }}
                  className="w-full h-12 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] px-3 text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                >
                  {[
                    "United States", "Canada", "United Kingdom", "Australia", "Germany", "France",
                    "Spain", "Italy", "Netherlands", "Brazil", "Mexico", "India", "Japan",
                    "South Korea", "Singapore", "United Arab Emirates", "Saudi Arabia", "South Africa",
                    "Nigeria", "Argentina", "Colombia", "Chile", "Peru", "Philippines", "Thailand",
                    "Vietnam", "Indonesia", "Malaysia", "New Zealand", "Ireland", "Portugal",
                    "Sweden", "Norway", "Denmark", "Finland", "Belgium", "Switzerland", "Austria",
                    "Poland", "Czech Republic", "Turkey", "Egypt", "Kenya", "Ghana", "Pakistan",
                    "Bangladesh", "Sri Lanka", "Nepal"
                  ].map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
              </div>

              {/* User Seller Agreement & Privacy Policy */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signupAgreed}
                  onChange={(e) => {
                    setSignupAgreed(e.target.checked);
                    setSignupError("");
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-foreground/20 bg-foreground/[0.03] text-primary accent-primary cursor-pointer"
                />
                <span className="text-xs text-foreground/50 leading-relaxed">
                  I agree to the{" "}
                  <a href="https://www.eatos.com/legal-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    User Seller Agreement
                  </a>{" "}
                  and{" "}
                  <a href="https://www.eatos.com/legal-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <AnimatePresence mode="wait">
                {signupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{signupError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleSignUp}
                disabled={isSigningUp || !signupEmail.trim() || !signupPassword.trim() || !signupAgreed}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center pt-2">
                <span className="text-sm text-foreground/40">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivationMethod("password");
                    setSignupError("");
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </motion.div>
        </DeviceSetupLayout>
      );
    }

    // Sub-screen: Email and Password (admin sign-in)
    if (activationMethod === "password") {
      // Password Reset Flow
      if (showForgotPassword) {
        // Format timer display (mm:ss)
        const formatTimer = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Format phone number for display
        const formatPhoneDisplay = (value: string) => {
          const digits = value.replace(/\D/g, '').slice(0, 10);
          if (digits.length <= 3) return digits;
          if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        };

        // Step 3: New password form after OTP verification
        if (showNewPasswordForm) {
          const handleResetPassword = () => {
            if (!newPassword.trim()) {
              setNewPasswordError("Please enter a new password");
              return;
            }
            if (newPassword.length < 8) {
              setNewPasswordError("Password must be at least 8 characters");
              return;
            }
            if (newPassword !== confirmNewPassword) {
              setNewPasswordError("Passwords do not match");
              return;
            }

            setIsSendingReset(true);
            setNewPasswordError("");

            // Simulate password reset
            setTimeout(() => {
              setIsSendingReset(false);
              // Reset all forgot password state
              setShowForgotPassword(false);
              setShowNewPasswordForm(false);
              setResetOtpSent(false);
              setResetOtp("");
              setForgotPasswordEmail("");
              setForgotPasswordPhone("");
              setNewPassword("");
              setConfirmNewPassword("");
              setResetOtpMethod(null);
              toast({
                title: "Password reset successful",
                description: "You can now sign in with your new password"
              });
            }, 1500);
          };

          return (
            <DeviceSetupLayout variant="admin" leftPanelContent={{
                icon: <Lock className="w-6 h-6 text-primary" />,
                title: "Reset Password",
                description: "Enter the verification code to reset your password securely.",
                features: ["Secure code verification", "Password reset link", "Account recovery"]
              }}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full flex flex-col items-center"
              >
                {/* Back Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setShowNewPasswordForm(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setNewPasswordError("");
                  }}
                  className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                >
                  <Lock className="w-8 h-8 text-primary" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-foreground mb-2 text-center"
                >
                  Create New Password
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-foreground/50 mb-8 text-center max-w-xs"
                >
                  Your identity has been verified. Please create a new password.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full space-y-4"
                >
                  {/* New Password */}
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError("");
                      }}
                      className="h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setNewPasswordError("");
                      }}
                      className="h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {newPasswordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{newPasswordError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleResetPassword}
                    disabled={isSendingReset || !newPassword.trim() || !confirmNewPassword.trim()}
                    className="w-full h-14 text-base font-medium rounded-2xl"
                    size="lg"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </motion.div>

                {/* Password Requirements */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 px-4 py-3 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/[0.08] max-w-xs"
                >
                  <p className="text-xs text-foreground/40 leading-relaxed">
                    Password must be at least 8 characters long.
                  </p>
                </motion.div>
              </motion.div>
            </DeviceSetupLayout>
          );
        }

        // Step 2: OTP Entry Screen
        if (resetOtpSent) {
          const handleVerifyResetOtp = () => {
            if (resetOtp.length !== 4) {
              setResetOtpError("Please enter the 4-digit code");
              return;
            }

            setIsVerifyingResetOtp(true);
            setResetOtpError("");

            // Simulate OTP verification
            setTimeout(() => {
              setIsVerifyingResetOtp(false);
              // Accept any 4-digit code for demo
              setShowNewPasswordForm(true);
            }, 1000);
          };

          const handleResendOtp = () => {
            if (resetResendCooldown > 0 || isSendingReset) return;
            
            setIsSendingReset(true);
            setTimeout(() => {
              setIsSendingReset(false);
              setResetResendCooldown(30);
              setResetOtpTimer(300); // Reset to 5 minutes
              setResetOtp("");
              toast({
                title: "OTP resent",
                description: `Check your ${resetOtpMethod === "email" ? "inbox" : "messages"} for the new code`
              });
            }, 1000);
          };

          const displayDestination = resetOtpMethod === "email" 
            ? forgotPasswordEmail 
            : `+1 ${formatPhoneDisplay(forgotPasswordPhone)}`;

          return (
            <DeviceSetupLayout variant="admin" leftPanelContent={{
                icon: <Lock className="w-6 h-6 text-primary" />,
                title: "New Password",
                description: "Create a new secure password for your account.",
                features: ["6-character minimum", "Secure password update", "Instant access after reset"]
              }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full flex flex-col items-center text-center"
              >
                {/* Back Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setResetOtpSent(false);
                    setResetOtp("");
                    setResetOtpError("");
                    setResetOtpTimer(0);
                  }}
                  className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center mb-6 border border-foreground/[0.08]"
                >
                  {resetOtpMethod === "email" ? (
                    <Mail className="w-8 h-8 text-foreground/50" />
                  ) : (
                    <Phone className="w-8 h-8 text-foreground/50" />
                  )}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-foreground mb-2"
                >
                  {resetOtpMethod === "email" ? "Email" : "Phone"} Verification
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-foreground/50 mb-1"
                >
                  Please enter 4 digit verification code that we sent to
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-foreground/70 mb-6"
                >
                  {displayDestination}
                </motion.p>

                {/* OTP Input Boxes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex gap-3 justify-center mb-4"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={resetOtp[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 1) {
                          const newOtp = resetOtp.split('');
                          newOtp[index] = value;
                          setResetOtp(newOtp.join(''));
                          setResetOtpError("");
                          
                          // Auto-focus next input
                          if (value && index < 3) {
                            const nextInput = e.target.nextElementSibling as HTMLInputElement;
                            if (nextInput) nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === "Backspace" && !resetOtp[index] && index > 0) {
                          const prevInput = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      className={`w-14 h-16 text-center text-2xl font-semibold rounded-xl border-2 bg-foreground/[0.03] focus:outline-none focus:border-primary transition-colors ${
                        resetOtpError ? "border-destructive" : "border-foreground/[0.1]"
                      }`}
                    />
                  ))}
                </motion.div>

                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={resetOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setResetOtp(val);
                    setResetOtpError("");
                  }}
                  className="sr-only"
                />

                {/* Timer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-foreground/40 mb-6"
                >
                  {resetOtpTimer > 0 ? (
                    <span>{formatTimer(resetOtpTimer)}</span>
                  ) : (
                    <span className="text-destructive">Code expired</span>
                  )}
                </motion.div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {resetOtpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 mb-4 w-full"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{resetOtpError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyResetOtp}
                  disabled={isVerifyingResetOtp || resetOtp.length !== 4 || resetOtpTimer === 0}
                  className="w-full h-14 text-base font-medium rounded-2xl mb-4"
                  size="lg"
                >
                  {isVerifyingResetOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                {/* Resend Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <button
                    onClick={handleResendOtp}
                    disabled={resetResendCooldown > 0 || isSendingReset}
                    className={`text-sm transition-colors ${
                      resetResendCooldown > 0 || isSendingReset
                        ? "text-foreground/30 cursor-not-allowed"
                        : "text-primary/70 hover:text-primary"
                    }`}
                  >
                    {isSendingReset ? (
                      "Sending..."
                    ) : resetResendCooldown > 0 ? (
                      `Resend OTP in ${resetResendCooldown}s`
                    ) : (
                      "Didn't receive code? Resend OTP"
                    )}
                  </button>
                </motion.div>
              </motion.div>
            </DeviceSetupLayout>
          );
        }

        // Step 1: Forgot password input screen - Email OR Phone
        const handleSendOtp = () => {
          const hasEmail = forgotPasswordEmail.trim();
          const hasPhone = forgotPasswordPhone.trim();

          if (!hasEmail && !hasPhone) {
            setForgotPasswordError("Please enter email or mobile number");
            return;
          }

          // If both are filled, prefer email
          if (hasEmail) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(forgotPasswordEmail)) {
              setForgotPasswordError("Please enter a valid email address");
              return;
            }
            setResetOtpMethod("email");
          } else {
            // Phone validation
            const phoneDigits = forgotPasswordPhone.replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
              setForgotPasswordError("Please enter a valid 10-digit phone number");
              return;
            }
            setResetOtpMethod("phone");
          }

          setIsSendingReset(true);
          setForgotPasswordError("");

          // Simulate sending OTP
          setTimeout(() => {
            setIsSendingReset(false);
            setResetOtpSent(true);
            setResetOtpTimer(300); // 5 minutes
            setResetResendCooldown(30);
          }, 1500);
        };

        return (
          <DeviceSetupLayout variant="admin" leftPanelContent={{
              icon: <Lock className="w-6 h-6 text-primary" />,
              title: "Forgot Password",
              description: "Enter your email or phone to receive a password reset code.",
              features: ["Email or SMS recovery", "Secure reset process", "Quick account access"]
            }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full flex flex-col items-center"
            >
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail("");
                  setForgotPasswordPhone("");
                  setForgotPasswordError("");
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center mb-6 border border-foreground/[0.08]"
              >
                <KeyRound className="w-8 h-8 text-foreground/50" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-2 text-center"
              >
                Forgot Password
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-6 text-center max-w-xs"
              >
                Please select an option to change password
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full space-y-4"
              >
                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter Your Email"
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setForgotPasswordError("");
                    }}
                    className="h-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                  />
                </div>

                {/* Or Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-foreground/[0.1]" />
                  <span className="text-sm font-medium text-foreground/50">Or</span>
                  <div className="flex-1 h-px bg-foreground/[0.1]" />
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="h-12 px-3 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-medium text-foreground/70">+1</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="(XXX) XXX-XXXX"
                      value={formatPhoneDisplay(forgotPasswordPhone)}
                      onChange={(e) => {
                        setForgotPasswordPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setForgotPasswordError("");
                      }}
                      className="h-12 flex-1 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                  </div>
                </div>

                
                <AnimatePresence mode="wait">
                  {forgotPasswordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{forgotPasswordError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSendOtp}
                  disabled={isSendingReset || (!forgotPasswordEmail.trim() && !forgotPasswordPhone.trim())}
                  className="w-full h-14 text-base font-medium rounded-2xl"
                  size="lg"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "SEND OTP"
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-sm text-foreground/50">Got your password?</span>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                      setForgotPasswordPhone("");
                      setForgotPasswordError("");
                    }}
                    className="text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </DeviceSetupLayout>
        );
      }

      // Main admin sign-in form
      return (
        <DeviceSetupLayout variant="admin" leftPanelContent={{
            icon: <ShieldCheck className="w-6 h-6 text-primary" />,
            title: "Account Access",
            description: "Sign in with your credentials to activate and manage this device.",
            features: ["Full device management", "Configure business settings", "Assign staff permissions"]
          }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Back Button - Self-aligned at top left */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBackFromMethod}
              className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center mb-6 border border-foreground/[0.08]"
            >
              <Lock className="w-8 h-8 text-foreground/50" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-foreground mb-2 text-center"
            >
              Sign In
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-8 text-center"
            >
              Sign in with your credentials
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              <Input
                type="email"
                placeholder="Email address"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setActivationError("");
                }}
                className="h-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
              />
              
              <div className="relative">
                <Input
                  type={showAdminPassword ? "text" : "password"}
                  placeholder="Password"
                  value={adminPassword}
                  onFocus={() => setShowAdminEmailKeyboard(false)}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setActivationError("");
                  }}
                  className={`h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                    activationError ? "border-destructive" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Forgot Password Link - Below Password field */}
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordEmail(adminEmail);
                    setForgotPasswordKeyboardField("email");
                    setShowAdminEmailKeyboard(false);
                  }}
                  className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
                >
                  Forgot password?
                </button>
              </div>


              <AnimatePresence mode="wait">
                {activationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{activationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleAdminSignIn}
                disabled={isActivating || !adminEmail.trim() || !adminPassword.trim()}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center pt-2">
                <span className="text-sm text-foreground/40">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivationMethod("signup");
                    setActivationError("");
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Create Account
                </button>
              </div>

            </motion.div>
          </motion.div>
        </DeviceSetupLayout>
      );
    }


    return (
      <DeviceSetupLayout variant="setup" leftPanelContent={{
          icon: <Monitor className="w-6 h-6 text-primary" />,
          title: "Choose Device Type",
          description: "Select how this device will be used to get the right setup experience.",
          features: ["Company or personal device", "Secure activation options", "Demo mode available"]
        }}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full flex flex-col items-center"
        >
          {/* Back Button - Self-aligned at top left */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              setActivationApproach(null);
              setActivationMethod(null);
              setActivationCode("");
              setActivationError("");
            }}
            className="self-start mb-3 md:mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </motion.button>

          {/* Logo - only show on mobile */}
          <motion.img
            src={eatosLogo}
            alt="POS AI"
            className="w-16 h-auto mb-3 md:hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Setup Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 md:mb-6 border border-primary/20"
          >
            <Monitor className="w-6 h-6 md:w-10 md:h-10 text-primary" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-xl md:text-2xl font-semibold text-foreground mb-2 text-center"
          >
            Set Up This Device
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-foreground/50 mb-4 md:mb-8 text-center max-w-xs leading-relaxed"
          >
            This device is not yet linked to a business. Choose how to activate it.
          </motion.p>

          {/* Primary Activation Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full space-y-2 md:space-y-3"
          >
            {/* Activate with Code */}
            <button
              onClick={() => setActivationMethod("code")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-foreground mb-0.5">
                  Activate with Code
                </p>
                <p className="text-sm text-foreground/50">
                  Enter a code from your admin portal
                </p>
              </div>
            </button>

            <button
              onClick={() => setActivationMethod("link")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#252525] hover:bg-[#1C1C1C] border border-white/[0.06] hover:border-blue-500/30 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/15 transition-colors">
                <Link2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-foreground mb-0.5">
                  Sign in with Link
                </p>
                <p className="text-sm text-foreground/50">
                  Get a magic link via email or SMS
                </p>
              </div>
            </button>




          </motion.div>

          {/* Secondary Option: Try Demo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full mt-3 md:mt-6"
          >
            <button
              onClick={handleTryDemo}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/25 transition-all duration-200"
            >
              <FlaskConical className="w-5 h-5 text-amber-500" />
              <span className="text-[15px] font-medium text-amber-600 dark:text-amber-400">
                Try Demo Mode
              </span>
            </button>
          </motion.div>

          {/* Hidden fallback: Email and password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-foreground/[0.06] w-full"
          >
            <div className="text-center space-y-2">
              <button
                onClick={() => setActivationMethod("password")}
                className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                Sign in with email and password
              </button>
              <div>
                <button
                  onClick={() => setActivationMethod("signup")}
                  className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          </motion.div>

          {/* Help Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 md:mt-4"
          >
            <button
              onClick={() => setShowContactAdmin(true)}
              className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              Need help?
            </button>
          </motion.div>
        </motion.div>

        <ContactAdminDialog 
          open={showContactAdmin} 
          onOpenChange={setShowContactAdmin} 
        />


      </DeviceSetupLayout>
    );
  }

  // Personal Device - Clock-In Success Screen with auto-redirect
  if (deviceType === "personal" && showPersonalSuccess && invitedUser && personalClockInTime) {
    const formattedTime = personalClockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
          {/* Success Icon with pulse animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center mb-8 relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500/10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
          
          {/* Main confirmation text */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-foreground mb-2"
          >
            You are now clocked in
          </motion.h1>
          
          {/* Employee name */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-foreground/60 mb-1"
          >
            {invitedUser.name}
          </motion.p>
          
          {/* Time */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-foreground/40"
          >
            {formattedTime}
          </motion.p>
          
          {/* Redirecting indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-2 text-xs text-foreground/30"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Redirecting to home...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Personal Device - Clock-Out Success Screen
  if (deviceType === "personal" && showClockOutSuccess && invitedUser && personalClockInTime && personalClockOutTime) {
    const shiftDuration = getShiftDuration(personalClockInTime, personalClockOutTime);
    const clockOutFormatted = personalClockOutTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
          {/* Success Icon with pulse animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-amber-500/15 flex items-center justify-center mb-8 relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-500/10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <CheckCircle2 className="w-12 h-12 text-amber-500" />
          </motion.div>
          
          {/* Main confirmation text */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-foreground mb-2"
          >
            You are now clocked out
          </motion.h1>
          
          {/* Employee name */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-foreground/60 mb-1"
          >
            {invitedUser.name}
          </motion.p>
          
          {/* Shift summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 px-6 py-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]"
          >
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-foreground/40 text-xs uppercase tracking-wider mb-1">Duration</p>
                <p className="font-medium text-foreground">{shiftDuration}</p>
              </div>
              <div className="w-px h-8 bg-foreground/10" />
              <div className="text-center">
                <p className="text-foreground/40 text-xs uppercase tracking-wider mb-1">Clock Out</p>
                <p className="font-medium text-foreground">{clockOutFormatted}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Session ending indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center gap-2 text-xs text-foreground/30"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {postClockOutPolicy === "logout" 
                ? "Ending session..." 
                : "Returning to home..."}
            </span>
          </motion.div>
          
          {/* Policy indicator */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-2 text-xs text-foreground/20"
          >
            {postClockOutPolicy === "logout"
              ? "Your session will be fully logged out"
              : "You'll need to sign in again for your next shift"}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Personal Device - Clock-Out Confirmation Screen
  if (deviceType === "personal" && showPersonalClockOut && invitedUser && personalClockInTime && personalClockOutTime) {
    const clockInFormatted = personalClockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const clockOutFormatted = personalClockOutTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const shiftDuration = getShiftDuration(personalClockInTime, personalClockOutTime);

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center"
        >
          {/* Employee Avatar & Name */}
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
            <User className="w-10 h-10 text-amber-500/60" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">{invitedUser.name}</h1>
          <p className="text-sm text-foreground/50 mb-8">Review your shift summary</p>

          {/* Clock-Out Details */}
          <div className="w-full space-y-3 mb-8">
            {/* Role */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Role</p>
                <p className="text-[15px] font-medium text-foreground">{invitedUser.role}</p>
              </div>
            </div>

            {/* Revenue Center */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Revenue Center</p>
                <p className="text-[15px] font-medium text-foreground">Main Dining</p>
              </div>
            </div>

            {/* Shift Duration */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Shift Duration</p>
                <p className="text-[15px] font-medium text-foreground">{shiftDuration}</p>
                <p className="text-xs text-foreground/40">{clockInFormatted} – {clockOutFormatted}</p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handlePersonalClockOut}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
          >
            Confirm Clock Out
          </Button>

          {/* Cancel */}
          <button
            onClick={() => {
              setShowPersonalClockOut(false);
              setPersonalClockOutTime(null);
            }}
            className="mt-4 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  // Personal Device - Clock-In Confirmation Screen
  if (deviceType === "personal" && showPersonalClockIn && invitedUser && personalClockInTime) {
    const formattedTime = personalClockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const formattedDate = personalClockInTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center"
        >
          {/* Employee Avatar & Name */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <User className="w-10 h-10 text-primary/60" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">{invitedUser.name}</h1>
          <p className="text-sm text-foreground/50 mb-8">Confirm your shift details</p>

          {/* Clock-In Details */}
          <div className="w-full space-y-3 mb-8">
            {/* Role */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Role</p>
                <p className="text-[15px] font-medium text-foreground">{invitedUser.role}</p>
              </div>
              <div className="text-xs text-foreground/30 px-2 py-1 rounded-full bg-foreground/[0.04]">
                Assigned
              </div>
            </div>

            {/* Revenue Center */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Revenue Center</p>
                <p className="text-[15px] font-medium text-foreground">Main Dining</p>
              </div>
              <div className="text-xs text-foreground/30 px-2 py-1 rounded-full bg-foreground/[0.04]">
                Assigned
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Start Time</p>
                <p className="text-[15px] font-medium text-foreground">{formattedTime}</p>
                <p className="text-xs text-foreground/40">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button 
            onClick={handlePersonalClockIn}
            className="w-full h-14 text-base font-medium rounded-2xl"
            size="lg"
          >
            Confirm Clock In
          </Button>
        </motion.div>
      </div>
    );
  }

  // Personal Device - Clock-In PIN Entry Screen
  // Personal Device - Clock-In PIN Entry Screen
  if (deviceType === "personal" && showPersonalPinEntry && invitedUser) {
    const currentTime = new Date();
    const formattedDateDisplay = currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const formattedTimeDisplay = currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const hour = currentTime.getHours();
    let timeOfDay = { label: "Night", iconClass: "text-slate-300" };
    if (hour >= 5 && hour < 12) {
      timeOfDay = { label: "Morning", iconClass: "text-amber-400" };
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = { label: "Afternoon", iconClass: "text-yellow-400" };
    } else if (hour >= 17 && hour < 20) {
      timeOfDay = { label: "Evening", iconClass: "text-orange-400" };
    }

    return (
      <div className="fixed inset-0 login-bg flex overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        {/* Mobile Layout */}
        <div className="relative z-10 w-full flex flex-col md:hidden h-full items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setShowPersonalPinEntry(false);
                setPersonalPin("");
                setPersonalPinError("");
                setShow2FA(true);
              }}
              className="absolute top-8 left-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            {/* Employee Avatar & Name */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-foreground/[0.08] flex items-center justify-center mb-3 border border-foreground/[0.06]">
                <User className="w-10 h-10 text-foreground/40" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">{invitedUser.name}</h1>
              <p className="text-sm text-foreground/50">{invitedUser.role}</p>
            </motion.div>

            {/* PIN Dots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex gap-4 mb-4"
            >
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={personalPinError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    personalPinError
                      ? "bg-destructive"
                      : i < personalPin.length 
                        ? "bg-primary scale-110" 
                        : "bg-foreground/[0.12] border border-foreground/[0.08]"
                  }`}
                />
              ))}
            </motion.div>

            {/* Error/Hint Message */}
            <div className="h-8 flex items-center justify-center mb-4">
              <AnimatePresence mode="wait">
                {personalPinError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    <span className="text-sm font-medium text-destructive">{personalPinError}</span>
                  </motion.div>
                ) : isVerifyingPersonalPin ? (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground/50">Verifying...</span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-foreground/40"
                  >
                    Enter your Clock-In PIN
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Keypad */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 w-full max-w-[280px]"
            >
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePersonalPinPress(num.toString())}
                    disabled={isVerifyingPersonalPin}
                    className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    {num}
                  </motion.button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePersonalPinPress("0")}
                  disabled={isVerifyingPersonalPin}
                  className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  0
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePersonalPinDelete}
                  disabled={isVerifyingPersonalPin}
                  className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  <Delete className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                  <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
                </button>
                
                <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                  <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
                </button>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs text-foreground/30 mt-6"
            >
              Forgot PIN? Contact your manager
            </motion.p>
          </motion.div>
        </div>

        {/* Tablet/Desktop Layout - Two Panel */}
        <div className="relative z-10 hidden md:flex w-full h-full">
          {/* Left Panel - Context Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-[42%] lg:w-[38%] min-w-[360px] max-w-[520px] h-full flex flex-col bg-foreground/[0.015] border-r border-foreground/[0.06]"
          >
            <div className="flex-1 flex flex-col justify-center px-10 lg:px-14 py-10">
              <motion.img
                src={eatosLogo}
                alt="POS AI"
                className="w-24 h-auto mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="w-16 h-16 rounded-2xl overflow-hidden"
                >
                  <img 
                    src={restaurantLogo} 
                    alt="The Rustic Table" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Restaurant</p>
                  <p className="text-base font-medium text-foreground">The Rustic Table</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-foreground/40" />
                    <p className="text-base text-foreground/80">Downtown - Main Street</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Device</p>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-foreground/40" />
                    <p className="text-base text-foreground/80">Personal Device</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-foreground/40" />
                    <p className="text-base text-foreground/80">{formattedTimeDisplay} | {formattedDateDisplay}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {hour >= 5 && hour < 12 ? (
                      <Sunrise className={`w-4 h-4 ${timeOfDay.iconClass}`} strokeWidth={1.5} />
                    ) : hour >= 12 && hour < 17 ? (
                      <Sun className={`w-4 h-4 ${timeOfDay.iconClass}`} strokeWidth={1.5} />
                    ) : hour >= 17 && hour < 20 ? (
                      <Sunset className={`w-4 h-4 ${timeOfDay.iconClass}`} strokeWidth={1.5} />
                    ) : (
                      <Moon className={`w-4 h-4 ${timeOfDay.iconClass}`} strokeWidth={1.5} />
                    )}
                    <p className="text-sm text-foreground/50">72°F · {timeOfDay.label}</p>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="px-8 pb-6 flex items-center justify-between">
              <p className="text-xs text-foreground/20">eatOS POSAI 6 v2.4.1</p>
              <button
                onClick={() => {
                  setShowPersonalPinEntry(false);
                  setPersonalPin("");
                  setPersonalPinError("");
                  setShow2FA(true);
                }}
                className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </motion.div>

          {/* Right Panel - PIN Entry */}
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              {/* Employee Avatar & Name */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-foreground/[0.08] flex items-center justify-center mb-3 border border-foreground/[0.06]">
                  <User className="w-10 h-10 text-foreground/40" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">{invitedUser.name}</h1>
                <p className="text-sm text-foreground/50">{invitedUser.role}</p>
              </motion.div>

              {/* PIN Dots */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-4 mb-4"
              >
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={personalPinError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      personalPinError
                        ? "bg-destructive"
                        : i < personalPin.length 
                          ? "bg-primary scale-110" 
                          : "bg-foreground/[0.12] border border-foreground/[0.08]"
                    }`}
                  />
                ))}
              </motion.div>

              {/* Error/Hint Message */}
              <div className="h-8 flex items-center justify-center mb-6">
                <AnimatePresence mode="wait">
                  {personalPinError ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-destructive">{personalPinError}</span>
                    </motion.div>
                  ) : isVerifyingPersonalPin ? (
                    <motion.div
                      key="verifying"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-foreground/50">Verifying...</span>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-foreground/40"
                    >
                      Enter your Clock-In PIN
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Keypad */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-3 w-full max-w-[280px]"
              >
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePersonalPinPress(num.toString())}
                      disabled={isVerifyingPersonalPin}
                      className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePersonalPinPress("0")}
                    disabled={isVerifyingPersonalPin}
                    className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    0
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePersonalPinDelete}
                    disabled={isVerifyingPersonalPin}
                    className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    <Delete className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                    <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
                  </button>
                  
                  <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                    <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
                  </button>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-foreground/30 mt-8"
              >
                Forgot PIN? Contact your manager
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Personal Device - 2FA OTP Screen
  if (deviceType === "personal" && show2FA && invitedUser) {
    // Success overlay after OTP verification
    if (showOtpSuccess) {
      return (
        <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-30" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-10 flex flex-col items-center px-6 text-center"
          >
            {/* Success Icon with pulse animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center mb-6 relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-500/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2, stiffness: 300 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
            </motion.div>
            
            {/* Success text */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-foreground mb-2"
            >
              Verification Successful
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-foreground/50 mb-8"
            >
              Identity confirmed
            </motion.p>
            
            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-xs text-foreground/30"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Preparing clock-in...</span>
            </motion.div>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 login-bg flex overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        {/* Left Panel - Tablet/Desktop only */}
        <div className="hidden md:block relative z-10">
          <PersonalDeviceAuthPanel currentScreen={otpSent ? "verification-code" : "2fa-selection"} invitedUser={invitedUser} />
        </div>
        
        {/* Right Panel - Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setShow2FA(false);
                setOtpMethod(null);
                setOtp("");
                setOtpError("");
                setOtpSent(false);
              }}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            <AnimatePresence mode="wait">
              {!otpSent ? (
              // Method Selection
              <motion.div
                key="method-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center w-full"
              >
                {/* Shield Icon */}
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <ShieldCheck className="w-10 h-10 text-primary/60" />
                </div>

                <h1 className="text-xl font-semibold text-foreground mb-2">
                  Two-Factor Authentication
                </h1>
                
                <p className="text-sm text-foreground/50 mb-8 text-center">
                  Choose how you'd like to receive your verification code
                </p>

                {/* Method Options */}
                <div className="w-full space-y-3">
                  <button
                    onClick={() => handleSendOtp("sms")}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">Text Message (SMS)</p>
                      <p className="text-xs text-foreground/50">Send code to •••• •••• 4521</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendOtp("email")}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">Email</p>
                      <p className="text-xs text-foreground/50">Send code to {invitedUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</p>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-foreground/30 mt-8 text-center">
                  Required by your organization's security policy
                </p>
              </motion.div>
            ) : (
              // OTP Entry
              <motion.div
                key="otp-entry"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center w-full"
              >
                {/* Method Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  otpMethod === "sms" ? "bg-emerald-500/10" : "bg-amber-500/10"
                }`}>
                  {otpMethod === "sms" ? (
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <Mail className="w-8 h-8 text-amber-600" />
                  )}
                </div>

                <h1 className="text-xl font-semibold text-foreground mb-2">
                  Enter Verification Code
                </h1>
                
                <p className="text-sm text-foreground/50 mb-6 text-center">
                  {otpMethod === "sms" 
                    ? "We sent a 6-digit code to your phone" 
                    : "We sent a 6-digit code to your email"}
                </p>

                {/* OTP Input */}
                <div className="w-full space-y-6">
                  {/* Visual OTP boxes */}
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                          otpError
                            ? "border-destructive bg-destructive/5"
                            : otp[i]
                              ? "border-primary bg-primary/5 text-foreground"
                              : i === otp.length
                                ? "border-primary/50 bg-foreground/[0.03] text-foreground/30"
                                : "border-foreground/10 bg-foreground/[0.03] text-foreground/30"
                        }`}
                      >
                        {otp[i] || ""}
                      </div>
                    ))}
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {otpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{otpError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="w-full h-14 text-base font-medium rounded-2xl"
                    size="lg"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  {/* Number Pad */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <motion.button
                        key={num}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (otp.length < 6) {
                            const newOtp = otp + num.toString();
                            setOtp(newOtp);
                            setOtpError("");
                            // Auto-submit when all 6 digits are entered
                            if (newOtp.length === 6 && !isVerifyingOtp) {
                              setTimeout(() => handleVerifyOtp(), 150);
                            }
                          }
                        }}
                        className="h-16 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] text-2xl font-semibold text-foreground transition-all duration-150 active:bg-foreground/[0.12]"
                      >
                        {num}
                      </motion.button>
                    ))}
                    {/* Empty space */}
                    <div />
                    {/* Zero */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (otp.length < 6) {
                          const newOtp = otp + "0";
                          setOtp(newOtp);
                          setOtpError("");
                          if (newOtp.length === 6 && !isVerifyingOtp) {
                            setTimeout(() => handleVerifyOtp(), 150);
                          }
                        }
                      }}
                      className="h-16 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] text-2xl font-semibold text-foreground transition-all duration-150 active:bg-foreground/[0.12]"
                    >
                      0
                    </motion.button>
                    {/* Delete */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setOtp(otp.slice(0, -1));
                        setOtpError("");
                      }}
                      className="h-16 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] text-foreground transition-all duration-150 active:bg-foreground/[0.12] flex items-center justify-center"
                    >
                      <Delete className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Resend */}
                  <div className="text-center">
                    <p className="text-sm text-foreground/50 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? "" : "group-hover:rotate-180 transition-transform"}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>

                  {/* Change method */}
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpMethod(null);
                      setOtp("");
                      setOtpError("");
                    }}
                    className="w-full text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    Use a different verification method
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>
    );
  }

  // Personal Device - Identity Verification Screen
  if (deviceType === "personal" && showIdentityVerification && invitedUser) {
    // Format timer display (mm:ss)
    const formatTimer = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format phone number for display
    const formatPhoneDisplay = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    // Handle resend OTP for Personal Device
    const handlePersonalResendOtp = () => {
      if (resetResendCooldown > 0 || isSendingReset) return;
      
      setIsSendingReset(true);
      setTimeout(() => {
        setIsSendingReset(false);
        setResetOtpTimer(300);
        setResetResendCooldown(30);
        toast({
          title: "Code Resent",
          description: `A new verification code has been sent to your ${resetOtpMethod === "email" ? "email" : "phone"}`
        });
      }, 1000);
    };

    // Forgot Password Flow for Personal Device
    if (showForgotPassword) {
      // Step 3: New password form after OTP verification
      if (showNewPasswordForm) {
        const handleResetPassword = () => {
          if (!newPassword.trim()) {
            setNewPasswordError("Please enter a new password");
            return;
          }
          if (newPassword.length < 8) {
            setNewPasswordError("Password must be at least 8 characters");
            return;
          }
          if (newPassword !== confirmNewPassword) {
            setNewPasswordError("Passwords do not match");
            return;
          }

          setIsSendingReset(true);
          setNewPasswordError("");

          // Simulate password reset
          setTimeout(() => {
            setIsSendingReset(false);
            // Reset all forgot password state
            setShowForgotPassword(false);
            setShowNewPasswordForm(false);
            setResetOtpSent(false);
            setResetOtp("");
            setForgotPasswordEmail("");
            setForgotPasswordPhone("");
            setNewPassword("");
            setConfirmNewPassword("");
            setResetOtpMethod(null);
            toast({
              title: "Password reset successful",
              description: "You can now sign in with your new password"
            });
          }, 1500);
        };

        return (
          <div className="fixed inset-0 login-bg flex overflow-hidden">
            <div className="absolute inset-0 gradient-mesh opacity-30" />
            
            <div className="hidden md:block relative z-10">
              <PersonalDeviceAuthPanel currentScreen="sign-in" invitedUser={invitedUser} />
            </div>
            
            <div className="relative z-10 flex-1 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                {/* Back Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setShowNewPasswordForm(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setNewPasswordError("");
                  }}
                  className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                >
                  <Lock className="w-8 h-8 text-primary" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-foreground mb-2 text-center"
                >
                  Create New Password
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-foreground/50 mb-8 text-center max-w-xs"
                >
                  Your identity has been verified. Please create a new password.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full space-y-4"
                >
                  {/* New Password */}
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError("");
                      }}
                      className="h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setNewPasswordError("");
                      }}
                      className="h-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {newPasswordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{newPasswordError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleResetPassword}
                    disabled={isSendingReset || !newPassword.trim() || !confirmNewPassword.trim()}
                    className="w-full h-14 text-base font-medium rounded-2xl"
                    size="lg"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </motion.div>

                {/* Password Requirements */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 px-4 py-3 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/[0.08] max-w-xs"
                >
                  <p className="text-xs text-foreground/40 leading-relaxed">
                    Password must be at least 8 characters long.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        );
      }

      // Step 2: OTP Entry Screen
      if (resetOtpSent) {
        const handleVerifyResetOtp = () => {
          if (resetOtp.length !== 4) {
            setResetOtpError("Please enter a valid 4-digit code");
            return;
          }

          setIsVerifyingResetOtp(true);
          setResetOtpError("");

          // Simulate OTP verification
          setTimeout(() => {
            setIsVerifyingResetOtp(false);
            // For demo: accept "1234" or any code
            if (resetOtp === "1234" || resetOtp.length === 4) {
              setShowNewPasswordForm(true);
            } else {
              setResetOtpError("Invalid verification code");
            }
          }, 1500);
        };

        return (
          <div className="fixed inset-0 login-bg flex overflow-hidden">
            <div className="absolute inset-0 gradient-mesh opacity-30" />
            
            <div className="hidden md:block relative z-10">
              <PersonalDeviceAuthPanel currentScreen="sign-in" invitedUser={invitedUser} />
            </div>
            
            <div className="relative z-10 flex-1 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                {/* Back Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setResetOtpSent(false);
                    setResetOtp("");
                    setResetOtpError("");
                  }}
                  className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center mb-6 border border-foreground/[0.08]"
                >
                  {resetOtpMethod === "email" ? (
                    <Mail className="w-8 h-8 text-foreground/50" />
                  ) : (
                    <Phone className="w-8 h-8 text-foreground/50" />
                  )}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-foreground mb-2 text-center"
                >
                  Enter Verification Code
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-foreground/50 mb-6 text-center max-w-xs"
                >
                  We've sent a 4-digit code to your {resetOtpMethod === "email" ? "email" : "phone"}
                </motion.p>

                {/* OTP Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3 mb-4"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={resetOtp[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value) {
                          const newOtp = resetOtp.split('');
                          newOtp[index] = value;
                          setResetOtp(newOtp.join('').slice(0, 4));
                          setResetOtpError("");
                          // Auto-focus next input
                          const nextInput = (e.target as HTMLElement).nextElementSibling as HTMLInputElement;
                          if (nextInput && value) nextInput.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !resetOtp[index]) {
                          const prevInput = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      className={`w-14 h-16 text-center text-2xl font-semibold rounded-xl border-2 bg-foreground/[0.03] focus:outline-none focus:border-primary transition-colors ${
                        resetOtpError ? "border-destructive" : "border-foreground/[0.1]"
                      }`}
                    />
                  ))}
                </motion.div>

                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={resetOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setResetOtp(val);
                    setResetOtpError("");
                  }}
                  className="sr-only"
                />

                {/* Timer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-foreground/40 mb-6"
                >
                  {resetOtpTimer > 0 ? (
                    <span>{formatTimer(resetOtpTimer)}</span>
                  ) : (
                    <span className="text-destructive">Code expired</span>
                  )}
                </motion.div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {resetOtpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 mb-4 w-full"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{resetOtpError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyResetOtp}
                  disabled={isVerifyingResetOtp || resetOtp.length !== 4 || resetOtpTimer === 0}
                  className="w-full h-14 text-base font-medium rounded-2xl mb-4"
                  size="lg"
                >
                  {isVerifyingResetOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                {/* Resend Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <button
                    onClick={handlePersonalResendOtp}
                    disabled={resetResendCooldown > 0 || isSendingReset}
                    className={`text-sm transition-colors ${
                      resetResendCooldown > 0 || isSendingReset
                        ? "text-foreground/30 cursor-not-allowed"
                        : "text-primary/70 hover:text-primary"
                    }`}
                  >
                    {isSendingReset ? (
                      "Sending..."
                    ) : resetResendCooldown > 0 ? (
                      `Resend OTP in ${resetResendCooldown}s`
                    ) : (
                      "Didn't receive code? Resend OTP"
                    )}
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        );
      }

      // Step 1: Forgot password input screen - Email OR Phone
      const handleSendOtp = () => {
        const hasEmail = forgotPasswordEmail.trim();
        const hasPhone = forgotPasswordPhone.trim();

        if (!hasEmail && !hasPhone) {
          setForgotPasswordError("Please enter email or mobile number");
          return;
        }

        // If both are filled, prefer email
        if (hasEmail) {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(forgotPasswordEmail)) {
            setForgotPasswordError("Please enter a valid email address");
            return;
          }
          setResetOtpMethod("email");
        } else {
          // Phone validation
          const phoneDigits = forgotPasswordPhone.replace(/\D/g, '');
          if (phoneDigits.length !== 10) {
            setForgotPasswordError("Please enter a valid 10-digit phone number");
            return;
          }
          setResetOtpMethod("phone");
        }

        setIsSendingReset(true);
        setForgotPasswordError("");

        // Simulate sending OTP
        setTimeout(() => {
          setIsSendingReset(false);
          setResetOtpSent(true);
          setResetOtpTimer(300); // 5 minutes
          setResetResendCooldown(30);
        }, 1500);
      };

      return (
        <div className="fixed inset-0 login-bg flex overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-30" />
          
          <div className="hidden md:block relative z-10">
            <PersonalDeviceAuthPanel currentScreen="sign-in" invitedUser={invitedUser} />
          </div>
          
          <div className="relative z-10 flex-1 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail("");
                  setForgotPasswordPhone("");
                  setForgotPasswordError("");
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center mb-6 border border-foreground/[0.08]"
              >
                <KeyRound className="w-8 h-8 text-foreground/50" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-2 text-center"
              >
                Forgot Password
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-foreground/50 mb-6 text-center max-w-xs"
              >
                Please select an option to change password
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full space-y-4"
              >
                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter Your Email"
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setForgotPasswordError("");
                    }}
                    className="h-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                  />
                </div>

                {/* Or Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-foreground/[0.1]" />
                  <span className="text-sm font-medium text-foreground/50">Or</span>
                  <div className="flex-1 h-px bg-foreground/[0.1]" />
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="h-12 px-3 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-medium text-foreground/70">+1</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="(XXX) XXX-XXXX"
                      value={formatPhoneDisplay(forgotPasswordPhone)}
                      onChange={(e) => {
                        setForgotPasswordPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setForgotPasswordError("");
                      }}
                      className="h-12 flex-1 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                    />
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {forgotPasswordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{forgotPasswordError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSendOtp}
                  disabled={isSendingReset || (!forgotPasswordEmail.trim() && !forgotPasswordPhone.trim())}
                  className="w-full h-14 text-base font-medium rounded-2xl"
                  size="lg"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "SEND OTP"
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-sm text-foreground/50">Got your password?</span>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                      setForgotPasswordPhone("");
                      setForgotPasswordError("");
                    }}
                    className="text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 login-bg flex overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        {/* Left Panel - Tablet/Desktop only */}
        <div className="hidden md:block relative z-10">
          <PersonalDeviceAuthPanel currentScreen="sign-in" invitedUser={invitedUser} />
        </div>
        
        {/* Right Panel - Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setShowIdentityVerification(false);
                setIdentityBlocked(false);
                setVerificationEmail("");
                setLoginPassword("");
                setIdentityError("");
                setShowVerificationEmailKeyboard(false);
              }}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

          <AnimatePresence mode="wait">
            {identityBlocked ? (
              // Blocked State
              <motion.div
                key="blocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <ShieldX className="w-10 h-10 text-destructive" />
                </div>
                
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  Access Denied
                </h1>
                
                <p className="text-sm text-foreground/50 mb-6 text-center">
                  The email you entered doesn't match the invited user for this device code.
                </p>

                <div className="w-full p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] mb-6">
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Invite issued to</p>
                  <p className="text-sm font-medium text-foreground">{invitedUser.name}</p>
                  <p className="text-sm text-foreground/50">{invitedUser.email}</p>
                </div>

                <div className="w-full space-y-3">
                  <Button
                    onClick={() => {
                      setIdentityBlocked(false);
                      setVerificationEmail("");
                      setLoginPassword("");
                      setIdentityError("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
                  >
                    Try Again
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-foreground/50 mb-2">
                      Not you? Contact your administrator
                    </p>
                    <button
                      onClick={handleRequestAccess}
                      disabled={accessRequested}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      {accessRequested ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Request Sent
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Request New Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Verification Form
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center w-full"
              >
                {/* User Avatar */}
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <User className="w-10 h-10 text-primary/60" />
                </div>

                {/* Invited User Info */}
                <h1 className="text-xl font-semibold text-foreground mb-1">
                  {invitedUser.name}
                </h1>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                    {invitedUser.role}
                  </span>
                </div>

                {/* Login Prompt */}
                <p className="text-sm text-foreground/50 mb-6 text-center">
                  Sign in with your approved credentials
                </p>

                {/* Login Form */}
                <div className="w-full space-y-3">
                  {/* Email Input */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={verificationEmail}
                      onChange={(e) => {
                        setVerificationEmail(e.target.value);
                        setIdentityError("");
                      }}
                      className={`h-14 pl-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                        identityError && identityError.includes("email") ? "border-destructive" : ""
                      }`}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onFocus={() => setShowVerificationEmailKeyboard(false)}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setIdentityError("");
                      }}
                      className={`h-14 pl-12 pr-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                        identityError && identityError.includes("password") ? "border-destructive" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Forgot Password Link - Below Password field */}
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotPasswordEmail(verificationEmail);
                        setForgotPasswordKeyboardField("email");
                        setShowVerificationEmailKeyboard(false);
                      }}
                      className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>


                  {/* Error Message */}
                  <AnimatePresence>
                    {identityError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{identityError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sign In Button */}
                  <Button
                    onClick={handleVerifyIdentity}
                    disabled={isVerifyingIdentity || !verificationEmail.trim() || !loginPassword.trim()}
                    className="w-full h-14 text-base font-medium rounded-2xl"
                    size="lg"
                  >
                    {isVerifyingIdentity ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>

                {/* Policy Indicator */}
                {requiresPolicy2FA && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 mt-6 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <ShieldCheck className="w-4 h-4 text-primary/60" />
                    <span className="text-xs text-foreground/50">2FA required by organization policy</span>
                  </motion.div>
                )}

                {/* Help Text */}
                <p className="text-xs text-foreground/30 mt-6 text-center">
                  Use the same email your administrator invited you with
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>
    );
  }

  // Personal Device - Sign-In Screen (Same UI as New User Activate Device)
  if (deviceType === "personal" && !showClockIn && !showPersonalPinEntry && !personalActivationApproach && activationMethod !== "link") {
    const handleExistingUserSendCode = async () => {
      if (!existingUserContact.trim()) {
        setExistingUserVerificationError("Please enter a valid email or phone number");
        return;
      }
      setExistingUserSendingCode(true);
      setExistingUserVerificationError("");
      const isEmail = existingUserContact.includes("@");
      setExistingUserContactType(isEmail ? "email" : "phone");

      setTimeout(() => {
        setExistingUserCodeSent(true);
        setExistingUserResendCooldown(60);
        setExistingUserSendingCode(false);
        toast({ title: "Verification code sent", description: `Check ${isEmail ? existingUserContact : "your phone"} for your code` });
      }, 800);
    };

    const handleExistingUserVerifyCode = async () => {
      setExistingUserVerifyingCode(true);
      setExistingUserVerificationError("");

      setTimeout(() => {
        setExistingUserVerifyingCode(false);
        // Store device session and navigate to main dashboard with clock-in pinpad
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}`,
          deviceName: "POS Terminal",
          activatedAt: new Date().toISOString(),
          trustedAt: new Date().toISOString(),
        }));
        navigate("/");
      }, 500);
    };

    const existingUserQrValue = `posai://signin/${Date.now().toString(36)}`;

    const activationQrValueExisting = `posai://signin/${Date.now().toString(36)}`;
    const showExistingOtherOptions = existingUserSelectedOption === "code";

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center">
          {/* Logo + Title - Centered */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center flex flex-col items-center"
          >
            <motion.img
              src={eatosLogo}
              alt="POS AI"
              className="w-28 h-auto mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Sign in to your device
            </h1>
            <p className="text-base text-foreground/50 whitespace-nowrap">
              To access this Point of Sale, sign in using one of the options below
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showExistingOtherOptions ? "code-view" : "browser-view"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col md:flex-row gap-0 w-full"
            >
              {/* Left: QR Code (always visible) */}
              <div className="flex-1 pr-0 md:pr-12 pb-8 md:pb-0">
                <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 1</p>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Scan this QR code</h2>
                
                <div className="flex items-start gap-6">
                  <button
                    onClick={() => {
                      localStorage.setItem("pos_device_session", JSON.stringify({
                        deviceId: `device_${Date.now()}`,
                        deviceName: "POS Terminal",
                        activatedAt: new Date().toISOString(),
                        trustedAt: new Date().toISOString(),
                      }));
                      navigate("/");
                    }}
                    className="bg-foreground rounded-2xl p-5 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <QRCodeSVG
                      value={activationQrValueExisting}
                      size={180}
                      bgColor="hsl(0 0% 100%)"
                      fgColor="hsl(0 0% 0%)"
                      level="M"
                    />
                  </button>
                  <p className="text-sm text-foreground/50 leading-relaxed pt-2">
                    {showExistingOtherOptions
                      ? "Scan directly with your phone camera. You will be asked to enter your email, and code to verify."
                      : "On your mobile phone, open the camera or the QR scanner app and point to this code."}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:flex flex-col items-center px-4">
                <div className="w-px flex-1 bg-foreground/10" />
              </div>
              <div className="md:hidden w-full h-px bg-foreground/10 my-6" />

              {/* Right side */}
              <div className="flex-[1.2] pl-0 md:pl-12">
                {!showExistingOtherOptions ? (
                  /* Option 2: Browser pairing */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 2</p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Use a browser</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <span className="text-lg font-bold text-foreground/30 mt-0.5 flex-shrink-0">1</span>
                        <div>
                          <p className="text-sm text-foreground/70 mb-2">Go to this link:</p>
                          <div className="inline-block px-5 py-2.5 rounded-xl bg-foreground/[0.08] border border-foreground/[0.1]">
                            <span className="text-base font-semibold text-foreground tracking-wide">posai.com/pair</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="text-lg font-bold text-foreground/30 mt-0.5 flex-shrink-0">2</span>
                        <div>
                          <p className="text-sm text-foreground/70 mb-3">When asked, enter this code:</p>
                          <div className="flex gap-2">
                            {generatedDeviceCode.split('').map((char, i) => (
                              <div
                                key={i}
                                className="w-12 h-14 rounded-xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center"
                              >
                                <span className="text-xl font-bold text-foreground">{char}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : !existingUserCodeSent ? (
                  /* Sign in with Code - email/phone input */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Option 2</p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Sign in with Code</h2>
                    <p className="text-sm text-foreground/50 mb-6">
                      Enter your email or mobile number to receive a code
                    </p>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Email or phone number"
                          value={existingUserContact}
                          onChange={(e) => {
                            setExistingUserContact(e.target.value);
                            setExistingUserVerificationError("");
                          }}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.08] text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors text-base"
                        />
                      </div>

                      {existingUserVerificationError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20"
                        >
                          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          <p className="text-xs text-destructive">{existingUserVerificationError}</p>
                        </motion.div>
                      )}

                      <button
                        onClick={handleExistingUserSendCode}
                        disabled={!existingUserContact.trim() || existingUserSendingCode}
                        className="w-full h-14 rounded-2xl bg-foreground/[0.08] hover:bg-foreground/[0.12] text-foreground font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                      >
                        {existingUserSendingCode ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Code
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* OTP entry */
                  <>
                    <p className="text-sm font-medium text-foreground/40 mb-1.5 uppercase tracking-wider">Verification</p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Enter Code</h2>
                    <p className="text-sm text-foreground/50 mb-6">
                      Enter the 6-digit code sent to <span className="font-semibold text-foreground">{existingUserContact}</span>
                    </p>
                    <div className="flex gap-2 mb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                            existingUserVerificationCode[i]
                              ? "border-primary bg-primary/5 text-foreground"
                              : i === existingUserVerificationCode.length
                                ? "border-primary/50 bg-foreground/[0.03]"
                                : "border-foreground/10 bg-foreground/[0.03]"
                          }`}
                        >
                          {existingUserVerificationCode[i] || ""}
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={existingUserVerificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setExistingUserVerificationCode(val);
                        setExistingUserVerificationError("");
                        if (val.length === 6) {
                          handleExistingUserVerifyCode();
                        }
                      }}
                      className="sr-only"
                      autoFocus
                    />

                    {existingUserVerificationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 mb-4"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{existingUserVerificationError}</p>
                      </motion.div>
                    )}

                    {existingUserVerifyingCode && (
                      <div className="flex items-center justify-center gap-2 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm text-foreground/60">Verifying...</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => {
                          setExistingUserCodeSent(false);
                          setExistingUserVerificationCode("");
                          setExistingUserVerificationError("");
                        }}
                        className="text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Change contact
                      </button>
                      <button
                        onClick={() => {
                          if (existingUserResendCooldown > 0) return;
                          setExistingUserResendCooldown(60);
                          handleExistingUserSendCode();
                        }}
                        disabled={existingUserResendCooldown > 0 || existingUserSendingCode}
                        className="text-primary hover:text-primary/80 transition-colors disabled:text-foreground/30 disabled:cursor-not-allowed"
                      >
                        {existingUserResendCooldown > 0 ? `Resend in ${existingUserResendCooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer: Need Help (left) + Try another way (right) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 w-full flex items-start justify-between"
          >
            <button
              onClick={() => setShowContactAdmin(true)}
              className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              Need Help?
            </button>

            <button
              onClick={() => {
                if (showExistingOtherOptions) {
                  setExistingUserSelectedOption(null);
                  setExistingUserCodeSent(false);
                  setExistingUserVerificationCode("");
                  setExistingUserVerificationError("");
                  setExistingUserContact("");
                } else {
                  setExistingUserSelectedOption("code");
                }
              }}
              className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {showExistingOtherOptions ? "Back to options" : "Try another way"}
            </button>
          </motion.div>
        </div>

        <ContactAdminDialog 
          open={showContactAdmin} 
          onOpenChange={setShowContactAdmin} 
        />
      </div>
    );
  }

  // Personal Device - Sign in with Link (Magic Link)
  if (deviceType === "personal" && activationMethod === "link") {
    const isEmail = magicLinkInputType === "email";
    const isValidEmail = magicLinkEmail.includes("@") && magicLinkEmail.includes(".");
    const isValidPhone = magicLinkPhone.replace(/\D/g, '').length >= 10;
    const isValid = isEmail ? isValidEmail : isValidPhone;

    const formatPhoneNumber = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    if (magicLinkSent) {
      const maxResends = 3;
      const isResendDisabled = magicLinkResendCooldown > 0 || magicLinkResendCount >= maxResends || isActivating;
      
      const handleResendLink = () => {
        setIsActivating(true);
        setTimeout(() => {
          setIsActivating(false);
          setMagicLinkResendCount(prev => prev + 1);
          const cooldownTime = 30 * (magicLinkResendCount + 1);
          setMagicLinkResendCooldown(cooldownTime);
          toast({
            title: "Link resent",
            description: `A new link has been sent to your ${isEmail ? "email" : "phone"}`
          });
        }, 800);
      };

      return (
        <div className="fixed inset-0 login-bg flex overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-30" />
          <div className="hidden md:block relative z-10">
            <PersonalDeviceAuthPanel currentScreen="link-device" invitedUser={null} />
          </div>
          <div className="relative z-10 flex-1 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col items-center">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkResendCount(0);
                  setMagicLinkResendCooldown(0);
                }}
                className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <h1 className="text-xl font-semibold text-foreground mb-2 text-center">Check your {isEmail ? "inbox" : "messages"}</h1>
              <p className="text-sm text-foreground/50 mb-6 text-center max-w-xs">
                We sent a secure sign-in link to <span className="font-medium text-foreground/70">{isEmail ? magicLinkEmail : magicLinkPhone}</span>
              </p>

              <div className="w-full space-y-3">
                <Button
                  onClick={handleResendLink}
                  disabled={isResendDisabled}
                  variant="outline"
                  className="w-full h-12 rounded-2xl"
                >
                  {isActivating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                  ) : magicLinkResendCooldown > 0 ? (
                    <><Clock className="w-4 h-4 mr-2" />Resend in {magicLinkResendCooldown}s</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Resend Link</>
                  )}
                </Button>
              </div>

              {magicLinkResendCount >= maxResends && (
                <p className="text-xs text-foreground/40 mt-4 text-center">Maximum resend attempts reached. Please contact your admin.</p>
              )}
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 login-bg flex overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="hidden md:block relative z-10">
          <PersonalDeviceAuthPanel currentScreen="link-device" invitedUser={null} />
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col items-center">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setActivationMethod(null);
                setMagicLinkEmail("");
                setMagicLinkPhone("");
                setActivationError("");
              }}
              className="self-start mb-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
              <Mail className="w-8 h-8 text-violet-500" />
            </motion.div>

            <h1 className="text-xl font-semibold text-foreground mb-1 text-center">Sign in with Link</h1>
            <p className="text-sm text-foreground/50 mb-6 text-center">
              Enter your email or phone to receive a secure sign-in link
            </p>

            <div className="w-full space-y-3">
              <div className="flex gap-2">
                {!isEmail && magicLinkPhone.length > 0 && (
                  <div className="flex items-center gap-1 px-3 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.1] shrink-0">
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-sm text-foreground/50">+1</span>
                  </div>
                )}
                <div className="relative flex-1">
                  {isEmail || magicLinkPhone.length === 0 ? (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                  ) : (
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
                  )}
                  <Input
                    type="text"
                    placeholder="your@email.com or phone number"
                    value={isEmail ? magicLinkEmail : formatPhoneNumber(magicLinkPhone)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes("@") || !(/^\d|^\(/.test(val) && val.replace(/\D/g, '').length > 0)) {
                        setMagicLinkInputType("email");
                        setMagicLinkEmail(val);
                      } else {
                        setMagicLinkInputType("phone");
                        setMagicLinkPhone(val.replace(/\D/g, "").slice(0, 10));
                      }
                      setActivationError("");
                    }}
                    className="h-14 pl-12 rounded-2xl border-foreground/[0.1] bg-foreground/[0.03]"
                  />
                </div>
              </div>
              <AnimatePresence>
                {activationError && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive">{activationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={() => {
                  if (!isValid) {
                    setActivationError(isEmail ? "Please enter a valid email address" : "Please enter a valid phone number");
                    return;
                  }
                  setIsActivating(true);
                  setTimeout(() => {
                    setIsActivating(false);
                    setMagicLinkSent(true);
                  }, 1200);
                }}
                disabled={isActivating || !(isEmail ? magicLinkEmail.trim() : magicLinkPhone.trim())}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isActivating ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" />Sending...</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" />Send Sign-in Link</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Personal Device - Code Entry Screen (only show if not in clock-in or PIN entry flow)
  if (deviceType === "personal" && personalActivationApproach === "manual" && !showClockIn && !showPersonalPinEntry) {
    return (
      <div className="fixed inset-0 login-bg flex overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        {/* Left Panel - Tablet/Desktop only */}
        <div className="hidden md:block relative z-10">
          <PersonalDeviceAuthPanel currentScreen="link-device" invitedUser={null} />
        </div>
        
        {/* Right Panel - Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setPersonalActivationApproach(null)}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 rounded-2xl bg-secondary/30 flex items-center justify-center mb-6 border border-foreground/[0.06]"
          >
            <KeyRound className="w-10 h-10 text-foreground/40" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-foreground mb-2"
          >
            Link Your Device
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-foreground/50 mb-2 text-center"
          >
            {showQRScanner ? "Point your camera at the QR code" : "Enter the code from your manager's invite"}
          </motion.p>
          
          {!showQRScanner && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              className="text-xs text-foreground/30 mb-6 text-center"
            >
              Check your email or scan the QR from the admin portal
            </motion.p>
          )}

          {/* Code Input / QR Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-4"
          >
            <AnimatePresence mode="wait">
              {showQRScanner ? (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full"
                >
                  <div 
                    id="qr-reader" 
                    ref={scannerContainerRef}
                    className="w-full aspect-square rounded-2xl overflow-hidden bg-black/50 border border-foreground/[0.1]"
                  />
                  {scannerError && (
                    <div className="flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-xl bg-destructive/10">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{scannerError}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={stopQRScanner}
                    className="w-full h-12 mt-4 rounded-2xl"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Enter code manually
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={deviceCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDeviceCode(val);
                        setCodeError("");
                        setShowRequestAccess(false);
                      }}
                      className={`h-14 text-center text-2xl font-mono tracking-[0.5em] rounded-2xl border-foreground/[0.1] bg-foreground/[0.03] ${
                        codeError ? "border-destructive" : ""
                      }`}
                      maxLength={6}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={startQRScanner}
                    className="w-full h-12 rounded-2xl"
                  >
                    <ScanLine className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>

                  <button
                    onClick={() => setActivationMethod("link")}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
                      <Mail className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground mb-0.5">
                        Sign in with Link
                      </p>
                      <p className="text-xs text-foreground/50">
                        Get a secure link sent to your email
                      </p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error State */}
            <AnimatePresence mode="wait">
              {codeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{codeError}</span>
                  </div>
                  
                  {showRequestAccess && !accessRequested && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <p className="text-sm text-foreground/50 mb-3">
                        Contact your administrator for a valid code
                      </p>
                      <button
                        onClick={handleRequestAccess}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Request Access
                      </button>
                    </motion.div>
                  )}

                  {accessRequested && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-sm text-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Access request sent</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button - only show when not scanning */}
            {!showQRScanner && (
              <Button
                onClick={handleVerifyDeviceCode}
                disabled={isVerifyingCode || !deviceCode.trim()}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Link Device"
                )}
              </Button>
            )}
          </motion.div>

          {/* Don't have a code section - always visible */}
          {!showQRScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 pt-6 border-t border-foreground/[0.06] w-full"
            >
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-foreground/40">
                  <TooltipProvider>
                    <Tooltip 
                      open={helpTooltipOpen} 
                      onOpenChange={(open) => {
                        setHelpTooltipOpen(open);
                        if (open) setHelpTooltipInteracted(true);
                      }}
                    >
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="inline-flex items-center justify-center hover:text-foreground/60 transition-colors"
                          onClick={() => {
                            setHelpTooltipInteracted(true);
                            setHelpTooltipOpen(!helpTooltipOpen);
                          }}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-center">
                        <p className="text-xs leading-relaxed">
                          Your manager sends device codes via email when adding you to the system. If you haven't received one, request access below.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm font-medium">Don't have a code?</span>
                </div>
                <button
                  onClick={() => setShowContactAdmin(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/[0.08] text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/[0.06] transition-all"
                >
                  <Send className="w-4 h-4" />
                  Request Access
                </button>
              </div>
            </motion.div>
          )}
          </motion.div>

          <ContactAdminDialog 
            open={showContactAdmin} 
            onOpenChange={setShowContactAdmin} 
          />
        </div>
      </div>
    );
  }

  // Verifying Screen
  if (isVerifying) {
    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <Loader2 className="w-10 h-10 text-foreground/40 animate-spin mb-4" />
          <p className="text-sm text-foreground/50">Verifying identity…</p>
        </motion.div>
      </div>
    );
  }

  // Success Screen
  if (showSuccess && clockInTime) {
    const formattedTime = clockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium text-foreground mb-1"
          >
            Clock-in confirmed
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-foreground/50"
          >
            at {formattedTime}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Clock-In Confirmation Screen (for both company and personal device flows)
  const clockInEmployee = selectedEmployee || (invitedUser ? { 
    id: "personal-1", 
    name: invitedUser.name, 
    role: invitedUser.role,
    roleIcon: "server",
    avatar: ""
  } : null);
  
  if (showClockIn && clockInEmployee && clockInTime) {
    const formattedTime = clockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const formattedDate = clockInTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center"
        >
          {/* Employee Avatar & Name */}
          <div className="w-20 h-20 rounded-full bg-foreground/[0.08] flex items-center justify-center mb-4 border border-foreground/[0.06]">
            <User className="w-10 h-10 text-foreground/40" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">{clockInEmployee.name}</h1>
          <p className="text-sm text-foreground/50 mb-8">Confirm your shift details</p>

          {/* Clock-In Details */}
          <div className="w-full space-y-3 mb-8">
            {/* Role */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Role</p>
                <p className="text-[15px] font-medium text-foreground">{clockInEmployee.role}</p>
              </div>
            </div>

            {/* Revenue Center */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Revenue Center</p>
                <p className="text-[15px] font-medium text-foreground">{selectedEmployee ? revenueCenters[selectedEmployee.id] : "Main Dining"}</p>
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Start Time</p>
                <p className="text-[15px] font-medium text-foreground">{formattedTime}</p>
                <p className="text-xs text-foreground/40">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirmClockIn}
            className="w-full h-14 text-base font-medium rounded-2xl"
            size="lg"
          >
            Confirm Clock In
          </Button>

          {/* Back link */}
          <button
            onClick={handleBackToDeviceSelection}
            className="mt-4 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Not you? Go back
          </button>
        </motion.div>
      </div>
    );
  }


  // Mock device/location info for context panel
  const deviceInfo = {
    restaurantName: "The Rustic Table",
    location: "Downtown - Main Street",
    deviceName: "POS Terminal 01",
    temperature: 72, // Mock temperature in Fahrenheit
  };

  const formattedDateDisplay = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const formattedTimeDisplay = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Get time of day info for icon display
  const timeOfDayInfo = getTimeOfDayInfo(currentTime);
  const TimeOfDayIcon = timeOfDayInfo.icon;

  // Company Device - Direct PIN Entry Screen (no employee selection)
  return (
    <>
    <div className="fixed inset-0 login-bg flex overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      {/* Mobile Layout (single column) */}
      <div className="relative z-10 w-full flex flex-col md:hidden h-full items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm flex flex-col items-center"
        >
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBackToDeviceSelection}
            className="absolute top-8 left-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </motion.button>

          {/* Logo & Title */}
          <motion.img
            src={eatosLogo}
            alt="POS AI"
            className="w-20 h-auto mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-foreground mb-2"
          >
            Enter Your PIN
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-foreground/50 mb-8 text-center"
          >
            Your PIN identifies you and starts your shift
          </motion.p>

          {/* PIN Dots */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 mb-4"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <motion.div
                key={i}
                animate={pinError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  pinError
                    ? "bg-destructive"
                    : i < pin.length 
                      ? "bg-primary scale-110" 
                      : "bg-foreground/[0.12] border border-foreground/[0.08]"
                }`}
              />
            ))}
          </motion.div>

          {/* Error/Hint Message */}
          <div className="h-8 flex items-center justify-center mb-4">
            <AnimatePresence mode="wait">
              {pinError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-sm font-medium text-destructive">{pinError}</span>
                </motion.div>
              ) : isVerifying ? (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground/50">Verifying...</span>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-foreground/40"
                >
                  Enter 4-digit PIN
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Keypad Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3 w-full max-w-[280px]"
          >
            {/* Numeric Keypad 1-9 */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberPress(num.toString())}
                  disabled={isVerifying}
                  className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Last row: 0 and Delete - 2 column layout */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleNumberPress("0")}
                disabled={isVerifying}
                className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={isVerifying}
                className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Biometric Options - 2 column layout */}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
              >
                <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
              </button>
              
              <button
                className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
              >
                <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
              </button>
            </div>
          </motion.div>

          {/* Security Notice & Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center space-y-2"
          >
            <p className="text-xs text-foreground/30">
              Forgot PIN? Contact your manager
            </p>
            <button
              onClick={() => setShowContactAdmin(true)}
              className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors underline"
            >
              Need help?
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Tablet/Web Layout (two columns) */}
      <div className="relative z-10 hidden md:flex w-full h-full">
        {/* Left Panel - Context Information (25-30% width) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[28%] min-w-[280px] max-w-[360px] h-full flex flex-col bg-foreground/[0.02] border-r border-foreground/[0.06]"
        >
          <div className="flex-1 flex flex-col justify-center px-8 py-10">
            {/* Logo */}
            <motion.img
              src={eatosLogo}
              alt="POS AI"
              className="w-20 h-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />

            {/* Context Info Cards */}
            <div className="space-y-4">
              {/* Restaurant Logo */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-16 h-16 rounded-2xl overflow-hidden"
              >
                <img 
                  src={restaurantLogo} 
                  alt="The Rustic Table" 
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Restaurant Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Restaurant</p>
                <p className="text-base font-medium text-foreground">{deviceInfo.restaurantName}</p>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-1"
              >
                <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-foreground/40" />
                  <p className="text-base text-foreground/80">{deviceInfo.location}</p>
                </div>
              </motion.div>

              {/* Device Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Device</p>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-foreground/40" />
                  <p className="text-base text-foreground/80">{deviceInfo.deviceName}</p>
                </div>
              </motion.div>

              {/* Date & Time */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-1"
              >
                <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Date & Time</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground/40" />
                  <p className="text-base text-foreground/80">{formattedTimeDisplay} | {formattedDateDisplay}</p>
                </div>
                {/* Weather info inline below */}
                <div className="flex items-center gap-2 pt-2">
                  <TimeOfDayIcon className={`w-4 h-4 ${timeOfDayInfo.iconClass}`} strokeWidth={1.5} />
                  <p className="text-sm text-foreground/50">{deviceInfo.temperature}°F · {timeOfDayInfo.label}</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Version info at bottom */}
          <div className="px-8 pb-6">
            <p className="text-xs text-foreground/20">eatOS POSAI 6 v2.4.1</p>
          </div>
        </motion.div>

        {/* Right Panel - PIN Entry (70-75% width) */}
        <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBackToDeviceSelection}
              className="absolute top-8 left-8 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              style={{ left: 'calc(28% + 2rem)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-semibold text-foreground mb-2"
            >
              Enter Your PIN
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-foreground/50 mb-10 text-center"
            >
              Your PIN identifies you and starts your shift
            </motion.p>

            {/* PIN Dots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-5 mb-4"
            >
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={pinError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-5 h-5 rounded-full transition-all duration-200 ${
                    pinError
                      ? "bg-destructive"
                      : i < pin.length 
                        ? "bg-primary scale-110" 
                        : "bg-foreground/[0.12] border border-foreground/[0.08]"
                  }`}
                />
              ))}
            </motion.div>

            {/* Error/Hint Message */}
            <div className="h-8 flex items-center justify-center mb-6">
              <AnimatePresence mode="wait">
                {pinError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    <span className="text-sm font-medium text-destructive">{pinError}</span>
                  </motion.div>
                ) : isVerifying ? (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground/50">Verifying...</span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-foreground/40"
                  >
                    Enter 4-digit PIN
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Keypad Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-3 w-full max-w-[300px]"
            >
              {/* Numeric Keypad 1-9 */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberPress(num.toString())}
                    disabled={isVerifying}
                    className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Last row: 0 and Delete - 2 column layout */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNumberPress("0")}
                  disabled={isVerifying}
                  className="h-[76px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isVerifying}
                  className="h-[76px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>

              {/* Biometric Options - 2 column layout */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-14 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
                >
                  <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
                </button>
                
                <button
                  className="h-14 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
                >
                  <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
                </button>
              </div>
            </motion.div>

            {/* Security Notice & Help */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-center space-y-2"
            >
              <p className="text-xs text-foreground/30">
                Forgot PIN? Contact your manager
              </p>
              <button
                onClick={() => setShowContactAdmin(true)}
                className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors underline"
              >
                Need help?
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>

      <ContactAdminDialog 
        open={showContactAdmin} 
        onOpenChange={setShowContactAdmin} 
      />
    </>
  );
};

export default Login;