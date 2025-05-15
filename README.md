# 🧠 L2Match – Which Ethereum Layer 2 Are You?

Discover which Ethereum Layer 2 best matches your personality in this onchain Buzzfeed-style quiz! Built using the [Base Minikit](https://github.com/base-org/minikit), L2Match lets users answer a few fun questions and permanently store their result onchain via the Base network.

![L2Match Screenshot](./screenshot1.png)

---

## 🚀 Live Demo

🔗 [https://l2match.vercel.app](https://l2match.vercel.app)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Base Integration:** Base Minikit
- **Blockchain:** Base Sepolia / Base Mainnet
- **Storage:** Redis (for quiz/session data)
- **UI:** TailwindCSS + Shadcn/ui
- **Deployment:** Vercel

---

## 🧩 Features

- ✅ Fun Layer 2 personality quiz
- ✅ Result saved onchain (Base)
- ✅ Seamless social login via Farcaster
- ✅ Clean, mobile-first responsive UI
- ✅ Fully open source

---

## 📸 Screenshots

| Quiz View | Result View |
|-----------|-------------|
| ![s1](./screenshot1bkp.png) | ![s2](./screenshot2bk.png) |

---

## 🌐 About the Project

L2Match was created for the **Base Batches Global Buildathon**, with the goal of making Ethereum L2 onboarding more fun and personal. By combining the viral nature of personality quizzes with the power of onchain storage and social web3 identity (Farcaster), L2Match aims to educate and entertain.

---

## 📝 How It Works

1. User answers 5 fun questions
2. App calculates the best matching Layer 2
3. Result is saved onchain via Base
4. User can share result with friends

---

## 📦 Getting Started (Dev)

```bash
# Clone the repo
git clone https://github.com/yourusername/l2match.git
cd l2match

# Install dependencies
npm install

# Setup your environment variables
cp .env.example .env.local
# (Fill in the required keys for Redis, Wallet, Base config, etc.)

# Run locally
npm run dev
