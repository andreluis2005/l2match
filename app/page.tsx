"use client";

import { useEffect, useState } from "react";
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
  useClose,
  usePrimaryButton,
} from "@coinbase/onchainkit/minikit";
import { Redis } from "@upstash/redis";
import { useAccount, useWriteContract, useConnect } from "wagmi";
import Head from "next/head";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export default function QuizPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const close = useClose();
  const { connect, connectors } = useConnect();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState({ Arbitrum: 0, Optimism: 0, Base: 0, zkSync: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showXmtpPrompt, setShowXmtpPrompt] = useState(false);
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [destinationAddress, setDestinationAddress] = useState(""); // Novo estado para o endereço de destino

  const { address } = useAccount();
  const { writeContract, isPending: isLoading } = useWriteContract();

  const handleSaveResult = async () => {
    setErrorMessage(null);
    try {
      if (!result) {
        throw new Error("Result is not available to save.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Connect to MetaMask and try again.");
      }
      await writeContract({
        address: "0xb1efcfedf8ecf8dd971b7f9d9212059f0b088f68",
        abi: [
          {
            inputs: [{ name: "l2Result", type: "string" }],
            name: "saveResult",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            anonymous: false,
            inputs: [
              { indexed: true, name: "user", type: "address" },
              { indexed: false, name: "l2Result", type: "string" },
            ],
            name: "ResultSaved",
            type: "event",
          },
        ],
        functionName: "saveResult",
        args: [result],
      });
      setShowXmtpPrompt(true); // Exibe o prompt XMTP após salvar
    } catch (err) {
      console.error("Erro ao salvar resultado:", err);
      if (err instanceof Error && err.message.includes("User rejected the request")) {
        setErrorMessage("Transaction was cancelled. Please try again.");
      } else if (err instanceof Error) {
        setErrorMessage(`Erro ao salvar resultado: ${err.message}`);
      } else {
        setErrorMessage("An unexpected error occurred while saving the result.");
      }
    }
  };

  const handleSendViaXmtp = async () => {
    setErrorMessage(null);
    if (!ethers.isAddress(destinationAddress)) {
      setErrorMessage("Please enter a valid Ethereum address.");
      return;
    }
    try {
      if (!xmtpClient && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const client = await Client.create(signer, { env: "production" });
        setXmtpClient(client);
        console.log("XMTP inicializado com sucesso");
      }

      if (xmtpClient && address && destinationAddress !== address) {
        const conversation = await xmtpClient.conversations.newConversation(destinationAddress);
        await conversation.send(`Result saved onchain: ${result}`);
        setErrorMessage("Result sent via XMTP successfully!");
        setDestinationAddress(""); // Limpa o campo após envio
        setShowXmtpPrompt(false); // Fecha o prompt
      } else if (destinationAddress === address) {
        setErrorMessage("Cannot send to your own address. Please enter a different address.");
      }
    } catch (err) {
      console.error("Erro ao enviar via XMTP:", err);
      if (err instanceof Error) {
        setErrorMessage(`Erro ao enviar via XMTP: ${err.message}`);
      } else {
        setErrorMessage("An unexpected error occurred while sending via XMTP.");
      }
    }
  };

  const questions = [
    {
      question: "What’s your main criterion when choosing a network?",
      options: ["Low fees and speed", "Advanced technical performance", "Social mission and community"],
      scores: { Base: 1, Arbitrum: 1, Optimism: 1 },
    },
    {
      question: "How do you prefer to test new dApps?",
      options: ["If there’s an airdrop, I’ll test it!", "Only if it’s stable and audited", "I support if it’s decentralized"],
      scores: { Base: 1, Arbitrum: 1, Optimism: 1 },
    },
    {
      question: "What’s your online lifestyle?",
      options: ["Practical and to the point", "Analytical, I love technical details", "Engaged in communities"],
      scores: { Base: 1, Arbitrum: 1, Optimism: 1 },
    },
    {
      question: "What would you do with a $10k crypto grant?",
      options: ["Build a simple and useful dApp", "Invest in technical innovation", "Fund a social project"],
      scores: { Base: 1, Arbitrum: 1, Optimism: 1 },
    },
    {
      question: "What’s your priority in a network?",
      options: ["Speed and low cost", "Developer tools", "Inclusion and social impact"],
      scores: { Base: 1, Arbitrum: 1, Optimism: 1 },
    },
  ];

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
      console.log("Minikit frame set as ready");
    } else {
      console.log("Minikit frame already ready");
    }
    const fetchThemeAndScore = async () => {
      try {
        const savedTheme = await redis.get("theme:anonymous");
        if (savedTheme === "true") setIsDarkMode(true);

        const savedResult = await redis.get("score:anonymous");
        if (savedResult) setResult(savedResult as string);
      } catch (error) {
        console.error("Error fetching theme or score:", error);
      }
    };
    fetchThemeAndScore();
  }, [isFrameReady, setFrameReady]);

  const handleAnswer = async (answer: string, index: number) => {
    const question = questions[index];
    const newScore = { ...score };
    if (answer === question.options[0]) newScore.Base += question.scores.Base || 1;
    if (answer === question.options[1]) newScore.Arbitrum += question.scores.Arbitrum || 1;
    if (answer === question.options[2]) newScore.Optimism += question.scores.Optimism || 1;
    setScore(newScore);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
      const maxScore = Math.max(newScore.Arbitrum, newScore.Optimism, newScore.Base, newScore.zkSync);
      const topL2s = Object.entries(newScore).filter(([, value]) => value === maxScore);
      const newResult = topL2s
        .map(([l2]) =>
          l2 === "Arbitrum"
            ? "Arbitrum: Technical Explorer!"
            : l2 === "Optimism"
            ? "Optimism: Social Idealist!"
            : l2 === "Base"
            ? "Base: Practical Innovator!"
            : "zkSync: Crypto Pioneer!"
        )
        .join(" & ");
      setResult(newResult);
      try {
        await redis.set("score:anonymous", newResult);
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore({ Arbitrum: 0, Optimism: 0, Base: 0, zkSync: 0 });
    setQuizFinished(false);
    setResult(null);
    setErrorMessage(null);
  };

  const handleAddFrame = async () => {
    try {
      const result = await addFrame();
      if (result) {
        console.log("Frame added successfully:", result.url, result.token);
        alert("App saved successfully!");
      } else {
        console.log("Failed to add frame: No result returned");
        alert("Failed to save app. Please try again.");
      }
    } catch (error) {
      console.error("Error adding frame:", error);
      if (error instanceof Error) {
        alert("Error saving app: " + error.message);
      } else {
        alert("Error saving app: An unknown error occurred");
      }
    }
  };

  const handleClose = () => {
    try {
      close();
      console.log("Close action triggered");
    } catch (error) {
      console.error("Error closing app:", error);
      if (error instanceof Error) {
        alert("Error closing app: " + error.message);
      } else {
        alert("Error closing app: An unknown error occurred");
      }
    }
  };

  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    try {
      await redis.set("theme:anonymous", newDarkMode.toString());
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const shareOnWarpcast = () => {
    if (result) {
      const l2Name = result.split(" & ")[0].split(":")[0].toLowerCase();
      const scoreGraphLink = `https://l2match.vercel.app/result?score=${l2Name}`;
      const shareText = encodeURIComponent(
        `${l2Name.charAt(0).toUpperCase() + l2Name.slice(1)} is my L2 soulmate! 🎉 Check out my score graph: ${scoreGraphLink}. Take the quiz and find yours! 🚀 https://l2match.vercel.app`
      );
      openUrl(`https://warpcast.com/~/compose?text=${shareText}`);
    } else {
      console.error("Resultado do quiz não disponível para compartilhamento!");
    }
  };

  usePrimaryButton(
    { text: quizFinished ? "Restart Quiz" : "Next Question" },
    () => {
      if (quizFinished) resetQuiz();
    }
  );

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const maxPossibleScore = questions.length;
  const scorePercentages = {
    Arbitrum: (score.Arbitrum / maxPossibleScore) * 100,
    Optimism: (score.Optimism / maxPossibleScore) * 100,
    Base: (score.Base / maxPossibleScore) * 100,
    zkSync: (score.zkSync / maxPossibleScore) * 100,
  };
  const l2Colors = {
    Arbitrum: "bg-blue-500",
    Optimism: "bg-red-500",
    Base: "bg-green-500",
    zkSync: "bg-purple-500",
  };

  return (
    <>
      <Head>
        {/* Meta tags Open Graph */}
        <meta property="og:title" content="Which L2 Are You?" />
        <meta
          property="og:description"
          content="Take this fun quiz to find out which Layer 2 blockchain matches your personality!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://l2match.vercel.app" />
        <meta property="og:image" content="https://l2match.vercel.app/logo.png" />

        {/* Meta tags Farcaster Frame */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="https://l2match.vercel.app/logo.png" />
        <meta name="fc:frame:button:1" content="Start Quiz" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content="https://l2match.vercel.app" />

        {/* Link para o Web Manifest */}
        <link rel="manifest" href="/.well-known/farcaster.json" />
      </Head>

      {(!address && connectors.length > 0) && (
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${
            isDarkMode
              ? "bg-purple-500 text-gray-100 hover:bg-purple-400"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          } transition-all duration-200 shadow-md mb-4`}
          onClick={() => connect({ connector: connectors[0] })}
        >
          Connect Wallet
        </button>
      )}

      <div
        className={`min-h-screen flex flex-col items-center justify-between p-6 ${
          isDarkMode
            ? "bg-gray-950 text-gray-100"
            : "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-800"
        }`}
      >
        <header className="w-full max-w-[520px] flex justify-between items-center py-4">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-purple-400 drop-shadow-md" : "text-indigo-800 drop-shadow-md"
            }`}
          >
            Which L2 Are You?
          </h1>
          <div className="flex space-x-3">
            <button
              className={`bg-${isDarkMode ? "purple-500" : "indigo-600"} text-white px-4 py-2 rounded-lg shadow-md hover:bg-${
                isDarkMode ? "purple-400" : "indigo-700"
              } hover:shadow-lg transition-all duration-200`}
              onClick={handleAddFrame}
            >
              Save App
            </button>
            <button
              className={`bg-transparent ${
                isDarkMode ? "text-purple-400" : "text-indigo-800"
              } font-semibold text-sm hover:underline`}
              onClick={handleClose}
            >
              Close
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isDarkMode
                  ? "bg-gray-800 text-purple-400 hover:bg-gray-700"
                  : "bg-white text-indigo-600 border border-indigo-300 hover:bg-gray-100"
              }`}
              onClick={toggleTheme}
            >
              {isDarkMode ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[520px]">
          <div
            className={`w-full ${isDarkMode ? "bg-gray-800" : "bg-gray-200"} rounded-full h-2.5 mb-4`}
          >
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isDarkMode ? "bg-purple-500" : "bg-indigo-600"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {quizFinished ? (
            <div
              className={`text-center ${isDarkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-lg`}
            >
              <h2
                className={`text-3xl font-bold ${
                  isDarkMode ? "text-purple-400" : "text-indigo-800"
                } mb-4`}
              >
                Your L2 Soulmate!
              </h2>
              <p
                className={`text-xl ${isDarkMode ? "text-gray-100" : "text-gray-700"} mb-4`}
              >
                {result || "Error loading result"}
              </p>
              <div className="mb-6">
                <h3
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-purple-400" : "text-indigo-800"
                  } mb-2`}
                >
                  Score Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(scorePercentages).map(([l2, percentage]) => (
                    <div key={l2} className="flex items-center">
                      <span
                        className={`w-24 text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {l2}
                      </span>
                      <div
                        className={`flex-1 h-4 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full ${
                            l2Colors[l2 as keyof typeof l2Colors]
                          } rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span
                        className={`ml-3 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {score[l2 as keyof typeof score]}/{maxPossibleScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    isDarkMode
                      ? "bg-purple-500 text-gray-100 hover:bg-purple-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } transition-all duration-200 shadow-md mb-2`}
                  onClick={shareOnWarpcast}
                >
                  Share on Warpcast
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    isDarkMode
                      ? "bg-purple-500 text-gray-100 hover:bg-purple-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } transition-all duration-200 shadow-md mb-2`}
                  onClick={resetQuiz}
                >
                  Test again?
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    isDarkMode
                      ? "bg-purple-500 text-gray-100 hover:bg-purple-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } transition-all duration-200 shadow-md`}
                  onClick={handleSaveResult}
                  disabled={isLoading || !address}
                >
                  {isLoading ? "Saving..." : "Save Result Onchain"}
                </button>
                {showXmtpPrompt && (
                  <div className="mt-4">
                    <p
                      className={`text-center ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Would you like to send the result via XMTP to another wallet?
                    </p>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder="Enter destination wallet address"
                      className={`mt-2 p-2 rounded-lg w-full max-w-xs ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-100 border-gray-600"
                          : "bg-white text-gray-800 border-gray-300"
                      }`}
                    />
                    <div className="flex justify-center mt-2 space-x-4">
                      <button
                        className={`px-3 py-1 rounded-lg font-semibold ${
                          isDarkMode
                            ? "bg-purple-500 text-gray-100 hover:bg-purple-400"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        } transition-all duration-200 shadow-md`}
                        onClick={handleSendViaXmtp}
                        disabled={isLoading || !destinationAddress}
                      >
                        Send
                      </button>
                      <button
                        className={`px-3 py-1 rounded-lg font-semibold ${
                          isDarkMode
                            ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
                            : "bg-gray-400 text-white hover:bg-gray-500"
                        } transition-all duration-200 shadow-md`}
                        onClick={() => {
                          setShowXmtpPrompt(false);
                          setDestinationAddress("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {(!address || errorMessage) && (
                  <p style={{ color: "red" }}>
                    {errorMessage || "Wallet not connected. Connect to MetaMask."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-lg`}
            >
              <h2
                className={`text-2xl font-semibold ${
                  isDarkMode ? "text-purple-400" : "text-indigo-800"
                } mb-6`}
              >
                {questions[currentQuestion].question}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {questions[currentQuestion].options.map((option) => (
                  <button
                    key={option}
                    className={`bg-${isDarkMode ? "gray-800" : "white"} border-2 ${
                      isDarkMode ? "border-purple-500" : "border-indigo-300"
                    } rounded-lg p-4 text-center ${
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    } font-medium hover:bg-${
                      isDarkMode ? "gray-700" : "indigo-100"
                    } hover:border-${isDarkMode ? "purple-400" : "indigo-400"} transition-all duration-200 transform hover:scale-105 shadow-sm`}
                    onClick={() => handleAnswer(option, currentQuestion)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="w-full max-w-[520px] flex justify-center py-4">
          <button
            className={`px-4 py-2 rounded-full font-semibold ${
              isDarkMode
                ? "text-gray-400 bg-gray-800 border-gray-600 hover:bg-gray-700"
                : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"
            } text-sm transition-all duration-200 shadow-sm`}
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            BUILT WITH MINIKIT
          </button>
        </footer>
      </div>
    </>
  );
}