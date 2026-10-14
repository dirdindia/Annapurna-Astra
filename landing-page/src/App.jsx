// App.jsx – saari routing yahin hai. Naya page add karna ho to 1 Route add karo.
import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import Register from './pages/Register'
import SignIn from './pages/SignIn'

// Page change par upar scroll + halka fade animation
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.main>
  )
}

export default function App() {
  const location = useLocation()
  // Register / SignIn par navbar-footer nahi dikhana (focus rahe)
  const isAuth = ['/register', '/signin'].includes(location.pathname)

  return (
    <>
      <ScrollToTop />
      {!isAuth && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/about" element={<Page><About /></Page>} />
          <Route path="/features" element={<Page><Features /></Page>} />
          <Route path="/pricing" element={<Page><Pricing /></Page>} />
          <Route path="/contact" element={<Page><Contact /></Page>} />
          <Route path="/register" element={<Page><Register /></Page>} />
          <Route path="/signin" element={<Page><SignIn /></Page>} />
        </Routes>
      </AnimatePresence>
      {!isAuth && <Footer />}
    </>
  )
}
