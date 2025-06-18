"use client";
import { useState, useEffect, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { assets } from "../../../../public/assets/assets"; // Import assets (QR code image)
import "./scanner.css";
import { StoreContext } from "@/app/Context/AccountContext";

export default function ScannerPage() {
  const [rechargeData, setRechargeData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const upiId = "Rahul7873@upi"; // Sample UPI ID
  const router = useRouter();

  const { loggedinUser } = useContext(StoreContext);
  // Get query parameters
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");
  const paymentMethod = searchParams.get("paymentMethod");
  const userBalance = searchParams.get("userBalance");

  // Update state with query parameters
  useEffect(() => {
    if (amount && paymentMethod && userBalance) {
      setRechargeData({
        amount,
        paymentMethod,
        userBalance,
      });
    } else {
      console.error("Missing query parameters.");
    }
  }, [amount, paymentMethod, userBalance]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      router.push("/MyProfile"); // Redirect when timer reaches zero
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [timeLeft, router]);

  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(upiId)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy UPI ID:", err);
        });
    }
  };

  const handleUtrSubmit = async () => {
    if (!utrNumber) {
      alert("Please enter the UTR number before submitting.");
      return;
    }

    if (!rechargeData) {
      alert("Recharge data is missing. Please try again.");
      return;
    }

    const userId = loggedinUser.userId; // Replace with actual userId (e.g., from context or state)

    const dataToSubmit = {
      userId,
      amount: rechargeData.amount,
      utrNumber,
    };

    try {
      const response = await fetch("/api/recharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (response.ok) {
        setUtrSubmitted(true);
        alert("Transaction successfully submitted!");
        router.push("/MyProfile"); // Redirect after UTR submission
      } else {
        console.error("Error submitting UTR:", result.message);
        alert("There was an issue with the transaction submission.");
      }
    } catch (error) {
      console.error("Error during UTR submission:", error);
      alert("There was an error submitting the transaction.");
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="scanner-container">
      <header className="scanner__header">
        <h1>Payment Scanner</h1>
      </header>

      <section className="scanner__details">
        <div className="timer-section">
          <h3>Time Remaining</h3>
          <p className="timer">{formatTime(timeLeft)}</p>
        </div>
        <h2>Recharge Details</h2>
        {rechargeData ? (
          <ul className="details__list">
            <li>
              <strong>Amount:</strong> ₹{rechargeData.amount}
            </li>
            <li>
              <strong>Payment Method:</strong> {rechargeData.paymentMethod}
            </li>
            <li>
              <strong>User Balance:</strong> ₹{rechargeData.userBalance}
            </li>
          </ul>
        ) : (
          <p>Loading recharge data...</p>
        )}

        <h3>Scan the QR code to complete payment</h3>
        <div className="scanner__qr-code">
          <img
            src={assets.Scanner}
            alt="QR Code for Payment"
            className="qr-code-image"
          />
        </div>

        <h3>UPI ID</h3>
        <div className="upi-id-section">
          <p className="upi-id">{upiId}</p>
          <button onClick={copyToClipboard} className="copy-btn">
            {copySuccess ? "Copied!" : "Copy UPI ID"}
          </button>
        </div>

        <div className="utr-section">
          <h3>Enter UTR/Transaction Number</h3>
          <input
            type="text"
            placeholder="Enter your UTR number"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            className="utr-input"
          />
          <button onClick={handleUtrSubmit} className="submit-btn">
            Submit
          </button>
          {utrSubmitted && (
            <p className="success-message">UTR Submitted Successfully!</p>
          )}
        </div>
      </section>
    </div>
  );
}
