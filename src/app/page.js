"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiRefreshCw, FiCheckCircle, FiClock, FiX } from "react-icons/fi";

axios.defaults.withCredentials = true;

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const ModalWrapper = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="relative bg-gray-800/90 rounded-2xl p-8 shadow-2xl max-w-md w-full"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
      >
        <FiX className="w-6 h-6" />
      </button>
      {children}
    </motion.div>
  </motion.div>
);

export default function Home() {
  const [status, setStatus] = useState({ canClaim: true, timeLeft: 0 });
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdownModalClosed, setCountdownModalClosed] = useState(false);
  const timeoutRef = useRef(null);

  const checkStatus = async () => {
    try {
      const { data } = await axios.get(
        "https://coupon-system-backend-aepb.onrender.com/status"
      );
      setStatus(data);
      if (!data.canClaim && countdownModalClosed) {
        setCountdownModalClosed(false);
      }
    } catch (err) {
      setError("Failed to check status");
    }
  };

  const claimCoupon = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(
        "https://coupon-system-backend-aepb.onrender.com/claim-coupon"
      );
      setCoupon(data.coupon);
      checkStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim coupon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!status.canClaim && !coupon && !countdownModalClosed) {
      timeoutRef.current = setTimeout(() => {
        setCountdownModalClosed(true);
      }, 5000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [status.canClaim, coupon, countdownModalClosed]);

  const handleCloseCountdown = () => {
    setCountdownModalClosed(true);
    clearTimeout(timeoutRef.current);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      />

      {/* Main Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Coupon Hub
          </h1>
          <p className="text-gray-400 text-xl">Exclusive Discount Platform</p>
        </motion.div>

        <div className="w-full max-w-2xl">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            {!status.canClaim ? (
              <div className="flex flex-col items-center space-y-4">
                <FiClock className="w-12 h-12 text-blue-400 animate-pulse" />
                <p className="text-gray-300 text-xl">
                  Next coupon available in:
                </p>
                <p className="text-4xl font-bold text-white">
                  {formatTime(status.timeLeft)}
                </p>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={claimCoupon}
                disabled={loading || !status.canClaim}
                className={`w-full text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  loading || !status.canClaim
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-300 hover:to-blue-400"
                }`}
              >
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  {loading ? (
                    <FiRefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <span className="text-2xl">
                        {status.canClaim
                          ? "Claim Your Coupon"
                          : "Coupon Claimed"}
                      </span>
                      <FiRefreshCw className="w-6 h-6" />
                    </>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  className="absolute inset-0 bg-white/10"
                />
              </motion.button>
            )}
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 text-center text-gray-400 text-sm space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>Round-robin distribution system</p>
          <p>1 claim per hour per device/IP</p>
        </motion.div>
      </div>

      {coupon && (
        <ModalWrapper onClose={() => setCoupon(null)}>
          <div className="text-center space-y-6">
            <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto animate-pulse" />
            <div className="space-y-4">
              <p className="text-4xl text-white font-mono font-bold tracking-wider">
                {coupon}
              </p>
              <p className="text-green-400 text-xl">Coupon Activated!</p>
            </div>
          </div>
        </ModalWrapper>
      )}

      {!status.canClaim && !coupon && !countdownModalClosed && (
        <ModalWrapper onClose={handleCloseCountdown}>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: "linear",
                }}
                className="relative text-blue-400"
              >
                <FiClock className="w-16 h-16" />
              </motion.div>
            </div>
            <div className="text-4xl font-bold text-white">
              {formatTime(status.timeLeft)}
            </div>
            <p className="text-blue-400 text-xl">Next coupon available in</p>
          </div>
        </ModalWrapper>
      )}

      {error && (
        <ModalWrapper onClose={() => setError("")}>
          <div className="text-center space-y-6">
            <div className="bg-red-500/20 p-6 rounded-xl">
              <FiClock className="w-16 h-16 text-red-400 mx-auto" />
            </div>
            <p className="text-red-400 text-xl">{error}</p>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
